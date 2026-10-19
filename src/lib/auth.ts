import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Get trusted hosts from environment variable
const trustedHosts = process.env.TRUSTED_HOSTS?.split(',') || [
  'localhost:3000',
  '127.0.0.1:3000',
  // LAN IPs
  '192.168.1.100:3000',
  '192.168.1.101:3000',
  '192.168.1.102:3000',
  // Tailscale IPs
  '100.75.169.101:3000',
  'tomgeneraltrading:3000',
  'tomgeneraltrading.tail572bbf.ts.net',
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { role: true },
        });

        if (!user || !user.isActive) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.fullName,
          role: user.role.name,
          roleId: user.roleId,
          defaultLocationId: user.defaultLocationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.roleId = user.roleId;
        token.defaultLocationId = user.defaultLocationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.roleId = token.roleId as string;
        session.user.defaultLocationId = token.defaultLocationId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Removed custom cookie configuration to allow NextAuth to seamlessly handle 
  // secure cookies on Vercel deployments natively.
};

// Export trusted hosts for use in middleware if needed
export { trustedHosts };
