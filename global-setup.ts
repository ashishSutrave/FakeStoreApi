import { chromium, type FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { CLOUDFLARE_STORAGE_PATH } from './constants/storage';
import { getBrowserContextOptions } from './utils/browserHeaders';

dotenv.config({ override: true });

async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL =
    process.env.BASE_URL ||
    (config.projects[0]?.use?.baseURL as string | undefined) ||
    'https://fakestoreapi.com';

  fs.mkdirSync(path.dirname(CLOUDFLARE_STORAGE_PATH), { recursive: true });

  if (!process.env.CI) {
    fs.writeFileSync(
      CLOUDFLARE_STORAGE_PATH,
      JSON.stringify({ cookies: [], origins: [] })
    );
    return;
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  try {
    const context = await browser.newContext(getBrowserContextOptions(baseURL));
    const page = await context.newPage();

    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page
      .waitForFunction(() => !document.title.includes('Just a moment'), undefined, {
        timeout: 45000,
      })
      .catch(() => page.waitForTimeout(5000));

    const probe = await context.request.get(`${baseURL.replace(/\/$/, '')}/products/1`);
    if (probe.status() === 403) {
      throw new Error(
        'Cloudflare challenge was not bypassed. API probe to /products/1 returned 403.'
      );
    }

    await context.storageState({ path: CLOUDFLARE_STORAGE_PATH });
  } finally {
    await browser.close();
  }
}

export default globalSetup;
