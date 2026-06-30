import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from 'pg'

const { Pool } = pkg

function getNormalizedDatabaseUrl(url: string) {
	const parsedUrl = new URL(url)
	const sslMode = parsedUrl.searchParams.get('sslmode')
	const useLibpqCompat = parsedUrl.searchParams.get('uselibpqcompat')
	
	if (!sslMode) {
		parsedUrl.searchParams.set('sslmode', 'require')
	}

	if (sslMode === 'require' && !useLibpqCompat) {
		parsedUrl.searchParams.set('uselibpqcompat', 'true')
	}

	return parsedUrl.toString()
}

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined
	pgPool: InstanceType<typeof Pool> | undefined
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set')
}

let parsedDatabaseUrl: URL

try {
	parsedDatabaseUrl = new URL(databaseUrl)
} catch {
	throw new Error('DATABASE_URL is not a valid URL')
}

if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
	throw new Error('DATABASE_URL must use the postgres:// or postgresql:// protocol')
}

const normalizedDatabaseUrl = getNormalizedDatabaseUrl(databaseUrl)

// Log the host we're attempting to connect to (do not log full URL/credentials)
try {
	const tmp = new URL(normalizedDatabaseUrl)
	console.log(`[prisma] attempting connection to host=${tmp.hostname} port=${tmp.port || 'default'} sslmode=${tmp.searchParams.get('sslmode') || 'missing'}`)
} catch (e) {
	// ignore parse errors
}

if (typeof Pool !== 'function') {
	throw new Error('pg Pool is not available. Verify the pg package import and version compatibility.')
}

const pool = globalForPrisma.pgPool ?? new Pool({ connectionString: normalizedDatabaseUrl })

async function delay(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms))
}

async function testConnectionWithRetry(maxAttempts = 3) {
	let lastError: unknown

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const client = await pool.connect()
			client.release()
			console.log(`[prisma] database connection test succeeded on attempt ${attempt}/${maxAttempts}`)
			return
		} catch (err) {
			lastError = err
			console.error(`[prisma] database connection test failed on attempt ${attempt}/${maxAttempts}`, err)

			if (attempt < maxAttempts) {
				await delay(attempt * 500)
			}
		}
	}

	console.error('[prisma] database connection test exhausted retries. Please verify DATABASE_URL, network access, and DB allowlist settings.', lastError)
}

// Try a quick test connection so we emit a clear, immediate error when the DB is unreachable.
;(async () => {
	await testConnectionWithRetry()
})()

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma
	globalForPrisma.pgPool = pool
}
