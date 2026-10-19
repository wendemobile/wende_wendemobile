import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionService } from '@/services/session.service';
import { z } from 'zod';

const closeSessionSchema = z.object({
  actualCashCount: z.number().min(0),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const validated = closeSessionSchema.parse(body);

    const result = await SessionService.close(
      session.user.id,
      validated.actualCashCount,
      validated.notes
    );

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'CONF_001', message: result.error || 'Failed to close session' } 
      }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: result.session });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    console.error('Error closing session:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}
