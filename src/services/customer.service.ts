import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  address?: string;
  creditLimit?: number;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface CustomerSearchParams {
  query?: string;
  page?: number;
  pageSize?: number;
}

export const customerService = {
  async create(data: CreateCustomerInput) {
    // Sanitize email - convert empty string to undefined
    const email = data.email && data.email.trim() !== '' ? data.email.trim() : undefined;
    
    return prisma.customer.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || undefined,
        email,
        idNumber: data.idNumber?.trim() || undefined,
        address: data.address?.trim() || undefined,
        creditLimit: data.creditLimit ?? 0,
      },
    });
  },

  async findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        credits: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  },

  async search(params: CustomerSearchParams) {
    const { query, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { idNumber: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async update(id: string, data: UpdateCustomerInput) {
    // Sanitize data before update
    const sanitizedData: UpdateCustomerInput = {};
    if (data.name !== undefined) sanitizedData.name = data.name.trim();
    if (data.phone !== undefined) sanitizedData.phone = data.phone.trim() || undefined;
    if (data.email !== undefined) sanitizedData.email = data.email.trim() || undefined;
    if (data.idNumber !== undefined) sanitizedData.idNumber = data.idNumber.trim() || undefined;
    if (data.address !== undefined) sanitizedData.address = data.address.trim() || undefined;
    if (data.creditLimit !== undefined) sanitizedData.creditLimit = data.creditLimit;

    return prisma.customer.update({
      where: { id },
      data: sanitizedData,
    });
  },

  async delete(id: string) {
    return prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async getCredits(customerId: string) {
    return prisma.credit.findMany({
      where: { customerId },
      include: {
        sale: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getCreditBalance(customerId: string) {
    const credits = await prisma.credit.findMany({
      where: {
        customerId,
        status: { in: ['OPEN', 'OVERDUE'] },
      },
    });

    return credits.reduce((sum, c) => sum + Number(c.balance), 0);
  },

  async validateCreditLimit(customerId: string, amount: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const currentBalance = await this.getCreditBalance(customerId);
    const availableCredit = Number(customer.creditLimit) - currentBalance;

    return {
      isValid: amount <= availableCredit,
      creditLimit: Number(customer.creditLimit),
      currentBalance,
      availableCredit,
      requestedAmount: amount,
    };
  },

  async getPurchaseHistory(customerId: string, limit = 50) {
    return prisma.sale.findMany({
      where: {
        customerId,
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: { item: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};


// Class-style export for API routes
export const CustomerService = {
  list: customerService.search,
  findById: customerService.findById,
  create: customerService.create,
  update: customerService.update,
  delete: customerService.delete,
  getCredits: customerService.getCredits,
  getCreditBalance: customerService.getCreditBalance,
  validateCreditLimit: customerService.validateCreditLimit,
  getPurchaseHistory: customerService.getPurchaseHistory,
};
