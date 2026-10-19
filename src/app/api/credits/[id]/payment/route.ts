import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CreditService } from '@/services/credit.service';
import { TelegramService } from '@/services/telegram.service';
import { z } from 'zod';

const PaymentMethodEnum = z.enum(['CASH', 'MOBILE_TRANSFER', 'CREDIT', 'CARD', 'SPLIT_PAYMENT']);

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: PaymentMethodEnum,
  bankAccountId: z.string().uuid().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const validated = paymentSchema.parse(body);

    const payment = await CreditService.addPayment(params.id, validated);
    const credit = await CreditService.findById(params.id);

    // Send Telegram notification for credit payment
    if (credit) {
      const customerName = credit.customer?.name || 'Unknown';
      const balance = Number(credit.balance);
      const principal = Number(credit.principal);
      const isClosed = credit.status === 'CLOSED';
      const statusEmoji = isClosed ? '✅' : '🔵';
      const statusText = isClosed ? 'FULLY PAID' : 'PARTIAL PAYMENT';

      TelegramService.sendMessage(
        `${statusEmoji} <b>Credit Payment Received</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Customer:</b> ${customerName}\n` +
        `💰 <b>Payment:</b> ${validated.amount.toFixed(2)} ETB\n` +
        `💳 <b>Method:</b> ${validated.paymentMethod}\n` +
        `📊 <b>Status:</b> ${statusText}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📝 Principal: ${principal.toFixed(2)} ETB\n` +
        `💵 Remaining: ${balance.toFixed(2)} ETB\n` +
        `📅 Due: ${credit.dueDate ? new Date(credit.dueDate).toLocaleDateString() : 'N/A'}\n` +
        `🕐 ${new Date().toLocaleString()}`
      ).catch(() => {}); // Fire-and-forget
    }

    return NextResponse.json({ success: true, data: { payment, credit } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    console.error('Error recording credit payment:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}
