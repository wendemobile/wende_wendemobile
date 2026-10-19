import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ItemService } from '@/services/item.service';
import { withAuth, AuthenticatedRequest } from '@/lib/rbac';

const createItemSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  brand: z.string().max(100).optional(),
  itemType: z.string().max(50).optional(),
  unitOfMeasure: z.string().max(20).optional(),
  unitPrice: z.number().positive(),
  costPrice: z.number().positive(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  barcode: z.string().max(50).optional(),
  minStock: z.number().min(0).optional(),
  initialStock: z.number().min(0).optional(),
  locationId: z.string().uuid().optional(),
  specifications: z.record(z.any()).optional(),
  supplierId: z.string().uuid().optional(),
});

// GET /api/items - List items with search and pagination
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      search: searchParams.get('search') || searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      locationId: searchParams.get('locationId') || undefined,
      // Default to showing only active items unless explicitly set to false or 'all'
      isActive: searchParams.get('isActive') === 'false' ? false :
        searchParams.get('isActive') === 'all' ? undefined : true,
      lowStock: searchParams.get('lowStock') === 'true',
      stockStatus: (searchParams.get('stockStatus') as 'low' | 'out' | 'normal' | undefined) || undefined,
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc',
    };

    const result = await ItemService.searchItems(params);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch items',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'items:read');

// POST /api/items - Create new item
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createItemSchema.parse(body);

    const item = await ItemService.createItem(validatedData, req.user.id);

    return NextResponse.json(
      {
        success: true,
        data: item,
      },
      { status: 201 }
    );
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

    console.error('Error creating item:', error);

    // Handle Prisma unique constraint errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
    if (errorMessage.includes('Unique constraint') || errorMessage.includes('unique constraint')) {
      let field = 'field';
      if (errorMessage.includes('sku')) field = 'SKU';
      else if (errorMessage.includes('barcode')) field = 'Barcode';

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VAL_002',
            message: `${field} already exists. Please use a different value.`,
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to create item',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'items:write');
