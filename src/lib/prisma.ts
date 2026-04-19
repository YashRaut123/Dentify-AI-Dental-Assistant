import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

function getNormalizedDatabaseUrl(url: string) {
	const parsedUrl = new URL(url)
	const sslMode = parsedUrl.searchParams.get('sslmode')
	const useLibpqCompat = parsedUrl.searchParams.get('uselibpqcompat')

	if (sslMode === 'require' && !useLibpqCompat) {
		parsedUrl.searchParams.set('uselibpqcompat', 'true')
	}

	return parsedUrl.toString()
}

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined
	pgPool: Pool | undefined
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set')
}

const normalizedDatabaseUrl = getNormalizedDatabaseUrl(databaseUrl)

const pool = globalForPrisma.pgPool ?? new Pool({ connectionString: normalizedDatabaseUrl })
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma
	globalForPrisma.pgPool = pool
}
