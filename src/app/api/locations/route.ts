import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createLocationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['SHOWROOM', 'BASEMENT', 'WAREHOUSE', 'STORE']),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const locations = await prisma.location.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { stocks: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error('Error listing locations:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const validated = createLocationSchema.parse(body);

    const location = await prisma.location.create({ data: validated });
    return NextResponse.json({ success: true, data: location }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    console.error('Error creating location:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}
