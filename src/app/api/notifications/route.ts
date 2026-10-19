import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/services/notification.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const notifications = await NotificationService.getUnread();
    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'markAllRead') {
      await NotificationService.markAllAsRead();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Invalid action' } }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}
