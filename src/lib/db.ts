import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    // Return a dummy client when no DB is configured — all calls will fail
    // gracefully because every caller wraps in try/catch
    return new PrismaClient() as unknown as PrismaClient
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter, log: process.env.NODE_ENV === 'development' ? ['error'] : [] })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
