import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Valid status transitions for defect workflow
const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ['DIAGNOSED'],
  DIAGNOSED: ['WITH_VENDOR'], // WITH_VENDOR is set via vendor-moves endpoint
  WITH_VENDOR: ['READY_FOR_CUSTOMER'], // READY_FOR_CUSTOMER is set via vendor-moves endpoint
  READY_FOR_CUSTOMER: ['COMPLETED'],
  COMPLETED: [],
};

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const defect = await prisma.defect.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        item: true,
        notes: { orderBy: { createdAt: 'desc' } },
        vendorMoves: { 
          include: { vendor: true },
          orderBy: { sentAt: 'asc' },
        },
      },
    });

    if (!defect) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Defect not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: defect });
  } catch (error) {
    console.error('Error fetching defect:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const { status, priority } = body;

    // Get current defect to validate status transition
    const currentDefect = await prisma.defect.findUnique({
      where: { id: params.id },
    });

    if (!currentDefect) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Defect not found' } }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    // Validate and apply status change
    if (status && status !== currentDefect.status) {
      if (!isValidTransition(currentDefect.status, status)) {
        return NextResponse.json({ 
          success: false, 
          error: { 
            code: 'INVALID_TRANSITION', 
            message: `Invalid status transition from ${currentDefect.status} to ${status}` 
          } 
        }, { status: 400 });
      }
      updateData.status = status;
      
      // Set completedAt when transitioning to COMPLETED
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    const defect = await prisma.defect.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        item: true,
        notes: { orderBy: { createdAt: 'desc' } },
        vendorMoves: { 
          include: { vendor: true },
          orderBy: { sentAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, data: defect });
  } catch (error) {
    console.error('Error updating defect:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}
