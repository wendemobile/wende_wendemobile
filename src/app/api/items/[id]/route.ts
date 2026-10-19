import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ItemService } from '@/services/item.service';
import { withAuth } from '@/lib/rbac';

const updateItemSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  barcode: z.string().max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  brand: z.string().max(100).optional(),
  itemType: z.string().max(50).optional(),
  unitOfMeasure: z.string().max(20).optional(),
  unitPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  minStock: z.number().min(0).optional(),
  specifications: z.record(z.any()).optional(),
  supplierId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/items/[id] - Get item by ID
export const GET = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const item = await ItemService.getItemById(params.id);

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NF_001',
            message: 'Item not found',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch item',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'items:read');

// PUT /api/items/[id] - Update item
export const PUT = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await req.json();
    const validatedData = updateItemSchema.parse(body);

    const item = await ItemService.updateItem(params.id, validatedData, (req as any).user?.id);

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            details: error.flatten().fieldErrors,
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 }
      );
    }

    console.error('Error updating item:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to update item',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'items:write');

// DELETE /api/items/[id] - Deactivate item
export const DELETE = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await ItemService.deactivateItem(params.id);

    return NextResponse.json({
      success: true,
      data: { message: 'Item deactivated successfully' },
    });
  } catch (error) {
    console.error('Error deactivating item:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to deactivate item',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'items:delete');
