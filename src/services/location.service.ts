import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateLocationInput {
  name: string;
  type: string;
  description?: string;
}

export interface UpdateLocationInput {
  name?: string;
  type?: string;
  description?: string;
  isActive?: boolean;
}

export class LocationService {
  /**
   * Create a new location
   */
  static async createLocation(input: CreateLocationInput) {
    return prisma.location.create({
      data: input,
      include: {
        _count: { select: { stocks: true } },
      },
    });
  }

  /**
   * Update a location
   */
  static async updateLocation(id: string, input: UpdateLocationInput) {
    return prisma.location.update({
      where: { id },
      data: input,
      include: {
        _count: { select: { stocks: true } },
      },
    });
  }

  /**
   * Get location by ID
   */
  static async getLocationById(id: string) {
    return prisma.location.findUnique({
      where: { id },
      include: {
        stocks: {
          include: { item: true },
        },
        _count: { select: { stocks: true } },
      },
    });
  }

  /**
   * List all locations
   */
  static async listLocations(params?: {
    isActive?: boolean;
    type?: string;
  }) {
    const where: Prisma.LocationWhereInput = {};
    
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    
    if (params?.type) {
      where.type = params.type;
    }

    return prisma.location.findMany({
      where,
      include: {
        _count: { select: { stocks: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Deactivate a location
   * Prevents new stock from being added
   */
  static async deactivateLocation(id: string) {
    return prisma.location.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Activate a location
   */
  static async activateLocation(id: string) {
    return prisma.location.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Get location stock value and item count
   */
  static async getLocationStats(id: string) {
    const stocks = await prisma.stock.findMany({
      where: { locationId: id },
      include: { item: true },
    });

    const itemCount = stocks.length;
    const totalQuantity = stocks.reduce((sum, s) => sum + Number(s.qty), 0);
    const totalValue = stocks.reduce(
      (sum, s) => sum + Number(s.qty) * Number(s.item.costPrice),
      0
    );

    return {
      itemCount,
      totalQuantity,
      totalValue,
    };
  }

  /**
   * Check if location can accept new stock
   */
  static async canAcceptStock(id: string): Promise<boolean> {
    const location = await prisma.location.findUnique({
      where: { id },
      select: { isActive: true },
    });
    return location?.isActive ?? false;
  }
}
