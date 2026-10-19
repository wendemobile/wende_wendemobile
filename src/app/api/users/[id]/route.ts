import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Only admin can view other users, users can view themselves
    if (session.user.role !== 'ADMIN' && session.user.id !== id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        defaultLocation: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
        roleId: user.roleId,
        defaultLocation: user.defaultLocation?.name || null,
        defaultLocationId: user.defaultLocationId,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        commissionRate: user.commissionRate,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user (admin can update any, users can update themselves)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.role === 'ADMIN';
    const isSelf = session.user.id === id;

    // Only admin can edit other users, users can edit themselves
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { username, email, fullName, password, roleId, defaultLocationId, isActive, commissionRate } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    // Username update - check for duplicates
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findFirst({
        where: { username, id: { not: id } },
      });
      if (usernameExists) {
        return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 400 });
      }
      updateData.username = username;
    }

    // Email update - check for duplicates
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { email, id: { not: id } },
      });
      if (emailExists) {
        return NextResponse.json({ success: false, error: 'Email already taken' }, { status: 400 });
      }
      updateData.email = email;
    }

    // Full name update
    if (fullName) {
      updateData.fullName = fullName;
    }

    // Password update - hash it
    if (password && password.trim() !== '') {
      const { hash } = await import('bcryptjs');
      updateData.passwordHash = await hash(password, 12);
    }

    // Admin-only fields
    if (isAdmin) {
      if (roleId) {
        updateData.roleId = roleId;
      }
      if (defaultLocationId !== undefined) {
        updateData.defaultLocationId = defaultLocationId || null;
      }
      if (typeof isActive === 'boolean') {
        updateData.isActive = isActive;
      }
      if (commissionRate !== undefined) {
        updateData.commissionRate = commissionRate;
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true, defaultLocation: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role.name,
        roleId: updatedUser.roleId,
        defaultLocation: updatedUser.defaultLocation?.name || null,
        defaultLocationId: updatedUser.defaultLocationId,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (session.user.id === id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if user has related records that prevent deletion
    const [salesCount, expensesCount, transfersCount] = await Promise.all([
      prisma.sale.count({ where: { OR: [{ cashierId: id }, { salesmanId: id }] } }),
      prisma.expense.count({ where: { createdById: id } }),
      prisma.transfer.count({ where: { OR: [{ createdById: id }, { assignedToId: id }, { receivedById: id }] } }),
    ]);

    // If user has related records, soft delete (deactivate) instead
    if (salesCount > 0 || expensesCount > 0 || transfersCount > 0) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: 'User deactivated (has related records)',
        softDeleted: true,
      });
    }

    // Hard delete if no related records
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
