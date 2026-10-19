import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Constants
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'items';

export interface ImageUploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface ImageValidationError {
  code: string;
  message: string;
}

export class ImageService {
  static validateImage(
    file: { size: number; type: string; name: string }
  ): ImageValidationError | null {
    if (file.size > MAX_FILE_SIZE) {
      return { code: 'IMG_001', message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { code: 'IMG_002', message: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` };
    }
    return null;
  }

  static generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    return `${generateUUID()}${ext}`;
  }

  static async uploadItemImage(
    itemId: string,
    file: {
      buffer: Buffer;
      originalName: string;
      mimeType: string;
      size: number;
    }
  ): Promise<ImageUploadResult> {
    const validationError = this.validateImage({
      size: file.size,
      type: file.mimeType,
      name: file.originalName,
    });

    if (validationError) throw new Error(validationError.message);

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment variables.");
    }

    // Process image with sharp - aggressive optimization for small file size with fallback for serverless envs
    let processedBuffer: Buffer = file.buffer;
    let processedSize: number = file.size;
    let processedMimeType: string = file.mimeType;
    let processedExtension: string = path.extname(file.originalName) || '.webp';

    try {
      processedBuffer = await sharp(file.buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 60, effort: 6 })
        .toBuffer();
      processedSize = processedBuffer.length;
      processedMimeType = 'image/webp';
      processedExtension = '.webp';
    } catch (sharpError) {
      console.warn('Sharp compression failed or unavailable, using raw image buffer:', sharpError);
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new Error('Item not found');

    const filename = this.generateFilename(file.originalName).replace(/\.[^/.]+$/, "") + processedExtension;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, processedBuffer, {
        contentType: processedMimeType,
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);
      
    const publicUrl = publicUrlData.publicUrl;

    const existingImage = await prisma.itemImage.findUnique({ where: { itemId } });

    if (existingImage) {
      // Delete old file from storage if it exists
      try {
        await supabase.storage.from(BUCKET_NAME).remove([existingImage.filename]);
      } catch (e) {
        console.error("Failed to delete old image from storage", e);
      }

      const updated = await prisma.itemImage.update({
        where: { itemId },
        data: {
          filename,
          originalName: file.originalName,
          mimeType: processedMimeType,
          size: processedSize,
          path: publicUrl,
        },
      });

      return {
        id: updated.id,
        filename: updated.filename,
        originalName: updated.originalName,
        mimeType: updated.mimeType,
        size: updated.size,
        path: publicUrl,
      };
    }

    const image = await prisma.itemImage.create({
      data: {
        itemId,
        filename,
        originalName: file.originalName,
        mimeType: processedMimeType,
        size: processedSize,
        path: publicUrl,
      },
    });

    return {
      id: image.id,
      filename: image.filename,
      originalName: image.originalName,
      mimeType: image.mimeType,
      size: image.size,
      path: publicUrl,
    };
  }

  static async getItemImage(itemId: string) {
    const image = await prisma.itemImage.findUnique({ where: { itemId } });
    if (!image) return null;

    return {
      id: image.id,
      filename: image.filename,
      originalName: image.originalName,
      mimeType: image.mimeType,
      size: image.size,
      path: image.path, // This is the Supabase public URL
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }

  static async deleteItemImage(itemId: string): Promise<boolean> {
    const image = await prisma.itemImage.findUnique({ where: { itemId } });
    if (!image) return false;

    if (supabaseUrl && supabaseKey) {
      try {
        await supabase.storage.from(BUCKET_NAME).remove([image.filename]);
      } catch (e) {
        console.error("Failed to delete image from Supabase Storage", e);
      }
    }

    await prisma.itemImage.delete({ where: { itemId } });
    return true;
  }

  static async getImageBuffer(itemId: string): Promise<{ buffer: Buffer; mimeType: string; filename: string; } | null> {
    const image = await prisma.itemImage.findUnique({ where: { itemId } });
    if (!image) return null;

    try {
      // Fetch the image from the public URL since we don't store it locally anymore
      const response = await fetch(image.path);
      if (!response.ok) return null;
      
      const arrayBuffer = await response.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        mimeType: image.mimeType,
        filename: image.filename,
      };
    } catch {
      return null;
    }
  }

  static async hasImage(itemId: string): Promise<boolean> {
    const count = await prisma.itemImage.count({ where: { itemId } });
    return count > 0;
  }

  static async getItemsWithImages(limit = 50) {
    const images = await prisma.itemImage.findMany({
      take: limit,
      include: { item: { select: { id: true, name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return images.map((img: any) => ({
      itemId: img.itemId,
      itemName: img.item.name,
      itemSku: img.item.sku,
      imageUrl: img.path,
      filename: img.filename,
      size: img.size,
    }));
  }
}
