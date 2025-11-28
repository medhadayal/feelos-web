// (Replaced static import with a runtime-safe initializer & mock fallback)

type MaybePromise<T> = T | Promise<T>;

function mockDelay<T>(v: T): Promise<T> {
	return new Promise((res) => setTimeout(() => res(v), 50));
}

function makeMockPrisma() {
	// minimal mock implementations used by the app (best-effort)
	const userStore: Record<string, any> = {};

	return {
		user: {
			upsert: async ({ where, update, create }: any) => {
				// try by email
				const key = where?.email ?? `guest_${Math.random().toString(36).slice(2, 8)}`;
				const existing = Object.values(userStore).find((u: any) => u.email === where?.email) as any;
				if (existing) {
					const updated = { ...existing, ...update };
					userStore[existing.id] = updated;
					return mockDelay(updated);
				}
				const id = `guest_${Math.random().toString(36).slice(2, 8)}`;
				const created = { id, email: create?.email ?? null, name: create?.name ?? null, createdAt: new Date().toISOString() };
				userStore[id] = created;
				return mockDelay(created);
			},
			create: async ({ data }: any) => {
				const id = `guest_${Math.random().toString(36).slice(2, 8)}`;
				const created = { id, email: data?.email ?? null, name: data?.name ?? null, createdAt: new Date().toISOString() };
				userStore[id] = created;
				return mockDelay(created);
			},
			findUnique: async ({ where }: any) => {
				if (!where) return mockDelay(null);
				const found = Object.values(userStore).find((u: any) => (where.id ? u.id === where.id : where.email && u.email === where.email)) || null;
				return mockDelay(found);
			},
		},
		conversationMessage: {
			create: async ({ data }: any) => {
				// return a simple record
				const entry = { id: Math.random().toString(36).slice(2), ...data, createdAt: new Date().toISOString() };
				return mockDelay(entry);
			},
		},
		moodEntry: {
			create: async ({ data }: any) => {
				const entry = { id: Math.random().toString(36).slice(2), ...data, createdAt: new Date().toISOString() };
				return mockDelay(entry);
			},
		},
		// noop $disconnect for compatibility
		$disconnect: async () => mockDelay(true),
	};
}

// runtime-safe prisma initializer
declare global {
	// eslint-disable-next-line no-var
	var __prisma_client_instance: any | undefined;
}

let prisma: any;

if (process.env.DATABASE_URL) {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { PrismaClient } = require('@prisma/client');
		// reuse global instance in dev to avoid multiple clients
		global.__prisma_client_instance = global.__prisma_client_instance ?? new PrismaClient();
		prisma = global.__prisma_client_instance;
	} catch (err) {
		// If @prisma/client is not installed or cannot be loaded, fall back to mock
		// Console a minimal warning for developer awareness
		// (avoid throwing so the app can run)
		// eslint-disable-next-line no-console
		console.warn('[prisma] @prisma/client not available — using mock persistence. To enable real DB, install @prisma/client and set DATABASE_URL.');
		prisma = makeMockPrisma();
	}
} else {
	// No DATABASE_URL configured — use mock persistence to keep app functional
	prisma = makeMockPrisma();
}

export { prisma };
