import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Connection pool configuration for PostgreSQL
 * Optimized for handling concurrent users and large datasets
 * 
 * Settings:
 * - connection_limit: 20 (increased from 10 for better concurrency)
 * - pool_timeout: 30 seconds (time to wait for available connection)
 * - connect_timeout: 10 seconds (time to establish new connection)
 */
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || '';
  
  // Add connection pool settings for PostgreSQL if not already present
  if (baseUrl.includes('postgresql') && !baseUrl.includes('connection_limit')) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    // Optimized pool settings for concurrent users:
    // - connection_limit: max connections per instance (20 for better throughput)
    // - pool_timeout: seconds to wait for connection from pool
    // - connect_timeout: seconds to wait for new connection establishment
    return `${baseUrl}${separator}connection_limit=20&pool_timeout=30&connect_timeout=10`;
  }
  return baseUrl;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Optimize connection handling with pooling
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Ensure connection is established on startup
prisma.$connect().catch(console.error);
