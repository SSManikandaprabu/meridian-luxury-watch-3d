import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STANDALONE_HTML_PATH = path.resolve(__dirname, '..', 'meridian-standalone.html');
const ARTIFACT_DIR =
  'C:\\Users\\prabu\\.gemini\\antigravity\\brain\\6d5ca055-76c8-4aaf-b0a4-10dd7944af74';
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173';

async function run() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const htmlBytes = fs.readFileSync(STANDALONE_HTML_PATH);

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlBytes);
  });

  await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));

  try {
    console.log('Standalone HTML server ready at', BASE_URL);

    const browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: [
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--use-angle=d3d11',
        '--enable-accelerated-2d-canvas',
      ],
    });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  // 1. Step 2: 3D Watch in Isolation
  console.log('Capturing Step 2: 3D Watch in Isolation...');
  await page.goto(`${BASE_URL}/?stage=isolation`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'step2_watch_isolation.png'),
  });

  // 2. Step 3: 3D Watch with Studio HDRI + Post-Processing
  console.log('Capturing Step 3: Studio Lighting & Post-Processing...');
  await page.goto(`${BASE_URL}/?stage=postfx`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'step3_watch_postfx.png'),
  });

  // 3. Step 4: Full Scroll Story Experience
  console.log('Capturing Step 4: Chapter 1 - Hero...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'chapter1_hero.png'),
  });

  // Scroll to Chapter 2: Dial Macro
  console.log('Capturing Chapter 2 - Dial Macro...');
  await page.evaluate(() => {
    document.getElementById('section-dial')?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'chapter2_dial_macro.png'),
  });

    // Test Dial Switcher in Chapter 2 (Switch to Verdigris)
    await page.getByRole('button', { name: /Verdigris/i }).first().click();
    await page.waitForTimeout(900);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'chapter2_dial_verdigris.png'),
    });
    // Switch back to Glacier
    await page.getByRole('button', { name: /Glacier/i }).first().click();
    await page.waitForTimeout(600);

  // Scroll to Chapter 3: Calibre M-01 Movement
  console.log('Capturing Chapter 3 - Movement Caseback...');
  await page.evaluate(() => {
    document
      .getElementById('section-movement')
      ?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1900);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'chapter3_movement.png'),
  });

  // Scroll to Chapter 4: Case & Bezel + Active Callout
  console.log('Capturing Chapter 4 - Case & Bezel...');
  await page.evaluate(() => {
    document.getElementById('section-case')?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1800);
  // Trigger Crown callout highlight
  await page.getByRole('button', { name: /01 · CROWN/i }).first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'chapter4_case_bezel.png'),
  });
  await page.getByRole('button', { name: /Close part specification/i }).click();
  await page.waitForTimeout(300);

  // Scroll to Chapter 5: Straps & Atelier (Switch to 316L Steel Bracelet)
  console.log('Capturing Chapter 5 - Straps & Live Price...');
  await page.evaluate(() => {
    document
      .getElementById('section-straps')
      ?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1600);
  await page
    .getByRole('button', { name: /Integrated 316L Architecture Bracelet/i })
    .first()
    .click();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'chapter5_straps_steel.png'),
  });

  // Scroll to Chapter 6: Collection Trilogy
  console.log('Capturing Chapter 6 - Collection...');
  await page.evaluate(() => {
    document
      .getElementById('section-collection')
      ?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'chapter6_collection.png'),
  });

  // Scroll to Chapter 7: Private Viewing & Submit Booking Form
  console.log('Capturing Chapter 7 - Private Viewing...');
  await page.evaluate(() => {
    document
      .getElementById('section-viewing')
      ?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1600);
  await page.fill('#viewing-fullname', 'Comte Henri de la Roche');
  await page.fill('#viewing-email', 'henri@geneve-horology.ch');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'chapter7_private_viewing.png'),
  });

  // Test Light Theme (Ivory Mode) at Hero
  console.log('Capturing Light Theme (Ivory)...');
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(1400);
  await page.getByRole('button', { name: /Switch to Daylight Ivory theme/i }).click();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'theme_ivory_hero.png'),
  });

  // Switch back to Dark Mode and test Mobile Viewport (375x812 iPhone size)
  await page
    .getByRole('button', { name: /Switch to Nocturnal Ink Navy theme/i })
    .click();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1400);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mobile_hero_375w.png'),
  });

    await browser.close();

    if (consoleErrors.length > 0) {
      console.warn('Console errors detected:', consoleErrors);
    } else {
      console.log('Zero console/runtime errors!');
    }
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
