// Runtime-safe Prisma client with in-memory fallback if @prisma/client or DATABASE_URL is missing.

type AnyObj = Record<string, unknown>;

type User = { id: string; email: string | null; name: string | null; createdAt?: string };
type ConversationMessage = { id: string; userId: string; role: string; content: string; createdAt?: string };
type MoodEntry = { id: string; userId: string; mood: string; note: string | null; createdAt?: string };
type JobApplication = {
  id: string;
  userId: string;
  company: string;
  role: string;
  location: string | null;
  status: string;
  jdUrl: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type PrismaLike = {
  user: {
    upsert: (args: { where: { email: string }; update: { name: string | null }; create: { email: string; name: string | null } }) => Promise<User>;
    create: (args: { data: { id?: string; email?: string | null; name: string | null } }) => Promise<User>;
    findUnique: (args: { where: { id?: string; email?: string } }) => Promise<User | null>;
  };
  conversationMessage: { create: (args: { data: { userId: string; role: string; content: string } }) => Promise<ConversationMessage> };
  moodEntry: { create: (args: { data: { userId: string; mood: string; note: string | null } }) => Promise<MoodEntry> };
  jobApplication: {
    create: (args: { data: Omit<JobApplication, "id" | "createdAt" | "updatedAt"> }) => Promise<JobApplication>;
    findMany: (args: { where?: { userId?: string }; orderBy?: { updatedAt?: "desc" | "asc" }; take?: number }) => Promise<JobApplication[]>;
  };
  $disconnect: () => Promise<unknown>;
};

type PrismaClientCtor = new (...args: unknown[]) => PrismaLike;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function mockDelay<T>(v: T): Promise<T> { return new Promise((res) => setTimeout(() => res(v), 10)); }

function makeMockPrisma() {
  const users: Record<string, User> = {};
  const jobs: AnyObj[] = [];
  const messages: AnyObj[] = [];
  const moods: AnyObj[] = [];
  const now = () => new Date().toISOString();
  function upsertUserByEmail(email?: string | null, name?: string | null): User {
    if (email) {
      const existing = Object.values(users).find((u) => u.email === email);
      if (existing) return existing;
    }
    const id = `guest_${Math.random().toString(36).slice(2, 10)}`;
    const u: User = { id, email: email ?? null, name: name ?? null, createdAt: now() };
    users[id] = u;
    return u;
  }
  const prismaMock: PrismaLike = {
    user: {
      upsert: async ({ where, update, create }) => {
        const email = where.email ?? create.email;
        const name = (update.name ?? create.name) ?? null;
        const u = upsertUserByEmail(email, name);
        if (update && Object.keys(update).length) users[u.id] = { ...u, ...update };
        return mockDelay(users[u.id]);
      },
      create: async ({ data }) => {
        if (data.id) {
          const u: User = { id: data.id, email: data.email ?? null, name: data.name ?? null, createdAt: now() };
          users[u.id] = u;
          return mockDelay(u);
        }
        return mockDelay(upsertUserByEmail(data.email ?? null, data.name ?? null));
      },
      findUnique: async ({ where }) => {
        if (where.id) return mockDelay(users[where.id] ?? null);
        if (where.email) return mockDelay(Object.values(users).find((x) => x.email === where.email) ?? null);
        return mockDelay(null);
      },
    },
    conversationMessage: {
      create: async ({ data }) => {
        const row = { id: Math.random().toString(36).slice(2), ...data, createdAt: now() };
        messages.push(row);
        return mockDelay(row as unknown as ConversationMessage);
      },
    },
    moodEntry: {
      create: async ({ data }) => {
        const row = { id: Math.random().toString(36).slice(2), ...data, createdAt: now() };
        moods.push(row);
        return mockDelay(row as unknown as MoodEntry);
      },
    },
    jobApplication: {
      create: async ({ data }) => {
        const row = { id: Math.random().toString(36).slice(2), ...data, createdAt: now(), updatedAt: now() };
        jobs.push(row);
        return mockDelay(row as unknown as JobApplication);
      },
      findMany: async ({ where, orderBy, take }) => {
        let list = jobs;
        if (where?.userId) list = list.filter((j) => (j as AnyObj).userId === where.userId);
        if (orderBy?.updatedAt === "desc") {
          list = list.sort((a, b) => {
            const au = String((a as AnyObj).updatedAt ?? "");
            const bu = String((b as AnyObj).updatedAt ?? "");
            return au < bu ? 1 : -1;
          });
        }
        if (typeof take === "number") list = list.slice(0, take);
        return mockDelay(list as unknown as JobApplication[]);
      },
    },
    $disconnect: async () => mockDelay(true),
  };

  return prismaMock;
}

function safeRequirePrismaClient(): PrismaClientCtor | null {
  try {
    const reqUnknown = eval("require") as unknown;
    if (typeof reqUnknown !== "function") return null;
    const modUnknown = (reqUnknown as (id: string) => unknown)("@prisma/client");
    if (!isRecord(modUnknown)) return null;
    const maybeCtor = (modUnknown as Record<string, unknown>).PrismaClient;
    if (typeof maybeCtor !== "function") return null;
    return maybeCtor as PrismaClientCtor;
  } catch { return null; }
}

declare global { var __prisma_client_instance: PrismaLike | undefined; }

let prisma: PrismaLike;
if (process.env.DATABASE_URL) {
  const PrismaClientCtor = safeRequirePrismaClient();
  if (PrismaClientCtor) {
    global.__prisma_client_instance = global.__prisma_client_instance ?? new PrismaClientCtor({
      log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
    });
    prisma = global.__prisma_client_instance;
  } else {
    console.warn("[prisma] @prisma/client not found — using in-memory mock until you install & migrate.");
    prisma = makeMockPrisma();
  }
} else {
  console.warn("[prisma] DATABASE_URL not set — using in-memory mock.");
  prisma = makeMockPrisma();
}

export { prisma };
