import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createDefectSchema = z.object({
  customerId: z.string().uuid().optional(),
  itemId: z.string().uuid().optional(),
  itemName: z.string().min(1),
  serialNumber: z.string().optional(),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || undefined;

    const where = status ? { status: status as any } : {};

    const [defects, total] = await Promise.all([
      prisma.defect.findMany({
        where,
        include: { customer: true, item: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.defect.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: defects,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error listing defects:', error);
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
    const validated = createDefectSchema.parse(body);

    // Generate sequential defect number
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `DEF-${dateStr}-`;
    
    const lastDefect = await prisma.defect.findFirst({
      where: { defectNumber: { startsWith: prefix } },
      orderBy: { defectNumber: 'desc' },
    });

    let defectNumber: string;
    if (lastDefect) {
      const lastSeq = lastDefect.defectNumber.slice(-6);
      const nextNum = parseInt(lastSeq, 10) + 1;
      defectNumber = `${prefix}${nextNum.toString().padStart(6, '0')}`;
    } else {
      defectNumber = `${prefix}000001`;
    }

    const defect = await prisma.defect.create({
      data: {
        defectNumber,
        ...validated,
        intakeDate: new Date(),
      },
      include: { customer: true, item: true },
    });

    return NextResponse.json({ success: true, data: defect }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    console.error('Error creating defect:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}
