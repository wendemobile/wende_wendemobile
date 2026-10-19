import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      include: {
        role: true,
        defaultLocation: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        role: u.role.name,
        roleId: u.roleId,
        defaultLocation: u.defaultLocation?.name || null,
        defaultLocationId: u.defaultLocationId,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        commissionRate: u.commissionRate,
      })),
    });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, email, password, fullName, roleId, defaultLocationId, commissionRate } = body;

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const { hash } = await import('bcryptjs');
    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        roleId,
        defaultLocationId: defaultLocationId || null,
        commissionRate: commissionRate || 0,
      },
      include: { role: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
        commissionRate: user.commissionRate,
      },
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
