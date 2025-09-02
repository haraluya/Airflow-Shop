import { 
  NotionConfig,
  NotionPagedResult,
  NotionQueryParams,
  SyncError,
  SyncErrorType
} from '../types/notion';

/**
 * Notion API 服務
 * 處理與 Notion API 的所有互動
 */
export class NotionAPIService {
  private config: NotionConfig;
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;

  constructor(config: NotionConfig) {
    this.config = config;
  }

  /**
   * 搜尋資料庫
   */
  async queryDatabase(
    databaseId: string, 
    params?: NotionQueryParams
  ): Promise<NotionPagedResult<any>> {
    const url = `${this.config.baseUrl}/databases/${databaseId}/query`;
    
    const body = {
      ...params,
      page_size: params?.pageSize || 100,
      start_cursor: params?.startCursor
    };

    const response = await this.makeRequest('POST', url, body);
    
    return {
      results: response.results,
      nextCursor: response.next_cursor,
      hasMore: response.has_more,
      totalCount: response.results.length
    };
  }

  /**
   * 獲取頁面
   */
  async getPage(pageId: string): Promise<any> {
    const url = `${this.config.baseUrl}/pages/${pageId}`;
    return this.makeRequest('GET', url);
  }

  /**
   * 創建頁面
   */
  async createPage(databaseId: string, properties: any): Promise<any> {
    const url = `${this.config.baseUrl}/pages`;
    
    const body = {
      parent: { database_id: databaseId },
      properties
    };

    return this.makeRequest('POST', url, body);
  }

  /**
   * 更新頁面
   */
  async updatePage(pageId: string, properties: any): Promise<any> {
    const url = `${this.config.baseUrl}/pages/${pageId}`;
    
    const body = { properties };

    return this.makeRequest('PATCH', url, body);
  }

  /**
   * 刪除頁面（歸檔）
   */
  async deletePage(pageId: string): Promise<any> {
    const url = `${this.config.baseUrl}/pages/${pageId}`;
    
    const body = { archived: true };

    return this.makeRequest('PATCH', url, body);
  }

  /**
   * 獲取資料庫
   */
  async getDatabase(databaseId: string): Promise<any> {
    const url = `${this.config.baseUrl}/databases/${databaseId}`;
    return this.makeRequest('GET', url);
  }

  /**
   * 批次查詢所有頁面
   */
  async queryAllPages(
    databaseId: string,
    params?: NotionQueryParams
  ): Promise<any[]> {
    const allResults: any[] = [];
    let cursor: string | undefined = params?.startCursor;
    let hasMore = true;

    while (hasMore) {
      const result = await this.queryDatabase(databaseId, {
        ...params,
        startCursor: cursor
      });

      allResults.push(...result.results);
      hasMore = result.hasMore;
      cursor = result.nextCursor;

      // 避免 API 速率限制
      await this.delay(100);
    }

    return allResults;
  }

  /**
   * 批次創建頁面
   */
  async createPages(
    databaseId: string, 
    pagesData: any[]
  ): Promise<{ successes: any[]; errors: SyncError[] }> {
    const successes: any[] = [];
    const errors: SyncError[] = [];

    for (const pageData of pagesData) {
      try {
        const result = await this.createPage(databaseId, pageData.properties);
        successes.push({
          ...result,
          originalData: pageData
        });
      } catch (error) {
        errors.push(this.createSyncError(
          pageData.id || 'unknown',
          'page',
          error
        ));
      }

      // 控制請求速率
      await this.delay(1000 / this.config.rateLimitPerSecond);
    }

    return { successes, errors };
  }

  /**
   * 批次更新頁面
   */
  async updatePages(
    pagesData: Array<{ pageId: string; properties: any }>
  ): Promise<{ successes: any[]; errors: SyncError[] }> {
    const successes: any[] = [];
    const errors: SyncError[] = [];

    for (const pageData of pagesData) {
      try {
        const result = await this.updatePage(pageData.pageId, pageData.properties);
        successes.push({
          ...result,
          originalData: pageData
        });
      } catch (error) {
        errors.push(this.createSyncError(
          pageData.pageId,
          'page',
          error
        ));
      }

      // 控制請求速率
      await this.delay(1000 / this.config.rateLimitPerSecond);
    }

    return { successes, errors };
  }

  /**
   * 驗證 API 連接
   */
  async validateConnection(): Promise<{ valid: boolean; error?: string }> {
    try {
      // 嘗試獲取使用者資訊
      await this.makeRequest('GET', `${this.config.baseUrl}/users/me`);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 獲取資料庫 schema
   */
  async getDatabaseSchema(databaseId: string): Promise<{
    properties: Record<string, any>;
    title: string;
  }> {
    const database = await this.getDatabase(databaseId);
    return {
      properties: database.properties,
      title: database.title?.[0]?.plain_text || 'Untitled'
    };
  }

  /**
   * 建立 HTTP 請求
   */
  private async makeRequest(
    method: string, 
    url: string, 
    body?: any
  ): Promise<any> {
    // 加入速率限制佇列
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          await this.enforceRateLimit();
          
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.config.authToken}`,
            'Notion-Version': this.config.version,
            'Content-Type': 'application/json'
          };

          const config: RequestInit = {
            method,
            headers,
            ...(body && { body: JSON.stringify(body) })
          };

          const response = await fetch(url, config);
          
          if (!response.ok) {
            const errorBody = await response.text();
            let errorData;
            
            try {
              errorData = JSON.parse(errorBody);
            } catch {
              errorData = { message: errorBody };
            }

            throw new Error(`Notion API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
          }

          const data = await response.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * 處理速率限制佇列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.rateLimitQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.rateLimitQueue.length > 0) {
      const request = this.rateLimitQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Queue request error:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * 強制執行速率限制
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.config.rateLimitPerSecond;

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await this.delay(waitTime);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * 延遲執行
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 創建同步錯誤
   */
  private createSyncError(
    recordId: string, 
    recordType: string, 
    error: any
  ): SyncError {
    let errorType = SyncErrorType.UNKNOWN_ERROR;
    let errorMessage = 'Unknown error';

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('rate_limited')) {
        errorType = SyncErrorType.API_RATE_LIMIT;
      } else if (errorMessage.includes('unauthorized')) {
        errorType = SyncErrorType.AUTHENTICATION_ERROR;
      } else if (errorMessage.includes('forbidden')) {
        errorType = SyncErrorType.PERMISSION_ERROR;
      } else if (errorMessage.includes('validation')) {
        errorType = SyncErrorType.VALIDATION_ERROR;
      }
    }

    return {
      recordId,
      recordType,
      errorType,
      errorMessage,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.config.retryAttempts,
      resolved: false
    };
  }

  /**
   * 重試失敗的請求
   */
  async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.retryAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // 指數退避
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }
}

// 預設配置
export const defaultNotionConfig: NotionConfig = {
  authToken: process.env.NOTION_API_KEY || '',
  version: '2022-06-28',
  baseUrl: 'https://api.notion.com/v1',
  rateLimitPerSecond: 3, // Notion API 限制每秒3次請求
  retryAttempts: 3,
  retryDelay: 1000
};