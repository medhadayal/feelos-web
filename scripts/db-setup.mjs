import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync } from 'node:fs';
import process from 'node:process';
import net from 'node:net';

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

function hasDockerCli() {
  const probe = spawnSync('docker', ['--version'], { shell: process.platform === 'win32' });
  return probe.status === 0;
}
function dockerEngineReady() {
  const probe = spawnSync('docker', ['info'], { shell: process.platform === 'win32' });
  return probe.status === 0;
}

function readDatabaseUrl() {
  try {
    const env = readFileSync('.env', 'utf8');
    const line = env.split('\n').find(l => l.trim().startsWith('DATABASE_URL='));
    if (!line) return null;
    const raw = line.trim().replace(/^DATABASE_URL=/, '').trim();
    return raw;
  } catch {
    return null;
  }
}

function canConnect(host, port, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (ok) => { try { socket.destroy(); } catch {} resolve(ok); };
    socket.setTimeout(timeout);
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
    socket.connect(port, host, () => done(true));
  });
}

// ALWAYS sync .env.local -> .env so Prisma uses current DATABASE_URL
if (existsSync('.env.local')) {
  try {
    copyFileSync('.env.local', '.env');
    console.log('Synced .env.local → .env');
  } catch (e) {
    console.warn('Failed to sync .env.local → .env:', e?.message || e);
  }
} else {
  console.log('.env.local not found — ensure DATABASE_URL is configured.');
}

// Decide whether to use Docker
const dockerAvailable = hasDockerCli();
const engineReady = dockerAvailable && dockerEngineReady();

if (engineReady) {
  console.log('Docker engine ready — starting Postgres container (feelos-db)...');
  run('docker', ['compose', 'up', '-d', 'db']);
} else if (dockerAvailable) {
  console.log('Docker CLI found but engine not available or requires elevation — skipping container. Using DATABASE_URL from .env/.env.local.');
} else {
  console.log('Docker not found — skipping container. Using DATABASE_URL from .env/.env.local.');
}

// Generate Prisma client
console.log('Generating Prisma client...');
run('npx', ['prisma', 'generate']);

// Probe DB connectivity from DATABASE_URL
let skipMigrateSeed = false;
const dbUrl = readDatabaseUrl();
if (dbUrl) {
  // If using SQLite, there's no network to probe — just migrate/seed directly.
  const isSQLite = dbUrl.startsWith('file:') || /sqlite/i.test(dbUrl);
  if (isSQLite) {
    console.log('SQLite database detected from DATABASE_URL — running migrate/seed without network check.');
  } else {
    try {
      const u = new URL(dbUrl);
      const host = u.hostname || 'localhost';
      const port = Number(u.port || 5432);
      console.log(`Checking DB connectivity to ${host}:${port} ...`);
      // eslint-disable-next-line no-console
      const ok = await canConnect(host, port, 2500);
      if (!ok) {
        console.warn(`DB not reachable at ${host}:${port}. Skipping migrate/seed. App will run with in-memory fallback until the DB is available.`);
        skipMigrateSeed = true;
      }
    } catch {
      console.warn('Unable to parse DATABASE_URL; attempting migrate/seed anyway.');
    }
  }
} else {
  console.warn('DATABASE_URL not found in .env; skipping migrate/seed.');
  skipMigrateSeed = true;
}

// Apply migrations and seed if reachable
if (!skipMigrateSeed) {
  console.log('Applying migrations...');
  run('npx', ['prisma', 'migrate', 'dev', '--name', 'init']);

  console.log('Seeding database...');
  run('npx', ['prisma', 'db', 'seed']);
} else {
  console.log('Skipped migrate/seed due to DB unavailability.');
}

console.log('Database setup complete.');
