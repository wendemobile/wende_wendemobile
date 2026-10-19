import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TelegramService } from '@/services/telegram.service';

/**
 * GET /api/credits/due-today
 * 
 * Checks for credits due today and sends Telegram notifications.
 * Also updates overdue statuses for past-due credits.
 * 
 * This can be called:
 * - By a cron job (e.g., daily at 8 AM)
 * - By the dashboard on load
 * - Manually via the browser
 */
export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // 1. Find credits due TODAY that are still open
    const creditsDueToday = await prisma.credit.findMany({
      where: {
        status: { in: ['OPEN', 'OVERDUE'] },
        balance: { gt: 0 },
        dueDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        sale: { select: { receiptNumber: true } },
      },
      orderBy: { balance: 'desc' },
    });

    // 2. Find credits that are already overdue (past due date)
    const overdueCredits = await prisma.credit.findMany({
      where: {
        status: { in: ['OPEN', 'OVERDUE'] },
        balance: { gt: 0 },
        dueDate: { lt: todayStart },
      },
      include: {
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // 3. Update status of overdue credits from OPEN to OVERDUE
    await prisma.credit.updateMany({
      where: {
        status: 'OPEN',
        dueDate: { lt: todayStart },
        balance: { gt: 0 },
      },
      data: { status: 'OVERDUE' },
    });

    // 4. Send Telegram notification for credits DUE TODAY
    if (creditsDueToday.length > 0) {
      const totalDueToday = creditsDueToday.reduce((sum, c) => sum + Number(c.balance), 0);

      let message = `⏰ <b>CREDITS DUE TODAY</b>\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
      message += `📊 <b>${creditsDueToday.length}</b> credits due today\n`;
      message += `💰 <b>Total Due: ${totalDueToday.toFixed(2)} ETB</b>\n`;
      message += `━━━━━━━━━━━━━━━━━━\n\n`;

      creditsDueToday.forEach((credit, i) => {
        const customerName = credit.customer?.name || 'Unknown';
        const customerPhone = credit.customer?.phone || 'N/A';
        const balance = Number(credit.balance);
        const receipt = credit.sale?.receiptNumber || '-';

        message += `${i + 1}. <b>${customerName}</b>\n`;
        message += `   📞 ${customerPhone}\n`;
        message += `   💵 Balance: ${balance.toFixed(2)} ETB\n`;
        message += `   🧾 Receipt: ${receipt}\n\n`;
      });

      message += `🕐 ${now.toLocaleString()}`;

      await TelegramService.sendMessage(message);
    }

    // 5. Send Telegram notification for OVERDUE credits summary
    if (overdueCredits.length > 0) {
      const totalOverdue = overdueCredits.reduce((sum, c) => sum + Number(c.balance), 0);

      let message = `🔴 <b>OVERDUE CREDITS ALERT</b>\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
      message += `⚠️ <b>${overdueCredits.length}</b> overdue credits\n`;
      message += `💰 <b>Total Overdue: ${totalOverdue.toFixed(2)} ETB</b>\n`;
      message += `━━━━━━━━━━━━━━━━━━\n\n`;

      // Show top 10 overdue credits
      const top10 = overdueCredits.slice(0, 10);
      top10.forEach((credit, i) => {
        const customerName = credit.customer?.name || 'Unknown';
        const balance = Number(credit.balance);
        const dueDate = new Date(credit.dueDate);
        const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        message += `${i + 1}. <b>${customerName}</b> — ${balance.toFixed(2)} ETB`;
        message += ` (${daysLate}d late)\n`;
      });

      if (overdueCredits.length > 10) {
        message += `\n... and ${overdueCredits.length - 10} more\n`;
      }

      message += `\n🕐 ${now.toLocaleString()}`;

      await TelegramService.sendMessage(message);
    }

    return NextResponse.json({
      success: true,
      data: {
        dueTodayCount: creditsDueToday.length,
        overdueCount: overdueCredits.length,
        dueTodayTotal: creditsDueToday.reduce((sum, c) => sum + Number(c.balance), 0),
        overdueTotal: overdueCredits.reduce((sum, c) => sum + Number(c.balance), 0),
      },
    });
  } catch (error) {
    console.error('Credit due-today check error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to check due credits' } },
      { status: 500 }
    );
  }
}
