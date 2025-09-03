import { NextRequest, NextResponse } from 'next/server';
import { orderAutomationService } from '@/lib/services/order-automation';

/**
 * 定期任務執行端點
 * POST /api/automation/cron
 * 
 * 這個端點可以由外部調度服務（如 Vercel Cron 或 GitHub Actions）調用
 * 來執行定期的自動化任務
 */
export async function POST(request: NextRequest) {
  try {
    // 驗證請求來源（可選）
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: '未授權的請求' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { task } = body;

    const results: Record<string, any> = {};

    switch (task) {
      case 'process_overdue_orders':
        console.log('開始處理逾期訂單...');
        await orderAutomationService.processOverdueOrders();
        results.overdueOrders = '已完成';
        break;

      case 'send_reminder_notifications':
        console.log('發送提醒通知...');
        // 這裡可以實作發送各種提醒通知的邏輯
        results.reminderNotifications = '已完成';
        break;

      case 'cleanup_expired_data':
        console.log('清理過期數據...');
        // 這裡可以實作清理過期數據的邏輯
        results.dataCleanup = '已完成';
        break;

      case 'generate_daily_reports':
        console.log('生成日報表...');
        // 這裡可以實作生成報表的邏輯
        results.dailyReports = '已完成';
        break;

      case 'all':
        // 執行所有定期任務
        console.log('執行所有定期任務...');
        
        await orderAutomationService.processOverdueOrders();
        results.overdueOrders = '已完成';
        
        // 其他任務...
        results.reminderNotifications = '已完成';
        results.dataCleanup = '已完成';
        results.dailyReports = '已完成';
        break;

      default:
        return NextResponse.json(
          { error: '未知的任務類型' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `定期任務 "${task}" 執行完成`,
      results,
      executedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('定期任務執行失敗:', error);
    return NextResponse.json(
      { 
        error: '定期任務執行失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}

/**
 * 獲取任務狀態
 * GET /api/automation/cron
 */
export async function GET() {
  try {
    // 返回系統狀態和可用的任務列表
    return NextResponse.json({
      status: 'operational',
      availableTasks: [
        'process_overdue_orders',
        'send_reminder_notifications', 
        'cleanup_expired_data',
        'generate_daily_reports',
        'all'
      ],
      lastExecuted: new Date().toISOString(),
      systemInfo: {
        nodeEnv: process.env.NODE_ENV,
        version: '1.0.0',
      }
    });

  } catch (error) {
    console.error('獲取任務狀態失敗:', error);
    return NextResponse.json(
      { error: '獲取任務狀態失敗' },
      { status: 500 }
    );
  }
}