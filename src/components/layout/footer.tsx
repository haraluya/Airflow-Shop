'use client';

import Link from 'next/link';
import { Package, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 公司資訊 */}
          <div className="space-y-4">
            <Link 
              href="/" 
              className="flex items-center space-x-2 font-bold text-xl bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent"
            >
              <Package className="h-6 w-6 text-primary" />
              Airflow B2B Shop
            </Link>
            <p className="text-sm text-muted-foreground">
              專為電子煙批發產業設計的整合性B2B電商與CRM平台，提供個人化的價格引擎與推薦碼分銷機制。
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>+886-2-1234-5678</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4" />
                <span>info@airflow-b2b.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>台北市信義區信義路五段7號</span>
              </div>
            </div>
          </div>

          {/* 商品分類 */}
          <div className="space-y-4">
            <h3 className="font-semibold">商品分類</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products?category=devices" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  電子煙設備
                </Link>
              </li>
              <li>
                <Link href="/products?category=liquids" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  煙油
                </Link>
              </li>
              <li>
                <Link href="/products?category=accessories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  配件
                </Link>
              </li>
              <li>
                <Link href="/products?category=coils" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  霧化芯
                </Link>
              </li>
              <li>
                <Link href="/products?category=batteries" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  電池
                </Link>
              </li>
            </ul>
          </div>

          {/* 客戶服務 */}
          <div className="space-y-4">
            <h3 className="font-semibold">客戶服務</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help/shipping" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  運送說明
                </Link>
              </li>
              <li>
                <Link href="/help/returns" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  退換貨政策
                </Link>
              </li>
              <li>
                <Link href="/help/payment" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  付款方式
                </Link>
              </li>
              <li>
                <Link href="/help/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  常見問題
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  聯絡我們
                </Link>
              </li>
            </ul>
          </div>

          {/* 關於我們 */}
          <div className="space-y-4">
            <h3 className="font-semibold">關於我們</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  公司介紹
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  最新消息
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  人才招募
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  隱私權政策
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  服務條款
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* 版權資訊 */}
            <div className="text-sm text-muted-foreground">
              © 2024 Airflow B2B Shop. All rights reserved.
            </div>

            {/* 社群媒體連結 */}
            <div className="flex space-x-4">
              <Link 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>

            {/* 語言/地區選擇 */}
            <div className="text-sm text-muted-foreground">
              🇹🇼 繁體中文 | TWD $
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}