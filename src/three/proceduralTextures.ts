import * as THREE from 'three';

export interface WatchTextureBundle {
  studioEnvMap: THREE.DataTexture;
  sunburstNormalMap: THREE.CanvasTexture;
  sunburstRoughnessMap: THREE.CanvasTexture;
  dialPrintLightMap: THREE.CanvasTexture;
  dialPrintDarkMap: THREE.CanvasTexture;
  dateWheelMap: THREE.CanvasTexture;
  brushedNormalMap: THREE.CanvasTexture;
  brushedRoughnessMap: THREE.CanvasTexture;
  genevaNormalMap: THREE.CanvasTexture;
  leatherNormalMap: THREE.CanvasTexture;
  leatherRoughnessMap: THREE.CanvasTexture;
  nylonNormalMap: THREE.CanvasTexture;
  nylonRoughnessMap: THREE.CanvasTexture;
}

let cachedBundle: WatchTextureBundle | null = null;

/**
 * Generates a calibrated studio softbox equirectangular environment map
 * (modeled after Poly Haven studio_small_09) with controlled dynamic range
 * so 316L steel bevels and sunburst dials show rich specular gradations without clipping.
 */
function createStudioEnvMap(): THREE.DataTexture {
  const width = 512;
  const height = 256;
  const data = new Uint8Array(width * height * 4);

  const softbox = (
    u: number,
    v: number,
    cu: number,
    cv: number,
    hw: number,
    hh: number,
    softness: number
  ) => {
    let du = Math.abs(u - cu);
    if (du > 0.5) du = 1.0 - du;
    const dv = Math.abs(v - cv);
    const sx = THREE.MathUtils.smoothstep(hw + softness, hw - softness, du);
    const sy = THREE.MathUtils.smoothstep(hh + softness, hh - softness, dv);
    return sx * sy;
  };

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const idx = (y * width + x) * 4;

      // Studio ambient gradient (deep slate-navy floor to cool studio ceiling)
      const horizon = Math.exp(-Math.pow((v - 0.5) * 3.2, 2));
      const dome = Math.max(0, Math.sin(v * Math.PI));
      let r = 0.08 + horizon * 0.14 + dome * 0.06;
      let g = 0.11 + horizon * 0.18 + dome * 0.08;
      let b = 0.16 + horizon * 0.24 + dome * 0.11;

      // Primary overhead-left key softbox (warm ivory diffuser)
      const keyBox = softbox(u, v, 0.22, 0.72, 0.14, 0.11, 0.08);
      r += keyBox * 0.85;
      g += keyBox * 0.81;
      b += keyBox * 0.74;

      // Long architectural rim strip on right (creates crisp bevel highlight along lugs/bezel)
      const rimStrip = softbox(u, v, 0.76, 0.58, 0.05, 0.26, 0.05);
      r += rimStrip * 0.72;
      g += rimStrip * 0.78;
      b += rimStrip * 0.88;

      // Secondary fill diffuser box front-left
      const fillBox = softbox(u, v, 0.44, 0.54, 0.12, 0.1, 0.08);
      r += fillBox * 0.48;
      g += fillBox * 0.52;
      b += fillBox * 0.58;

      // Top crown hair-light strip
      const topStrip = softbox(u, v, 0.5, 0.88, 0.32, 0.04, 0.05);
      r += topStrip * 0.65;
      g += topStrip * 0.61;
      b += topStrip * 0.54;

      // Subtle warm champagne bounce card from below
      const bounce = softbox(u, v, 0.5, 0.18, 0.28, 0.08, 0.08);
      r += bounce * 0.34;
      g += bounce * 0.29;
      b += bounce * 0.22;

      data[idx] = Math.min(255, Math.round(r * 255));
      data[idx + 1] = Math.min(255, Math.round(g * 255));
      data[idx + 2] = Math.min(255, Math.round(b * 255));
      data[idx + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Smooth, high-resolution radial sunburst tangent-space normal map + anisotropic roughness map.
 * Produces a silk-like butterfly sunburst sheen across the dial without grainy speckle artifacts.
 */
function createSunburstMaps(): {
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 1024;
  const normCanvas = document.createElement('canvas');
  normCanvas.width = size;
  normCanvas.height = size;
  const nCtx = normCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(size, size);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(size, size);

  const half = size / 2;

  for (let y = 0; y < size; y++) {
    const dy = (y - half) / half;
    for (let x = 0; x < size; x++) {
      const dx = (x - half) / half;
      const r = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(dy, dx);

      // Smooth radial micro-grooves + low-order anisotropic butterfly lobe
      const radialFade = THREE.MathUtils.smoothstep(r, 0.02, 0.16);
      const fineGrooves =
        Math.sin(theta * 240.0) * 0.18 +
        Math.sin(theta * 480.0 + 0.8) * 0.12 +
        Math.cos(theta * 96.0) * 0.14;
      const butterflyTilt = Math.sin(theta * 2.0 + 0.45) * 0.28;
      const dTheta = (fineGrooves + butterflyTilt) * radialFade;

      // Tangent vector perpendicular to radius: (-sin(theta), cos(theta))
      const tx = -Math.sin(theta);
      const ty = Math.cos(theta);

      const nx = tx * dTheta;
      const ny = ty * dTheta;
      const nz = Math.sqrt(Math.max(0.2, 1.0 - nx * nx - ny * ny));

      const idx = (y * size + x) * 4;
      nImg.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;

      // Anisotropic radial shimmer in roughness channel (creates the 2 bright opposing sunburst cones)
      const cone = Math.pow(Math.abs(Math.cos(theta - 0.55)), 2.2);
      const sheen = 0.34 - cone * 0.21 + fineGrooves * 0.04;
      const rVal = Math.max(24, Math.min(165, Math.round(sheen * 255)));
      rImg.data[idx] = rVal;
      rImg.data[idx + 1] = rVal;
      rImg.data[idx + 2] = rVal;
      rImg.data[idx + 3] = 255;
    }
  }

  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(normCanvas);
  normalMap.anisotropy = 8;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = 8;
  roughnessMap.needsUpdate = true;

  return { normalMap, roughnessMap };
}

/**
 * Renders the crisp horological dial markings:
 * railway minute track, 1/5th second ticks, MERIDIAN GENÈVE wordmark,
 * CHRONOMÈTRE AUTOMATIQUE 72H inscription, and SWISS MADE footer.
 */
function createDialPrintTexture(inkColor: string, accentColor: string): THREE.CanvasTexture {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Subtle concentric chapter ring hairline circles
  ctx.strokeStyle = inkColor;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(c, c, 918, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(c, c, 876, 0, Math.PI * 2);
  ctx.stroke();

  // Inner subtle chronometer ring
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(c, c, 540, 0, Math.PI * 2);
  ctx.stroke();

  // 300 sub-second ticks (1/5th sec) + 60 minute ticks
  for (let i = 0; i < 300; i++) {
    const angle = (i / 300) * Math.PI * 2 - Math.PI / 2;
    const isFiveMin = i % 25 === 0;
    const isMinute = i % 5 === 0;

    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);

    if (isFiveMin) {
      ctx.globalAlpha = 0.92;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(876, 0);
      ctx.lineTo(918, 0);
      ctx.stroke();
    } else if (isMinute) {
      ctx.globalAlpha = 0.72;
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(884, 0);
      ctx.lineTo(918, 0);
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.36;
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(898, 0);
      ctx.lineTo(918, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Minute numerals (05, 10, ... 60) outside track
  ctx.fillStyle = inkColor;
  ctx.globalAlpha = 0.68;
  ctx.font = '600 22px "Manrope", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let h = 1; h <= 12; h++) {
    const angle = (h / 12) * Math.PI * 2 - Math.PI / 2;
    const r = 946;
    const x = c + Math.cos(angle) * r;
    const y = c + Math.sin(angle) * r;
    const label = String(h * 5).padStart(2, '0');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  // Brand Crest & Typography at 12 o'clock
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = inkColor;
  ctx.font = '400 72px "Instrument Serif", Georgia, serif';
  ctx.letterSpacing = '14px';
  ctx.fillText('MERIDIAN', c + 7, c - 295);

  ctx.globalAlpha = 0.8;
  ctx.font = '600 24px "Manrope", sans-serif';
  ctx.letterSpacing = '9px';
  ctx.fillText('GENÈVE', c + 4, c - 232);

  // Lower Chronometer Inscriptions at 6 o'clock
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = accentColor;
  ctx.font = '600 23px "Manrope", sans-serif';
  ctx.letterSpacing = '7px';
  ctx.fillText('CHRONOMÈTRE', c + 3, c + 245);

  ctx.globalAlpha = 0.78;
  ctx.fillStyle = inkColor;
  ctx.font = '400 34px "Instrument Serif", Georgia, serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('Automatique · 72h', c, c + 292);

  ctx.globalAlpha = 0.68;
  ctx.font = '500 20px "Manrope", sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('SWISS       MADE', c + 3, c + 852);

  // Subtle DATE aperture caption left of 3 o'clock window
  ctx.globalAlpha = 0.58;
  ctx.font = '600 17px "Manrope", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('DATE', c + 435, c);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Date wheel annular disc with 31 numerals.
 */
function createDateWheelTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  ctx.fillStyle = '#F2EEE6';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(11, 21, 34, 0.08)';
  ctx.lineWidth = 1;
  for (let r = 320; r < 490; r += 4) {
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#0B1522';
  ctx.font = '600 36px "Manrope", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const radius = 412;
  for (let d = 1; d <= 31; d++) {
    const offsetIndex = (d - 23 + 31) % 31;
    const angle = (offsetIndex / 31) * Math.PI * 2;
    const x = c + Math.cos(angle) * radius;
    const y = c + Math.sin(angle) * radius;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(String(d), 0, 0);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Directional satin brushed 316L steel normal + roughness maps.
 */
function createBrushedMetalMaps(): {
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const nCanvas = document.createElement('canvas');
  nCanvas.width = size;
  nCanvas.height = size;
  const nCtx = nCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(size, size);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(size, size);

  const rowOffsets = new Float32Array(size);
  for (let x = 0; x < size; x++) {
    rowOffsets[x] =
      Math.sin(x * 0.9) * 0.4 +
      Math.cos(x * 2.7) * 0.35 +
      Math.sin(x * 6.3) * 0.25;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const streak =
        rowOffsets[x] +
        Math.sin(y * 0.08 + x * 1.9) * 0.25 +
        Math.cos(x * 11.4 + (y % 7) * 0.2) * 0.25;

      const nx = streak * 0.35;
      const ny = 0.02;
      const nz = 0.93;

      nImg.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;

      const rough = Math.round((0.32 + streak * 0.1) * 255);
      const clamped = Math.max(40, Math.min(150, rough));
      rImg.data[idx] = clamped;
      rImg.data[idx + 1] = clamped;
      rImg.data[idx + 2] = clamped;
      rImg.data[idx + 3] = 255;
    }
  }

  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(nCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(3, 3);
  normalMap.anisotropy = 8;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 3);
  roughnessMap.anisotropy = 8;

  return { normalMap, roughnessMap };
}

/**
 * Côtes de Genève (Geneva Stripes) normal map for the Calibre M-01 movement bridges.
 */
function createGenevaNormalMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const bandPhase = (x / size) * Math.PI * 16;
      const ribSlope = Math.cos(bandPhase) * 0.45;
      const microArc = Math.sin(y * 0.9 + Math.sin(bandPhase) * 3.0) * 0.22;

      const nx = ribSlope;
      const ny = microArc;
      const nz = 0.86;

      img.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      img.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      img.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Full-grain calfskin/alligator pebble normal & roughness map for leather strap.
 */
function createLeatherMaps(): {
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const nCanvas = document.createElement('canvas');
  nCanvas.width = size;
  nCanvas.height = size;
  const nCtx = nCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(size, size);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const u = x * 0.14;
      const v = y * 0.14;

      const cellX = Math.sin(u) * Math.cos(v * 0.8 + Math.sin(u * 0.5));
      const cellY = Math.cos(u * 0.9) * Math.sin(v + Math.cos(v * 0.4));
      const fine = Math.sin(u * 4.3 + v * 3.7) * 0.18;

      const nx = (cellX + fine) * 0.45;
      const ny = (cellY - fine) * 0.45;
      const nz = 0.85;

      nImg.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;

      const rVal = Math.round((0.52 + cellX * cellY * 0.18) * 255);
      rImg.data[idx] = rVal;
      rImg.data[idx + 1] = rVal;
      rImg.data[idx + 2] = rVal;
      rImg.data[idx + 3] = 255;
    }
  }

  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(nCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(3, 6);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 6);

  return { normalMap, roughnessMap };
}

/**
 * High-density ribbed sailcloth / NATO nylon weave normal + roughness map.
 */
function createNylonMaps(): {
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 256;
  const nCanvas = document.createElement('canvas');
  nCanvas.width = size;
  nCanvas.height = size;
  const nCtx = nCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(size, size);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const warp = Math.sin((x + (y % 8) * 2) * 0.85);
      const weft = Math.cos(y * 1.35);

      const nx = warp * 0.55;
      const ny = weft * 0.55;
      const nz = 0.78;

      nImg.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;

      const rVal = Math.round((0.66 + warp * weft * 0.14) * 255);
      rImg.data[idx] = rVal;
      rImg.data[idx + 1] = rVal;
      rImg.data[idx + 2] = rVal;
      rImg.data[idx + 3] = 255;
    }
  }

  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(nCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(6, 14);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(6, 14);

  return { normalMap, roughnessMap };
}

export function getWatchTextureBundle(): WatchTextureBundle {
  if (cachedBundle) return cachedBundle;

  const studioEnvMap = createStudioEnvMap();
  const sunburst = createSunburstMaps();
  const dialPrintLightMap = createDialPrintTexture('#F2EEE6', '#D8C3A0');
  const dialPrintDarkMap = createDialPrintTexture('#0B1522', '#8B6F47');
  const dateWheelMap = createDateWheelTexture();
  const brushed = createBrushedMetalMaps();
  const genevaNormalMap = createGenevaNormalMap();
  const leather = createLeatherMaps();
  const nylon = createNylonMaps();

  cachedBundle = {
    studioEnvMap,
    sunburstNormalMap: sunburst.normalMap,
    sunburstRoughnessMap: sunburst.roughnessMap,
    dialPrintLightMap,
    dialPrintDarkMap,
    dateWheelMap,
    brushedNormalMap: brushed.normalMap,
    brushedRoughnessMap: brushed.roughnessMap,
    genevaNormalMap,
    leatherNormalMap: leather.normalMap,
    leatherRoughnessMap: leather.roughnessMap,
    nylonNormalMap: nylon.normalMap,
    nylonRoughnessMap: nylon.roughnessMap,
  };

  return cachedBundle;
}
