import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 公司資訊 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-primary"></div>
              <span className="text-xl font-bold gradient-text">Airflow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              專為電子煙批發產業量身打造的整合性B2B電商與客戶關係管理平台。
            </p>
          </div>

          {/* 快速連結 */}
          <div className="space-y-4">
            <h3 className="font-semibold">快速連結</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                首頁
              </Link>
              <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
                商品展示
              </Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                關於我們
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                聯絡我們
              </Link>
            </div>
          </div>

          {/* 會員服務 */}
          <div className="space-y-4">
            <h3 className="font-semibold">會員服務</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                會員登入
              </Link>
              <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">
                會員註冊
              </Link>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                忘記密碼
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                會員條款
              </a>
            </div>
          </div>

          {/* 聯絡資訊 */}
          <div className="space-y-4">
            <h3 className="font-semibold">聯絡我們</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📞 客服專線：0800-123-456</p>
              <p>📧 信箱：support@airflow-shop.com</p>
              <p>🏢 地址：台北市信義區信義路五段7號</p>
              <p>⏰ 營業時間：週一至週五 9:00-18:00</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2024 Airflow B2B Shop. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                服務條款
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                隱私政策
              </Link>
              <Link href="/sitemap" className="text-sm text-muted-foreground hover:text-foreground">
                網站地圖
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}