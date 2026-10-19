import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionService } from '@/services/session.service';
import { z } from 'zod';

const openSessionSchema = z.object({
  openingCashBalance: z.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const validated = openSessionSchema.parse(body);

    const result = await SessionService.open(session.user.id, validated.openingCashBalance);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'CONF_SESSION_001', message: result.error || 'Session already open' } 
      }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: result.session }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    
    // Handle foreign key constraint error - user session is stale
    if (error?.code === 'P2003' || (error?.message && error.message.includes('foreign key constraint'))) {
      console.error('Stale session detected - user ID not found in database:', error);
      return NextResponse.json({ 
        success: false, 
        error: { 
          code: 'AUTH_002', 
          message: 'Session expired. Please log out and log back in.' 
        } 
      }, { status: 401 });
    }
    
    console.error('Error opening session:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}
