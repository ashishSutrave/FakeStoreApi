import { chromium, type BrowserContext, type FullConfig, type Page } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { CLOUDFLARE_STORAGE_PATH } from './constants/storage';
import { getBrowserHeaders, getNavigationContextOptions } from './utils/browserHeaders';

dotenv.config({ override: true });

const CHALLENGE_TIMEOUT_MS = 90_000;
const MAX_ATTEMPTS = 3;

async function waitForChallengeToClear(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () =>
        !document.title.includes('Just a moment') &&
        !document.body?.innerText?.includes('Checking your browser'),
      undefined,
      { timeout: CHALLENGE_TIMEOUT_MS }
    )
    .catch(() => undefined);

  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
}

async function waitForClearanceCookie(context: BrowserContext): Promise<boolean> {
  const deadline = Date.now() + CHALLENGE_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const cookies = await context.cookies();
    if (cookies.some((cookie) => cookie.name === 'cf_clearance')) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  return false;
}

async function probeApiAccess(
  context: BrowserContext,
  page: Page,
  origin: string
): Promise<number> {
  const apiUrl = `${origin}/products/1`;
  const browserStatus = await page.evaluate(async (url) => {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    return response.status;
  }, apiUrl);

  if (browserStatus !== 403) {
    return browserStatus;
  }

  const apiResponse = await context.request.get(apiUrl, {
    headers: getBrowserHeaders(origin),
  });
  return apiResponse.status();
}

async function bypassCloudflare(baseURL: string): Promise<void> {
  const origin = baseURL.replace(/\/$/, '');

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  try {
    let lastStatus = 403;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const context = await browser.newContext(getNavigationContextOptions());
      const page = await context.newPage();

      try {
        await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: CHALLENGE_TIMEOUT_MS });
        await waitForChallengeToClear(page);
        await waitForClearanceCookie(context);

        await page.goto(`${origin}/products/1`, {
          waitUntil: 'domcontentloaded',
          timeout: CHALLENGE_TIMEOUT_MS,
        });
        await waitForChallengeToClear(page);

        lastStatus = await probeApiAccess(context, page, origin);

        if (lastStatus !== 403) {
          await context.storageState({ path: CLOUDFLARE_STORAGE_PATH });
          return;
        }
      } finally {
        await context.close();
      }

      await new Promise((resolve) => setTimeout(resolve, 2_000 * attempt));
    }

    throw new Error(
      `Cloudflare challenge was not bypassed after ${MAX_ATTEMPTS} attempts. Last API status: ${lastStatus}.`
    );
  } finally {
    await browser.close();
  }
}

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

  await bypassCloudflare(baseURL);
}

export default globalSetup;
