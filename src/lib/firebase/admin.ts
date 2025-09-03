// 管理員與成員管理服務

import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { AdminMember, AdminRole, Permission, Subdomain, RESERVED_SUBDOMAINS } from '@/lib/types/admin'

export class AdminService {
  private readonly collection = 'admins'
  private readonly subdomainCollection = 'subdomains'

  // ===== 管理員成員管理 =====
  
  /**
   * 創建新的管理員成員
   */
  async createMember(memberData: Omit<AdminMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collection), {
        ...memberData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      return docRef.id
    } catch (error) {
      console.error('創建管理員成員失敗:', error)
      throw new Error('創建管理員成員失敗')
    }
  }

  /**
   * 更新管理員成員資料
   */
  async updateMember(memberId: string, updates: Partial<AdminMember>): Promise<void> {
    try {
      const docRef = doc(db, this.collection, memberId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('更新管理員成員失敗:', error)
      throw new Error('更新管理員成員失敗')
    }
  }

  /**
   * 刪除管理員成員
   */
  async deleteMember(memberId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, memberId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('刪除管理員成員失敗:', error)
      throw new Error('刪除管理員成員失敗')
    }
  }

  /**
   * 取得單一管理員成員資料
   */
  async getMember(memberId: string): Promise<AdminMember | null> {
    try {
      const docRef = doc(db, this.collection, memberId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return null
      }

      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate()
      } as AdminMember
    } catch (error) {
      console.error('取得管理員成員失敗:', error)
      throw new Error('取得管理員成員失敗')
    }
  }

  /**
   * 取得所有管理員成員列表
   */
  async getAllMembers(): Promise<AdminMember[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, this.collection), orderBy('createdAt', 'desc'))
      )

      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate()
        } as AdminMember
      })
    } catch (error) {
      console.error('取得管理員成員列表失敗:', error)
      throw new Error('取得管理員成員列表失敗')
    }
  }

  /**
   * 根據角色篩選管理員成員
   */
  async getMembersByRole(role: AdminRole): Promise<AdminMember[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.collection), 
          where('role', '==', role),
          orderBy('createdAt', 'desc')
        )
      )

      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate()
        } as AdminMember
      })
    } catch (error) {
      console.error('根據角色取得管理員成員失敗:', error)
      throw new Error('根據角色取得管理員成員失敗')
    }
  }

  /**
   * 更新最後登入時間
   */
  async updateLastLogin(memberId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, memberId)
      await updateDoc(docRef, {
        lastLoginAt: Timestamp.now()
      })
    } catch (error) {
      console.error('更新最後登入時間失敗:', error)
      // 不拋出錯誤，因為這不是關鍵功能
    }
  }

  // ===== 子網域管理 =====

  /**
   * 創建新的子網域
   */
  async createSubdomain(subdomainData: Omit<Subdomain, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // 檢查子網域是否為保留字
      if (RESERVED_SUBDOMAINS.includes(subdomainData.subdomain.toLowerCase())) {
        throw new Error('此子網域名稱為系統保留字，無法使用')
      }

      // 檢查子網域是否已存在
      const existingSubdomain = await this.getSubdomainByName(subdomainData.subdomain)
      if (existingSubdomain) {
        throw new Error('此子網域名稱已被使用')
      }

      const docRef = await addDoc(collection(db, this.subdomainCollection), {
        ...subdomainData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      return docRef.id
    } catch (error) {
      console.error('創建子網域失敗:', error)
      throw error instanceof Error ? error : new Error('創建子網域失敗')
    }
  }

  /**
   * 更新子網域資料
   */
  async updateSubdomain(subdomainId: string, updates: Partial<Subdomain>): Promise<void> {
    try {
      const docRef = doc(db, this.subdomainCollection, subdomainId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('更新子網域失敗:', error)
      throw new Error('更新子網域失敗')
    }
  }

  /**
   * 刪除子網域
   */
  async deleteSubdomain(subdomainId: string): Promise<void> {
    try {
      const docRef = doc(db, this.subdomainCollection, subdomainId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('刪除子網域失敗:', error)
      throw new Error('刪除子網域失敗')
    }
  }

  /**
   * 根據名稱取得子網域
   */
  async getSubdomainByName(subdomainName: string): Promise<Subdomain | null> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.subdomainCollection),
          where('subdomain', '==', subdomainName.toLowerCase())
        )
      )

      if (querySnapshot.empty) {
        return null
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Subdomain
    } catch (error) {
      console.error('取得子網域失敗:', error)
      throw new Error('取得子網域失敗')
    }
  }

  /**
   * 取得所有子網域
   */
  async getAllSubdomains(): Promise<Subdomain[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, this.subdomainCollection), orderBy('createdAt', 'desc'))
      )

      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Subdomain
      })
    } catch (error) {
      console.error('取得子網域列表失敗:', error)
      throw new Error('取得子網域列表失敗')
    }
  }

  /**
   * 根據業務員 ID 取得子網域
   */
  async getSubdomainBySalesperson(salespersonId: string): Promise<Subdomain | null> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.subdomainCollection),
          where('salespersonId', '==', salespersonId)
        )
      )

      if (querySnapshot.empty) {
        return null
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Subdomain
    } catch (error) {
      console.error('根據業務員取得子網域失敗:', error)
      throw new Error('根據業務員取得子網域失敗')
    }
  }

  /**
   * 檢查子網域名稱是否可用
   */
  async isSubdomainAvailable(subdomainName: string): Promise<boolean> {
    try {
      // 檢查是否為保留字
      if (RESERVED_SUBDOMAINS.includes(subdomainName.toLowerCase())) {
        return false
      }

      // 檢查是否已存在
      const existing = await this.getSubdomainByName(subdomainName)
      return existing === null
    } catch (error) {
      console.error('檢查子網域可用性失敗:', error)
      return false
    }
  }

  // ===== 統計資料 =====

  /**
   * 取得管理後台統計資料
   */
  async getDashboardStats(): Promise<{
    totalMembers: number
    activeMembers: number
    totalSubdomains: number
    activeSubdomains: number
  }> {
    try {
      const [membersSnapshot, subdomainsSnapshot] = await Promise.all([
        getDocs(collection(db, this.collection)),
        getDocs(collection(db, this.subdomainCollection))
      ])

      const members = membersSnapshot.docs.map(doc => doc.data())
      const subdomains = subdomainsSnapshot.docs.map(doc => doc.data())

      return {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.isActive).length,
        totalSubdomains: subdomains.length,
        activeSubdomains: subdomains.filter(s => s.isActive).length
      }
    } catch (error) {
      console.error('取得統計資料失敗:', error)
      throw new Error('取得統計資料失敗')
    }
  }
}

// 匯出單例實例
export const adminService = new AdminService()