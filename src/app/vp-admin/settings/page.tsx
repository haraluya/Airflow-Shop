'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Save, Globe, Mail, Phone, MapPin, Settings2, Bell, Shield, Palette } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SystemSettings {
  // 網站基本設定
  siteName: string
  siteDescription: string
  siteKeywords: string
  logoUrl: string
  faviconUrl: string
  
  // 聯絡資訊
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  supportEmail: string
  
  // 業務設定
  enableRegistration: boolean
  requireApproval: boolean
  defaultPricingGroup: string
  enableReferralSystem: boolean
  
  // 通知設定
  enableEmailNotifications: boolean
  enableSmsNotifications: boolean
  notifyOnNewOrder: boolean
  notifyOnNewCustomer: boolean
  
  // 系統維護
  maintenanceMode: boolean
  maintenanceMessage: string
}

const defaultSettings: SystemSettings = {
  siteName: 'Airflow B2B 電商平台',
  siteDescription: '專業的電子煙批發平台',
  siteKeywords: '電子煙,批發,B2B,電商',
  logoUrl: '',
  faviconUrl: '',
  companyName: 'Airflow Company',
  companyAddress: '台灣台北市',
  companyPhone: '+886-2-1234-5678',
  companyEmail: 'info@airflow.com',
  supportEmail: 'support@airflow.com',
  enableRegistration: true,
  requireApproval: true,
  defaultPricingGroup: 'standard',
  enableReferralSystem: true,
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  notifyOnNewOrder: true,
  notifyOnNewCustomer: true,
  maintenanceMode: false,
  maintenanceMessage: '系統維護中，請稍後再試'
}

export default function SettingsPage() {
  const [user, loading, error] = useAuthState(auth)
  const [isAdmin, setIsAdmin] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [dataLoading, setDataLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return
      
      try {
        const adminDocRef = doc(db, 'admins', user.uid)
        const adminDoc = await getDoc(adminDocRef)
        
        if (!adminDoc.exists()) {
          router.push('/vp-admin')
          return
        }
        
        setIsAdmin(true)
        await loadSettings()
      } catch (error) {
        console.error('檢查管理員狀態失敗:', error)
        router.push('/vp-admin')
      }
    }

    if (!loading && user) {
      checkAdminStatus()
    } else if (!loading && !user) {
      router.push('/vp-admin')
    }
  }, [user, loading, router])

  const loadSettings = async () => {
    try {
      const settingsDocRef = doc(db, 'settings', 'system')
      const settingsDoc = await getDoc(settingsDocRef)
      
      if (settingsDoc.exists()) {
        setSettings({ ...defaultSettings, ...settingsDoc.data() })
      }
    } catch (error) {
      console.error('載入系統設定失敗:', error)
      toast.error('載入系統設定失敗')
    } finally {
      setDataLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const settingsDocRef = doc(db, 'settings', 'system')
      await setDoc(settingsDocRef, {
        ...settings,
        updatedAt: new Date(),
        updatedBy: user?.uid
      })
      
      toast.success('系統設定已儲存')
    } catch (error) {
      console.error('儲存系統設定失敗:', error)
      toast.error('儲存失敗，請稍後再試')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading || !isAdmin) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">系統設定</h1>
          <p className="text-muted-foreground">管理系統的基本設定與配置</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '儲存中...' : '儲存設定'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* 網站基本設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              網站基本設定
            </CardTitle>
            <CardDescription>
              設定網站的基本資訊與外觀
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siteName">網站名稱</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => updateSetting('siteName', e.target.value)}
                  placeholder="輸入網站名稱"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">公司名稱</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => updateSetting('companyName', e.target.value)}
                  placeholder="輸入公司名稱"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">網站描述</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => updateSetting('siteDescription', e.target.value)}
                placeholder="輸入網站描述"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteKeywords">關鍵字 (SEO)</Label>
              <Input
                id="siteKeywords"
                value={settings.siteKeywords}
                onChange={(e) => updateSetting('siteKeywords', e.target.value)}
                placeholder="關鍵字1, 關鍵字2, 關鍵字3"
              />
            </div>
          </CardContent>
        </Card>

        {/* 聯絡資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              聯絡資訊
            </CardTitle>
            <CardDescription>
              設定公司的聯絡方式與地址
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">聯絡電話</Label>
                <Input
                  id="companyPhone"
                  value={settings.companyPhone}
                  onChange={(e) => updateSetting('companyPhone', e.target.value)}
                  placeholder="+886-2-1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">公司信箱</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => updateSetting('companyEmail', e.target.value)}
                  placeholder="info@company.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">公司地址</Label>
              <Textarea
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => updateSetting('companyAddress', e.target.value)}
                placeholder="輸入完整地址"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">客服信箱</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                placeholder="support@company.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* 業務設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              業務設定
            </CardTitle>
            <CardDescription>
              設定業務相關的功能與流程
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableRegistration">開放會員註冊</Label>
                <p className="text-sm text-muted-foreground">
                  允許新客戶註冊帳號
                </p>
              </div>
              <Switch
                id="enableRegistration"
                checked={settings.enableRegistration}
                onCheckedChange={(checked) => updateSetting('enableRegistration', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireApproval">需要審核</Label>
                <p className="text-sm text-muted-foreground">
                  新會員需要管理員審核才能使用
                </p>
              </div>
              <Switch
                id="requireApproval"
                checked={settings.requireApproval}
                onCheckedChange={(checked) => updateSetting('requireApproval', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableReferralSystem">啟用推薦碼系統</Label>
                <p className="text-sm text-muted-foreground">
                  啟用業務員推薦碼分銷系統
                </p>
              </div>
              <Switch
                id="enableReferralSystem"
                checked={settings.enableReferralSystem}
                onCheckedChange={(checked) => updateSetting('enableReferralSystem', checked)}
              />
            </div>

            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="defaultPricingGroup">預設價格群組</Label>
              <select
                id="defaultPricingGroup"
                value={settings.defaultPricingGroup}
                onChange={(e) => updateSetting('defaultPricingGroup', e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="standard">標準價格</option>
                <option value="vip">VIP 價格</option>
                <option value="wholesale">批發價格</option>
                <option value="premium">高級會員價格</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 通知設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              通知設定
            </CardTitle>
            <CardDescription>
              設定系統通知與警示
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableEmailNotifications">郵件通知</Label>
                <p className="text-sm text-muted-foreground">
                  啟用系統郵件通知功能
                </p>
              </div>
              <Switch
                id="enableEmailNotifications"
                checked={settings.enableEmailNotifications}
                onCheckedChange={(checked) => updateSetting('enableEmailNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifyOnNewOrder">新訂單通知</Label>
                <p className="text-sm text-muted-foreground">
                  有新訂單時發送通知
                </p>
              </div>
              <Switch
                id="notifyOnNewOrder"
                checked={settings.notifyOnNewOrder}
                onCheckedChange={(checked) => updateSetting('notifyOnNewOrder', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifyOnNewCustomer">新客戶通知</Label>
                <p className="text-sm text-muted-foreground">
                  有新客戶註冊時發送通知
                </p>
              </div>
              <Switch
                id="notifyOnNewCustomer"
                checked={settings.notifyOnNewCustomer}
                onCheckedChange={(checked) => updateSetting('notifyOnNewCustomer', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 系統維護 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              系統維護
            </CardTitle>
            <CardDescription>
              系統維護模式與緊急設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode">維護模式</Label>
                <p className="text-sm text-muted-foreground">
                  啟用後前台將顯示維護中頁面
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
              />
            </div>
            
            {settings.maintenanceMode && (
              <div className="space-y-2">
                <Label htmlFor="maintenanceMessage">維護訊息</Label>
                <Textarea
                  id="maintenanceMessage"
                  value={settings.maintenanceMessage}
                  onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                  placeholder="輸入維護期間顯示的訊息"
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}