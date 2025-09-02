import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { NotionAPIService, defaultNotionConfig } from './notion-api';
import {
  SyncConfiguration,
  SyncTask,
  SyncStatus,
  SyncDirection,
  NotionDatabase,
  ChangeRecord,
  ChangeType,
  BatchSyncResult,
  SyncStatistics,
  SyncHealthCheck,
  NotionPropertyMapping,
  ConflictResolution,
  NotionWebhookEvent,
  SyncError
} from '../types/notion';
import { Order } from '../types/order';
import { User } from '../types/auth';
import { Product } from '../types/product';

/**
 * Notion 同步服務
 * 處理 Firebase 與 Notion 之間的雙向資料同步
 */
export class NotionSyncService {
  private notionAPI: NotionAPIService;
  private syncConfigurations: Map<NotionDatabase, SyncConfiguration> = new Map();
  private isInitialized = false;

  constructor() {
    this.notionAPI = new NotionAPIService(defaultNotionConfig);
  }

  /**
   * 初始化同步服務
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 載入同步配置
      await this.loadSyncConfigurations();
      
      // 驗證 Notion API 連接
      const connectionValid = await this.notionAPI.validateConnection();
      if (!connectionValid.valid) {
        throw new Error(`Notion API 連接失敗: ${connectionValid.error}`);
      }

      this.isInitialized = true;
      console.log('Notion 同步服務初始化成功');
    } catch (error) {
      console.error('Notion 同步服務初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 執行完整同步
   */
  async performFullSync(
    database: NotionDatabase,
    userId: string
  ): Promise<BatchSyncResult> {
    await this.ensureInitialized();

    const config = this.syncConfigurations.get(database);
    if (!config || !config.enabled) {
      throw new Error(`資料庫 ${database} 的同步未配置或已停用`);
    }

    const taskId = this.generateTaskId();
    const task: SyncTask = {
      id: taskId,
      taskType: 'full_sync',
      database,
      direction: config.syncDirection,
      status: SyncStatus.SYNCING,
      startedAt: new Date(),
      totalRecords: 0,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      createdBy: userId
    };

    try {
      // 儲存任務記錄
      await this.saveSyncTask(task);

      let result: BatchSyncResult;

      switch (config.syncDirection) {
        case SyncDirection.FIREBASE_TO_NOTION:
          result = await this.syncFirebaseToNotion(database, config, task);
          break;
        case SyncDirection.NOTION_TO_FIREBASE:
          result = await this.syncNotionToFirebase(database, config, task);
          break;
        case SyncDirection.BIDIRECTIONAL:
          // 雙向同步需要特殊處理
          result = await this.performBidirectionalSync(database, config, task);
          break;
        default:
          throw new Error(`不支援的同步方向: ${config.syncDirection}`);
      }

      // 更新任務狀態
      task.status = SyncStatus.SUCCESS;
      task.completedAt = new Date();
      task.successCount = result.successCount;
      task.errorCount = result.errorCount;
      task.errors = result.errors;

      await this.updateSyncTask(task);

      // 更新配置中的最後同步時間
      config.lastSyncTime = new Date();
      await this.saveSyncConfiguration(database, config);

      return result;

    } catch (error) {
      task.status = SyncStatus.FAILED;
      task.completedAt = new Date();
      
      if (error instanceof Error) {
        task.errors.push({
          recordId: 'system',
          recordType: 'sync_task',
          errorType: 'unknown_error' as any,
          errorMessage: error.message,
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
          resolved: false
        });
      }

      await this.updateSyncTask(task);
      throw error;
    }
  }

  /**
   * Firebase → Notion 同步
   */
  private async syncFirebaseToNotion(
    database: NotionDatabase,
    config: SyncConfiguration,
    task: SyncTask
  ): Promise<BatchSyncResult> {
    const startTime = Date.now();
    let successCount = 0;
    const errors: SyncError[] = [];

    try {
      // 從 Firebase 獲取資料
      const firebaseData = await this.getFirebaseData(config.firebaseCollection);
      task.totalRecords = firebaseData.length;
      await this.updateSyncTask(task);

      // 獲取現有的 Notion 資料
      const notionData = await this.notionAPI.queryAllPages(config.databaseId);
      const notionRecordMap = new Map(
        notionData.map(record => [this.extractFirebaseId(record), record])
      );

      // 處理每筆記錄
      for (const firebaseRecord of firebaseData) {
        try {
          const recordId = firebaseRecord.id;
          const existingNotionRecord = notionRecordMap.get(recordId);

          if (existingNotionRecord) {
            // 更新現有記錄
            const notionProperties = this.transformFirebaseToNotion(firebaseRecord, config.propertyMappings);
            await this.notionAPI.updatePage(existingNotionRecord.id, notionProperties);
            successCount++;
          } else {
            // 創建新記錄
            const notionProperties = this.transformFirebaseToNotion(firebaseRecord, config.propertyMappings);
            await this.notionAPI.createPage(config.databaseId, notionProperties);
            successCount++;
          }

          task.processedRecords++;
          
          // 定期更新任務狀態
          if (task.processedRecords % 10 === 0) {
            await this.updateSyncTask(task);
          }

        } catch (error) {
          errors.push(this.notionAPI['createSyncError'](
            firebaseRecord.id,
            database,
            error
          ));
        }
      }

      return {
        taskId: task.id,
        totalRecords: task.totalRecords,
        successCount,
        errorCount: errors.length,
        errors,
        completedAt: new Date(),
        duration: Date.now() - startTime
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Notion → Firebase 同步
   */
  private async syncNotionToFirebase(
    database: NotionDatabase,
    config: SyncConfiguration,
    task: SyncTask
  ): Promise<BatchSyncResult> {
    const startTime = Date.now();
    let successCount = 0;
    const errors: SyncError[] = [];

    try {
      // 從 Notion 獲取資料
      const notionData = await this.notionAPI.queryAllPages(config.databaseId);
      task.totalRecords = notionData.length;
      await this.updateSyncTask(task);

      // 處理每筆記錄
      for (const notionRecord of notionData) {
        try {
          const firebaseData = this.transformNotionToFirebase(notionRecord, config.propertyMappings);
          const firebaseId = this.extractFirebaseId(notionRecord);

          if (firebaseId) {
            // 更新或創建 Firebase 記錄
            const docRef = doc(db, config.firebaseCollection, firebaseId);
            await setDoc(docRef, firebaseData, { merge: true });
            successCount++;
          }

          task.processedRecords++;
          
          // 定期更新任務狀態
          if (task.processedRecords % 10 === 0) {
            await this.updateSyncTask(task);
          }

        } catch (error) {
          errors.push(this.notionAPI['createSyncError'](
            notionRecord.id,
            database,
            error
          ));
        }
      }

      return {
        taskId: task.id,
        totalRecords: task.totalRecords,
        successCount,
        errorCount: errors.length,
        errors,
        completedAt: new Date(),
        duration: Date.now() - startTime
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 雙向同步
   */
  private async performBidirectionalSync(
    database: NotionDatabase,
    config: SyncConfiguration,
    task: SyncTask
  ): Promise<BatchSyncResult> {
    // 雙向同步較複雜，需要處理衝突
    // 這裡實現基本的邏輯，根據最後修改時間決定優先權
    
    const startTime = Date.now();
    let successCount = 0;
    const errors: SyncError[] = [];

    try {
      // 獲取兩邊的資料
      const [firebaseData, notionData] = await Promise.all([
        this.getFirebaseData(config.firebaseCollection),
        this.notionAPI.queryAllPages(config.databaseId)
      ]);

      task.totalRecords = Math.max(firebaseData.length, notionData.length);
      await this.updateSyncTask(task);

      // 建立映射
      const firebaseMap = new Map(firebaseData.map(record => [record.id, record]));
      const notionMap = new Map(notionData.map(record => [this.extractFirebaseId(record), record]));

      // 處理所有唯一的記錄 ID
      const allIds = new Set([...firebaseMap.keys(), ...notionMap.keys()]);

      for (const id of allIds) {
        try {
          const firebaseRecord = firebaseMap.get(id);
          const notionRecord = notionMap.get(id);

          if (firebaseRecord && notionRecord) {
            // 兩邊都有，需要檢查衝突
            await this.resolveConflict(id, firebaseRecord, notionRecord, config);
          } else if (firebaseRecord && !notionRecord) {
            // 只有 Firebase 有，同步到 Notion
            const notionProperties = this.transformFirebaseToNotion(firebaseRecord, config.propertyMappings);
            await this.notionAPI.createPage(config.databaseId, notionProperties);
          } else if (!firebaseRecord && notionRecord) {
            // 只有 Notion 有，同步到 Firebase
            const firebaseData = this.transformNotionToFirebase(notionRecord, config.propertyMappings);
            const docRef = doc(db, config.firebaseCollection, id);
            await setDoc(docRef, firebaseData);
          }

          successCount++;
          task.processedRecords++;

        } catch (error) {
          errors.push(this.notionAPI['createSyncError'](
            id,
            database,
            error
          ));
        }
      }

      return {
        taskId: task.id,
        totalRecords: task.totalRecords,
        successCount,
        errorCount: errors.length,
        errors,
        completedAt: new Date(),
        duration: Date.now() - startTime
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 處理 Notion Webhook 事件
   */
  async processWebhookEvent(event: NotionWebhookEvent): Promise<void> {
    try {
      // 根據事件類型處理
      switch (event.action) {
        case 'created':
          await this.handleNotionRecordCreated(event);
          break;
        case 'updated':
          await this.handleNotionRecordUpdated(event);
          break;
        case 'deleted':
          await this.handleNotionRecordDeleted(event);
          break;
      }

      // 標記事件為已處理
      event.processed = true;
      event.processedAt = new Date();
      await this.saveWebhookEvent(event);

    } catch (error) {
      console.error('處理 Webhook 事件失敗:', error);
      event.error = error instanceof Error ? error.message : 'Unknown error';
      await this.saveWebhookEvent(event);
    }
  }

  /**
   * 獲取同步統計
   */
  async getSyncStatistics(database: NotionDatabase): Promise<SyncStatistics> {
    const config = this.syncConfigurations.get(database);
    
    // 從 Firebase 獲取同步任務歷史
    const tasksQuery = query(
      collection(db, 'syncTasks'),
      where('database', '==', database),
      orderBy('startedAt', 'desc'),
      limit(100)
    );

    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => doc.data() as SyncTask);

    const totalSyncs = tasks.length;
    const successfulSyncs = tasks.filter(t => t.status === SyncStatus.SUCCESS).length;
    const failedSyncs = tasks.filter(t => t.status === SyncStatus.FAILED).length;

    const completedTasks = tasks.filter(t => t.completedAt);
    const averageDuration = completedTasks.length > 0 
      ? completedTasks.reduce((sum, task) => {
          return sum + (task.completedAt!.getTime() - task.startedAt.getTime());
        }, 0) / completedTasks.length
      : 0;

    const totalRecordsSynced = tasks.reduce((sum, task) => sum + task.successCount, 0);

    return {
      database,
      lastSyncTime: config?.lastSyncTime,
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      averageSyncDuration: averageDuration,
      totalRecordsSynced,
      currentStatus: tasks[0]?.status || SyncStatus.PENDING,
      errorRate: totalSyncs > 0 ? failedSyncs / totalSyncs : 0,
      uptime: totalSyncs > 0 ? successfulSyncs / totalSyncs : 1
    };
  }

  /**
   * 健康檢查
   */
  async performHealthCheck(): Promise<SyncHealthCheck> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 檢查 API 連接
    const connectionValid = await this.notionAPI.validateConnection();
    
    // 檢查各資料庫狀態
    const databaseStatuses = [];
    for (const database of Object.values(NotionDatabase)) {
      const stats = await this.getSyncStatistics(database);
      const config = this.syncConfigurations.get(database);
      
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      let message = '正常運作';

      if (!config?.enabled) {
        status = 'warning';
        message = '同步已停用';
      } else if (stats.errorRate > 0.1) {
        status = 'error';
        message = `錯誤率過高: ${(stats.errorRate * 100).toFixed(1)}%`;
      } else if (!stats.lastSyncTime || 
                 (Date.now() - stats.lastSyncTime.getTime()) > 24 * 60 * 60 * 1000) {
        status = 'warning';
        message = '超過24小時未同步';
      }

      databaseStatuses.push({
        database,
        status,
        lastSync: stats.lastSyncTime || new Date(0),
        message
      });
    }

    // 決定整體健康狀態
    const hasErrors = databaseStatuses.some(d => d.status === 'error') || !connectionValid.valid;
    const hasWarnings = databaseStatuses.some(d => d.status === 'warning');

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (hasErrors) {
      overall = 'critical';
    } else if (hasWarnings) {
      overall = 'warning';
    }

    if (!connectionValid.valid) {
      errors.push(`Notion API 連接失敗: ${connectionValid.error}`);
    }

    return {
      overall,
      databases: databaseStatuses,
      apiConnectivity: connectionValid.valid,
      authenticationValid: connectionValid.valid,
      queueStatus: {
        pending: 0, // 需要實際的佇列狀態
        processing: 0,
        failed: 0
      },
      errors,
      warnings
    };
  }

  // 輔助方法

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async loadSyncConfigurations(): Promise<void> {
    const configsSnapshot = await getDocs(collection(db, 'syncConfigurations'));
    
    configsSnapshot.docs.forEach(doc => {
      const config = doc.data() as SyncConfiguration;
      this.syncConfigurations.set(doc.id as NotionDatabase, config);
    });
  }

  private async saveSyncConfiguration(database: NotionDatabase, config: SyncConfiguration): Promise<void> {
    await setDoc(doc(db, 'syncConfigurations', database), config);
  }

  private async getFirebaseData(collectionName: string): Promise<any[]> {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // 轉換 Timestamp 為 Date
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      orderDate: doc.data().orderDate?.toDate?.() || doc.data().orderDate
    }));
  }

  private transformFirebaseToNotion(data: any, mappings: NotionPropertyMapping[]): any {
    const properties: any = {};
    
    mappings.forEach(mapping => {
      const value = data[mapping.firebaseField];
      if (value !== undefined) {
        properties[mapping.notionProperty] = this.convertToNotionProperty(
          value, 
          mapping.propertyType
        );
      }
    });

    return properties;
  }

  private transformNotionToFirebase(data: any, mappings: NotionPropertyMapping[]): any {
    const result: any = {};
    
    mappings.forEach(mapping => {
      const notionProperty = data.properties?.[mapping.notionProperty];
      if (notionProperty) {
        result[mapping.firebaseField] = this.convertFromNotionProperty(
          notionProperty,
          mapping.propertyType
        );
      }
    });

    return result;
  }

  private convertToNotionProperty(value: any, propertyType: string): any {
    // 根據屬性類型轉換 Firebase 資料為 Notion 格式
    switch (propertyType) {
      case 'title':
        return { title: [{ text: { content: String(value) } }] };
      case 'rich_text':
        return { rich_text: [{ text: { content: String(value) } }] };
      case 'number':
        return { number: Number(value) };
      case 'select':
        return { select: { name: String(value) } };
      case 'date':
        return { date: { start: value instanceof Date ? value.toISOString() : value } };
      case 'checkbox':
        return { checkbox: Boolean(value) };
      default:
        return value;
    }
  }

  private convertFromNotionProperty(property: any, propertyType: string): any {
    // 根據屬性類型轉換 Notion 資料為 Firebase 格式
    switch (propertyType) {
      case 'title':
        return property.title?.[0]?.text?.content || '';
      case 'rich_text':
        return property.rich_text?.[0]?.text?.content || '';
      case 'number':
        return property.number;
      case 'select':
        return property.select?.name;
      case 'date':
        return property.date?.start ? new Date(property.date.start) : null;
      case 'checkbox':
        return property.checkbox;
      default:
        return property;
    }
  }

  private extractFirebaseId(notionRecord: any): string {
    // 從 Notion 記錄中提取 Firebase ID
    // 假設在 Notion 中有一個 "Firebase ID" 屬性
    return notionRecord.properties?.['Firebase ID']?.rich_text?.[0]?.text?.content || notionRecord.id;
  }

  private async resolveConflict(
    id: string, 
    firebaseRecord: any, 
    notionRecord: any, 
    config: SyncConfiguration
  ): Promise<void> {
    switch (config.conflictResolution) {
      case ConflictResolution.FIREBASE_WINS:
        // Firebase 資料優先，更新 Notion
        const notionProperties = this.transformFirebaseToNotion(firebaseRecord, config.propertyMappings);
        await this.notionAPI.updatePage(notionRecord.id, notionProperties);
        break;
        
      case ConflictResolution.NOTION_WINS:
        // Notion 資料優先，更新 Firebase
        const firebaseData = this.transformNotionToFirebase(notionRecord, config.propertyMappings);
        const docRef = doc(db, config.firebaseCollection, id);
        await setDoc(docRef, firebaseData, { merge: true });
        break;
        
      case ConflictResolution.LATEST_WINS:
        // 比較修改時間，最新的優先
        const firebaseUpdatedAt = firebaseRecord.updatedAt || firebaseRecord.createdAt;
        const notionUpdatedAt = new Date(notionRecord.last_edited_time);
        
        if (firebaseUpdatedAt > notionUpdatedAt) {
          const properties = this.transformFirebaseToNotion(firebaseRecord, config.propertyMappings);
          await this.notionAPI.updatePage(notionRecord.id, properties);
        } else {
          const data = this.transformNotionToFirebase(notionRecord, config.propertyMappings);
          const docRef = doc(db, config.firebaseCollection, id);
          await setDoc(docRef, data, { merge: true });
        }
        break;
        
      case ConflictResolution.MANUAL_RESOLVE:
        // 記錄衝突，等待手動解決
        await this.recordConflict(id, firebaseRecord, notionRecord, config);
        break;
    }
  }

  private async recordConflict(
    id: string, 
    firebaseRecord: any, 
    notionRecord: any, 
    config: SyncConfiguration
  ): Promise<void> {
    // 記錄資料衝突，供後續手動解決
    const conflict = {
      id: this.generateTaskId(),
      recordId: id,
      database: config.firebaseCollection,
      firebaseData: firebaseRecord,
      notionData: notionRecord,
      timestamp: new Date(),
      resolved: false
    };

    await setDoc(doc(db, 'dataConflicts', conflict.id), conflict);
  }

  private generateTaskId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveSyncTask(task: SyncTask): Promise<void> {
    await setDoc(doc(db, 'syncTasks', task.id), task);
  }

  private async updateSyncTask(task: SyncTask): Promise<void> {
    await updateDoc(doc(db, 'syncTasks', task.id), {
      status: task.status,
      processedRecords: task.processedRecords,
      successCount: task.successCount,
      errorCount: task.errorCount,
      errors: task.errors,
      completedAt: task.completedAt
    });
  }

  private async saveWebhookEvent(event: NotionWebhookEvent): Promise<void> {
    await setDoc(doc(db, 'notionWebhookEvents', event.id), event);
  }

  private async handleNotionRecordCreated(event: NotionWebhookEvent): Promise<void> {
    // 處理 Notion 記錄創建事件
    console.log('Notion 記錄已創建:', event.object);
  }

  private async handleNotionRecordUpdated(event: NotionWebhookEvent): Promise<void> {
    // 處理 Notion 記錄更新事件
    console.log('Notion 記錄已更新:', event.object);
  }

  private async handleNotionRecordDeleted(event: NotionWebhookEvent): Promise<void> {
    // 處理 Notion 記錄刪除事件
    console.log('Notion 記錄已刪除:', event.object);
  }
}

export const notionSyncService = new NotionSyncService();