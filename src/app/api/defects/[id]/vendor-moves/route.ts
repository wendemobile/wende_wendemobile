import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createVendorMoveSchema = z.object({
  vendorId: z.string().uuid(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const vendorMoves = await prisma.defectVendorMove.findMany({
      where: { defectId: params.id },
      include: { vendor: true },
      orderBy: { sentAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: vendorMoves });
  } catch (error) {
    console.error('Error fetching vendor moves:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

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
    const validated = createVendorMoveSchema.parse(body);

    // Check defect exists and has correct status
    const defect = await prisma.defect.findUnique({
      where: { id: params.id },
    });

    if (!defect) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Defect not found' } }, { status: 404 });
    }

    if (defect.status !== 'DIAGNOSED') {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'INVALID_STATUS', message: 'Defect must be in DIAGNOSED status to send to vendor' } 
      }, { status: 400 });
    }

    // Check vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: validated.vendorId },
    });

    if (!vendor) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found' } }, { status: 404 });
    }

    // Create vendor move and update defect status in a transaction
    const [vendorMove] = await prisma.$transaction([
      prisma.defectVendorMove.create({
        data: {
          defectId: params.id,
          vendorId: validated.vendorId,
          sentAt: new Date(),
          notes: validated.notes,
        },
        include: { vendor: true },
      }),
      prisma.defect.update({
        where: { id: params.id },
        data: { status: 'WITH_VENDOR' },
      }),
    ]);

    return NextResponse.json({ success: true, data: vendorMove }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } 
      }, { status: 400 });
    }
    console.error('Error creating vendor move:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}
