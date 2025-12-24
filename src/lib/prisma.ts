// Runtime-safe Prisma initializer with in-memory fallback when @prisma/client is not installed.

type AnyObj = Record<string, any>;

function mockDelay<T>(v: T): Promise<T> {
	return new Promise((res) => setTimeout(() => res(v), 10));
}

function makeMockPrisma() {
	// Minimal in-memory stores to keep the app usable without a DB
	const users: Record<string, AnyObj> = {};
	const jobs: AnyObj[] = [];
	const messages: AnyObj[] = [];
	const moods: AnyObj[] = [];
	const now = () => new Date().toISOString();

	function upsertUserByEmail(email?: string | null, name?: string | null) {
		if (email) {
			const existing = Object.values(users).find((u: AnyObj) => u.email === email) as AnyObj | undefined;
			if (existing) return existing;
		}
		const id = `guest_${Math.random().toString(36).slice(2, 10)}`;
		const u = { id, email: email ?? null, name: name ?? null, createdAt: now() };
		users[id] = u;
		return u;
	}

	return {
		user: {
			upsert: async ({ where, update, create }: AnyObj) => {
				const email = where?.email ?? create?.email ?? null;
				const name = (update?.name ?? create?.name) ?? null;
				const u = upsertUserByEmail(email, name);
				if (update && Object.keys(update).length) users[u.id] = { ...u, ...update };
				return mockDelay(users[u.id]);
			},
			create: async ({ data }: AnyObj) => {
				const u = upsertUserByEmail(data?.email ?? null, data?.name ?? null);
				return mockDelay(u);
			},
			findUnique: async ({ where }: AnyObj) => {
				if (!where) return mockDelay(null);
				if (where.id) return mockDelay(users[where.id] ?? null);
				if (where.email) {
					const u = Object.values(users).find((x: AnyObj) => x.email === where.email) ?? null;
					return mockDelay(u);
				}
				return mockDelay(null);
			},
		},
		conversationMessage: {
			create: async ({ data }: AnyObj) => {
				const entry = { id: Math.random().toString(36).slice(2), ...data, createdAt: now() };
				messages.push(entry);
				return mockDelay(entry);
			},
		},
		moodEntry: {
			create: async ({ data }: AnyObj) => {
				const entry = { id: Math.random().toString(36).slice(2), ...data, createdAt: now() };
				moods.push(entry);
				return mockDelay(entry);
			},
		},
		jobApplication: {
			create: async ({ data }: AnyObj) => {
				const entry = { id: Math.random().toString(36).slice(2), ...data, status: data?.status ?? "Applied", createdAt: now(), updatedAt: now() };
				jobs.push(entry);
				return mockDelay(entry);
			},
			findMany: async ({ where, orderBy, take }: AnyObj) => {
				let list = jobs.filter((j) => (where?.userId ? j.userId === where.userId : true));
				if (orderBy?.updatedAt === "desc") list = list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
				if (typeof take === "number") list = list.slice(0, take);
				return mockDelay(list);
			},
		},
		$disconnect: async () => mockDelay(true),
	};
}

function safeRequirePrismaClient(): any | null {
	try {
		// prevent bundler resolution unless present
		// eslint-disable-next-line no-eval
		const req = eval('require') as any;
		const mod = req?.('@prisma/client');
		return mod?.PrismaClient ? mod.PrismaClient : null;
	} catch {
		return null;
	}
}

declare global {
	// eslint-disable-next-line no-var
	var __prisma_client_instance: any | undefined;
}

let prisma: any;
const hasDbUrl = !!process.env.DATABASE_URL;

if (hasDbUrl) {
	const PrismaClientCtor = safeRequirePrismaClient();
	if (PrismaClientCtor) {
		global.__prisma_client_instance = global.__prisma_client_instance ?? new PrismaClientCtor({
			log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
		});
		prisma = global.__prisma_client_instance;
	} else {
		console.warn("[prisma] @prisma/client not found — using in-memory mock. Install @prisma/client and run Prisma to enable DB.");
		prisma = makeMockPrisma();
	}
} else {
	console.warn("[prisma] DATABASE_URL not set — using in-memory mock.");
	prisma = makeMockPrisma();
}

export { prisma };
