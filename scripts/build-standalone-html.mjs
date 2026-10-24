import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function buildStandaloneHtml() {
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error('dist/index.html not found. Run `npm run build` first.');
  }

  let html = fs.readFileSync(indexHtmlPath, 'utf-8');

  // 1. Inline all CSS <link rel="stylesheet" crossorigin href="/assets/...">
  html = html.replace(
    /<link\s+[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
    (match, href) => {
      const relPath = href.replace(/^\//, '');
      const cssFilePath = path.join(distDir, relPath);
      if (!fs.existsSync(cssFilePath)) return match;
      let cssContent = fs.readFileSync(cssFilePath, 'utf-8');

      // Inline /fonts/*.woff2 inside CSS as base64 data:font/woff2;base64,...
      cssContent = cssContent.replace(
        /url\((['"]?)\/fonts\/([^)'"]+)\1\)/g,
        (urlMatch, _quote, fontFile) => {
          const fontPath = path.join(distDir, 'fonts', fontFile);
          if (!fs.existsSync(fontPath)) return urlMatch;
          const b64 = fs.readFileSync(fontPath).toString('base64');
          return `url("data:font/woff2;base64,${b64}")`;
        }
      );

      return `<style>${cssContent}</style>`;
    }
  );

  // 2. Inline favicon.svg as data URI
  const faviconPath = path.join(distDir, 'favicon.svg');
  if (fs.existsSync(faviconPath)) {
    const svgB64 = fs.readFileSync(faviconPath).toString('base64');
    html = html.replace(
      /href="\/favicon\.svg"/g,
      `href="data:image/svg+xml;base64,${svgB64}"`
    );
  }

  // 3. Inline all JS <script type="module" crossorigin src="/assets/..."></script>
  html = html.replace(
    /<script\s+[^>]*src="([^"]+)"[^>]*><\/script>/g,
    (match, src) => {
      const relPath = src.replace(/^\//, '');
      const jsFilePath = path.join(distDir, relPath);
      if (!fs.existsSync(jsFilePath)) return match;
      const jsContent = fs.readFileSync(jsFilePath, 'utf-8');
      // Escape any literal </script> inside JS string literals so HTML parser never terminates early
      const safeJs = jsContent.replace(/<\/script>/gi, '<\\/script>');
      return `<script type="module">${safeJs}</script>`;
    }
  );

  const outRootPath = path.join(rootDir, 'meridian-standalone.html');
  const outDistPath = path.join(distDir, 'meridian-standalone.html');
  fs.writeFileSync(outRootPath, html, 'utf-8');
  fs.writeFileSync(outDistPath, html, 'utf-8');

  const sizeKb = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1);
  console.log(
    `[Standalone HTML] Created self-contained HTML bundle (${sizeKb} KB):\n - ${outRootPath}\n - ${outDistPath}`
  );
}

buildStandaloneHtml();
