import { existsSync, copyFileSync } from 'node:fs';

try {
  if (existsSync('.env.local')) {
    copyFileSync('.env.local', '.env');
    console.log('Synced .env.local -> .env');
  } else {
    console.log('.env.local not found');
  }
} catch (e) {
  console.error('Env sync failed:', e?.message || e);
  process.exit(1);
}
