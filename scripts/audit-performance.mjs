import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STANDALONE_HTML_PATH = path.resolve(__dirname, '..', 'meridian-standalone.html');
const BASE_URL = 'http://127.0.0.1:4174';

async function runAudit() {
  const htmlBytes = fs.readFileSync(STANDALONE_HTML_PATH);
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlBytes);
  });
  await new Promise((resolve) => server.listen(4174, '127.0.0.1', resolve));

  try {
    const browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    const startLoad = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const metrics = await page.evaluate(async () => {
      const nav = performance.getEntriesByType(
        'navigation'
      )[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find((p) => p.name === 'first-contentful-paint')?.startTime || 0;

      // Measure CLS
      let cls = 0;
      const layoutShiftEntries = performance.getEntriesByType('layout-shift');
      for (const entry of layoutShiftEntries) {
        if (!entry.hadRecentInput) cls += entry.value;
      }

      // Measure 60fps WebGL frame rate over 60 frames
      const frameTimes = [];
      let last = performance.now();
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => requestAnimationFrame(r));
        const now = performance.now();
        frameTimes.push(now - last);
        last = now;
      }
      const avgFrameMs =
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = Math.round(1000 / avgFrameMs);

      // Accessibility checks
      const buttonsWithoutNames = Array.from(
        document.querySelectorAll('button')
      ).filter(
        (b) => !b.textContent?.trim() && !b.getAttribute('aria-label')
      ).length;

      const inputsWithoutLabels = Array.from(
        document.querySelectorAll('input, select')
      ).filter((el) => {
        const id = el.getAttribute('id');
        return !id || !document.querySelector(`label[for="${id}"]`);
      }).length;

      return {
        domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
        loadCompleteMs: Math.round(nav.loadEventEnd),
        fcpMs: Math.round(fcp),
        cls: Number(cls.toFixed(4)),
        avgFrameMs: Number(avgFrameMs.toFixed(2)),
        fps,
        buttonsWithoutNames,
        inputsWithoutLabels,
      };
    });

    console.log('=== MERIDIAN DESKTOP PERFORMANCE & ACCESSIBILITY AUDIT ===');
    console.log(JSON.stringify(metrics, null, 2));
    await browser.close();
  } finally {
    server.close();
  }
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
