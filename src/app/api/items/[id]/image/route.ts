import { NextRequest, NextResponse } from 'next/server';
import { ImageService } from '@/services/image.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

// POST /api/items/[id]/image - Upload image for an item
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_001', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role, 'items:write')) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTHZ_001', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const { id } = params;
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VAL_001', message: 'No image file provided' } },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await ImageService.uploadItemImage(id, {
      buffer,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error uploading image:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json(
      { success: false, error: { code: 'SRV_001', message } },
      { status: 500 }
    );
  }
}

// GET /api/items/[id]/image - Get image for an item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const imageData = await ImageService.getItemImage(id);

    if (!imageData || !imageData.path) {
      // Return a 404
      return new NextResponse(null, {
        status: 404,
        headers: { 'Cache-Control': 'no-cache' },
      });
    }

    // Redirect to the Supabase Public URL
    return NextResponse.redirect(imageData.path);
  } catch (error) {
    console.error('Error fetching image:', error);
    return new NextResponse(null, {
      status: 500,
      headers: { 'Cache-Control': 'no-cache' },
    });
  }
}

// DELETE /api/items/[id]/image - Delete image for an item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_001', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role, 'items:write')) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTHZ_001', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const { id } = params;
    const deleted = await ImageService.deleteItemImage(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Image not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SRV_001', message: 'Failed to delete image' } },
      { status: 500 }
    );
  }
}
