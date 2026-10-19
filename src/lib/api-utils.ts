import { NextResponse } from 'next/server';

/**
 * Utility functions for optimizing API responses for low bandwidth
 */

// Slim down response data by removing null/undefined values
export function slimResponse<T extends Record<string, unknown>>(data: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in data) {
    const value = data[key];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        result[key] = value.map((item: unknown) => 
          typeof item === 'object' && item !== null ? slimResponse(item as Record<string, unknown>) : item
        ) as T[typeof key];
      } else if (typeof value === 'object' && Object.prototype.toString.call(value) !== '[object Date]') {
        result[key] = slimResponse(value as Record<string, unknown>) as T[typeof key];
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

// Create optimized JSON response with compression headers
export function createOptimizedResponse(data: any, status = 200) {
  const slimData = typeof data === 'object' ? slimResponse(data) : data;
  
  return NextResponse.json(slimData, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=60', // 1 minute cache for API responses
      'Vary': 'Accept-Encoding',
    },
  });
}

// Pagination helper with minimal data
export function paginateResults<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize),
    },
  };
}

// Select only needed fields from Prisma results
export function selectFields<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};
  for (const field of fields) {
    if (data[field] !== undefined) {
      result[field] = data[field];
    }
  }
  return result;
}
