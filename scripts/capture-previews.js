#!/usr/bin/env node
/**
 * Capture preview screenshots for Team Play resource cards.
 * Saves PNGs to ../assets/previews/{slug}.png
 *
 * Usage:
 *   npm install
 *   npx playwright install chromium
 *   npm run capture              # capture all
 *   npm run capture -- --one skribbl   # capture one by slug
 *   npm run capture -- --wait 5000     # wait 5s after load (default 3000)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PREVIEWS = [
  { slug: 'skribbl', url: 'https://skribbl.io/', wait: 3000 },
  { slug: 'garticphone', url: 'https://garticphone.com/es', wait: 3000 },
  { slug: 'quickdraw', url: 'https://quickdraw.withgoogle.com/', wait: 4000 },
  { slug: 'icebreaker', url: 'https://icebreaker.range.co/8e0m6h', wait: 3000 },
  { slug: 'jeopardy', url: 'https://jeopardylabs.com/', wait: 3000 },
  { slug: 'codenames', url: 'https://codenames.game/', wait: 3000 },
  { slug: 'spyfall', url: 'https://www.spyfall.app/', wait: 3000 },
  { slug: 'gather', url: 'https://www.gather.town/', wait: 4000 },
  { slug: 'mural', url: 'https://www.mural.co/use-case/mind-map', wait: 4000 },
  { slug: 'wheelofnames', url: 'https://wheelofnames.com/', wait: 3000 },
];

const VIEWPORT = { width: 400, height: 280 };
const OUT_DIR = path.join(__dirname, '..', 'assets', 'previews');

function parseArgs() {
  const args = process.argv.slice(2);
  const one = args.indexOf('--one');
  const waitIdx = args.indexOf('--wait');
  return {
    slug: one !== -1 && args[one + 1] ? args[one + 1] : null,
    waitMs: waitIdx !== -1 && args[waitIdx + 1] ? parseInt(args[waitIdx + 1], 10) : null,
  };
}

async function captureOne(page, { slug, url, wait }, defaultWaitMs) {
  const waitMs = wait != null ? wait : defaultWaitMs;
  const outPath = path.join(OUT_DIR, `${slug}.png`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, waitMs));
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`  ✓ ${slug} → ${outPath}`);
    return true;
  } catch (err) {
    console.error(`  ✗ ${slug}: ${err.message}`);
    return false;
  }
}

async function main() {
  const { slug: oneSlug, waitMs: cliWait } = parseArgs();
  const defaultWaitMs = cliWait != null ? cliWait : 3000;
  const list = oneSlug
    ? PREVIEWS.filter((p) => p.slug === oneSlug)
    : PREVIEWS;

  if (list.length === 0) {
    console.error('No previews to capture. Use --one <slug> with one of:', PREVIEWS.map((p) => p.slug).join(', '));
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log('Capturing previews (viewport 400×280). Install browser once: npx playwright install chromium\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  let ok = 0;
  for (const item of list) {
    const success = await captureOne(page, item, defaultWaitMs);
    if (success) ok++;
  }

  await browser.close();
  console.log(`\nDone: ${ok}/${list.length} captured.`);
  process.exit(ok === list.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
