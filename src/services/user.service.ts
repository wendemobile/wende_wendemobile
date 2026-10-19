import { hash, compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const SALT_ROUNDS = 12;

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roleId: string;
  defaultLocationId?: string;
}

export interface UpdateUserInput {
  email?: string;
  fullName?: string;
  roleId?: string;
  defaultLocationId?: string | null;
  isActive?: boolean;
}

export class UserService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return hash(password, SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }

  /**
   * Validate password strength
   * Requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
   */
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create a new user
   */
  static async createUser(input: CreateUserInput) {
    const passwordValidation = this.validatePasswordStrength(input.password);
    if (!passwordValidation.valid) {
      throw new Error(`Invalid password: ${passwordValidation.errors.join(', ')}`);
    }

    const passwordHash = await this.hashPassword(input.password);

    return prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        roleId: input.roleId,
        defaultLocationId: input.defaultLocationId,
      },
      include: {
        role: true,
        defaultLocation: true,
      },
    });
  }

  /**
   * Update user
   */
  static async updateUser(id: string, input: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data: input,
      include: {
        role: true,
        defaultLocation: true,
      },
    });
  }

  /**
   * Change user password
   */
  static async changePassword(id: string, newPassword: string) {
    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(`Invalid password: ${passwordValidation.errors.join(', ')}`);
    }

    const passwordHash = await this.hashPassword(newPassword);

    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        defaultLocation: true,
      },
    });
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        role: true,
        defaultLocation: true,
      },
    });
  }

  /**
   * List users with pagination
   */
  static async listUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    roleId?: string;
    isActive?: boolean;
  }) {
    const { page = 1, pageSize = 20, search, roleId, isActive } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (roleId) {
      where.roleId = roleId;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          role: true,
          defaultLocation: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Deactivate user
   */
  static async deactivateUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Activate user
   */
  static async activateUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
