import { NextResponse } from 'next/server';
import { ItemService } from '@/services/item.service';
import { withAuth, AuthenticatedRequest } from '@/lib/rbac';

/**
 * GET /api/items/lookup - Look up an item by barcode or SKU
 * 
 * Query Parameters:
 * - barcode: The barcode value to search for
 * - sku: The SKU to search for (alternative to barcode)
 * 
 * Returns the item with stock information by location
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode');
    const sku = searchParams.get('sku');

    if (!barcode && !sku) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SCAN_004',
            message: 'Barcode or SKU is required',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 }
      );
    }

    // Try to find item by barcode first, then by SKU
    let item = null;
    
    if (barcode) {
      item = await ItemService.getItemByBarcode(barcode);
      
      // If not found by barcode, try searching by SKU (barcode might be SKU)
      if (!item) {
        item = await ItemService.getItemBySku(barcode);
      }
    }
    
    if (!item && sku) {
      item = await ItemService.getItemBySku(sku);
    }

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SCAN_004',
            message: 'Item not found. Please check the barcode and try again.',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      );
    }

    // Check if item is active
    if (!item.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SCAN_004',
            message: 'Item is no longer active.',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      );
    }

    // Transform stocks to stocksByLocation format
    const stocksByLocation = (item.stocks || []).map((s: any) => ({
      locationId: s.location?.id || s.locationId,
      locationName: s.location?.name || 'Unknown',
      locationType: s.location?.type || 'UNKNOWN',
      quantity: Number(s.qty),
      reservedQuantity: Number(s.reservedQty),
      availableQuantity: Number(s.qty) - Number(s.reservedQty),
    })).filter((s: any) => s.quantity > 0);

    const totalStock = stocksByLocation.reduce(
      (sum: number, s: any) => sum + s.availableQuantity,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        item: {
          id: item.id,
          sku: item.sku,
          name: item.name,
          barcode: item.barcode,
          brand: item.brand,
          category: item.category,
          unitPrice: Number(item.unitPrice),
          costPrice: Number(item.costPrice),
          unitOfMeasure: item.unitOfMeasure,
          imageUrl: item.image?.path ? `/api/items/${item.id}/image` : undefined,
        },
        stocksByLocation,
        totalStock,
      },
    });
  } catch (error) {
    console.error('Error looking up item:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to look up item',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'items:read');
