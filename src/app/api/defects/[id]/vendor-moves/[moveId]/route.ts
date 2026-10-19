import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateVendorMoveSchema = z.object({
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; moveId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateVendorMoveSchema.parse(body);

    // Check defect exists and has correct status
    const defect = await prisma.defect.findUnique({
      where: { id: params.id },
    });

    if (!defect) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Defect not found' } }, { status: 404 });
    }

    if (defect.status !== 'WITH_VENDOR') {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'INVALID_STATUS', message: 'Defect must be WITH_VENDOR to receive from vendor' } 
      }, { status: 400 });
    }

    // Check vendor move exists and belongs to this defect
    const vendorMove = await prisma.defectVendorMove.findFirst({
      where: { 
        id: params.moveId,
        defectId: params.id,
      },
    });

    if (!vendorMove) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor move not found' } }, { status: 404 });
    }

    if (vendorMove.receivedAt) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'ALREADY_RECEIVED', message: 'This vendor move has already been received' } 
      }, { status: 400 });
    }

    // Update vendor move and defect status in a transaction
    const [updatedMove] = await prisma.$transaction([
      prisma.defectVendorMove.update({
        where: { id: params.moveId },
        data: {
          receivedAt: new Date(),
          notes: validated.notes !== undefined ? validated.notes : vendorMove.notes,
        },
        include: { vendor: true },
      }),
      prisma.defect.update({
        where: { id: params.id },
        data: { status: 'READY_FOR_CUSTOMER' },
      }),
    ]);

    return NextResponse.json({ success: true, data: updatedMove });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } 
      }, { status: 400 });
    }
    console.error('Error updating vendor move:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}
