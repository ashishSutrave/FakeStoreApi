import path from 'path';

export const CLOUDFLARE_STORAGE_PATH = path.join(
  process.cwd(),
  'playwright',
  '.auth',
  'cloudflare.json'
);
