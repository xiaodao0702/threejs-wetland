// ============================================================
// TextureFactory.js — 程序化 PBR 纹理工厂（Canvas 生成，零外部贴图）
// 全部纹理由种子噪声确定性生成：泥滩/混凝土/锈蚀钢/工业漆/波纹板/
// 沥青/水深斑驳/柔圆粒/雾噪/水渍垂纹
// ============================================================
import * as THREE from 'three';
import { mulberry32, fbm2D } from './Noise.js';

function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  return { cv, ctx };
}

function toTexture(cv, { repeat = 1, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function noiseFill(ctx, w, h, seed, base, amp, freq = 6, mono = false) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm2D((x / w) * freq, (y / h) * freq, seed, 3);
      let r = base[0] + (n - 0.5) * amp;
      let g = base[1] + (n - 0.5) * amp;
      let b = base[2] + (n - 0.5) * amp;
      if (mono) { const v = r; r = g = b = v; }
      const i = (y * w + x) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function addBlotches(ctx, w, h, seed, color, count, alpha, sizeMin, sizeMax) {
  const rng = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const x = rng() * w, y = rng() * h;
    const r = sizeMin + rng() * (sizeMax - sizeMin);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${alpha})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function addStreaks(ctx, w, h, seed, color, alpha, count, maxLen, width) {
  const rng = mulberry32(seed);
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const y = rng() * h * 0.2;
    const len = maxLen * (0.3 + rng() * 0.7);
    ctx.lineWidth = width * (0.4 + rng());
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + (rng() - 0.5) * 8, y + len * 0.4, x + (rng() - 0.5) * 12, y + len * 0.7, x + (rng() - 0.5) * 14, y + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function addCracks(ctx, w, h, seed, color, alpha, count) {
  const rng = mulberry32(seed);
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    let x = rng() * w, y = rng() * h;
    const segs = 3 + Math.floor(rng() * 4);
    ctx.lineWidth = 0.8 + rng() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < segs; s++) {
      x += (rng() - 0.5) * 60;
      y += (rng() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    // 支裂纹
    if (rng() < 0.6) {
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rng() - 0.5) * 40, y + (rng() - 0.5) * 30);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------- 泥滩 / 湿泥 ----------------
export function mudTexture(seed = 1, w = 512, repeat = 6) {
  const { cv, ctx } = makeCanvas(w, w);
  noiseFill(ctx, w, w, seed, [126, 128, 112], 26, 7);
  // 湿泥深斑（低处积水样）
  addBlotches(ctx, w, w, seed + 11, '58,60,52', 26, 0.35, 10, 46);
  addBlotches(ctx, w, w, seed + 23, '94,96,80', 20, 0.28, 8, 34);
  // 泥粒与细沙点
  const rng = mulberry32(seed + 5);
  for (let i = 0; i < 2600; i++) {
    const x = rng() * w, y = rng() * w;
    const v = rng();
    ctx.fillStyle = v < 0.5 ? 'rgba(70,70,58,0.5)' : 'rgba(160,158,140,0.4)';
    ctx.fillRect(x, y, 1 + rng() * 2, 1 + rng() * 2);
  }
  // 绿色藻迹
  addBlotches(ctx, w, w, seed + 37, '84,96,70', 12, 0.16, 14, 52);
  const tex = toTexture(cv, { repeat });
  return tex;
}

// 岛屿泥地（略干、带有机质）
export function islandMudTexture(seed = 2, w = 512, repeat = 3) {
  const { cv, ctx } = makeCanvas(w, w);
  noiseFill(ctx, w, w, seed, [132, 133, 116], 24, 6);
  addBlotches(ctx, w, w, seed + 7, '74,74,60', 20, 0.3, 8, 40);
  addBlotches(ctx, w, w, seed + 17, '150,146,128', 16, 0.24, 6, 30);
  // 草根碎屑
  const rng = mulberry32(seed + 3);
  for (let i = 0; i < 1400; i++) {
    const x = rng() * w, y = rng() * w;
    ctx.fillStyle = rng() < 0.5 ? 'rgba(86,86,70,0.6)' : 'rgba(170,164,142,0.5)';
    ctx.fillRect(x, y, 1 + rng() * 3, 1 + rng() * 2);
  }
  return toTexture(cv, { repeat });
}

// ---------------- 混凝土（返碱/裂纹/水渍）----------------
export function concreteTexture(seed = 3, w = 512, repeat = 4) {
  const { cv, ctx } = makeCanvas(w, w);
  noiseFill(ctx, w, w, seed, [144, 146, 141], 22, 8);
  // 返碱白斑
  addBlotches(ctx, w, w, seed + 9, '196,199,193', 22, 0.38, 12, 50);
  addBlotches(ctx, w, w, seed + 19, '212,213,208', 14, 0.26, 10, 42);
  // 雨水垂痕（暗）
  addStreaks(ctx, w, w, seed + 29, '98,101,97', 0.36, 26, 420, 2.4);
  // 油污斑
  addBlotches(ctx, w, w, seed + 41, '48,48,44', 12, 0.3, 8, 30);
  // 裂纹
  addCracks(ctx, w, w, seed + 53, '82,84,80', 0.55, 9);
  // 模板孔/蜂窝
  const rng = mulberry32(seed + 61);
  for (let i = 0; i < 30; i++) {
    const x = rng() * w, y = rng() * w;
    ctx.fillStyle = 'rgba(108,110,106,0.4)';
    ctx.beginPath();
    ctx.arc(x, y, 2 + rng() * 3, 0, 7);
    ctx.fill();
  }
  return toTexture(cv, { repeat });
}

// ---------------- 锈蚀钢材 ----------------
export function rustTexture(seed = 4, w = 512, repeat = 4) {
  const { cv, ctx } = makeCanvas(w, w);
  noiseFill(ctx, w, w, seed, [74, 78, 82], 18, 8);   // 暗钢基底
  // 锈蚀大斑
  addBlotches(ctx, w, w, seed + 13, '138,92,52', 26, 0.4, 14, 60);
  addBlotches(ctx, w, w, seed + 27, '104,66,40', 22, 0.34, 10, 44);
  addBlotches(ctx, w, w, seed + 39, '158,110,64', 14, 0.26, 8, 34);
  // 锈点
  const rng = mulberry32(seed + 51);
  for (let i = 0; i < 2400; i++) {
    const x = rng() * w, y = rng() * w;
    ctx.fillStyle = rng() < 0.6 ? 'rgba(120,78,44,0.55)' : 'rgba(58,58,54,0.5)';
    ctx.fillRect(x, y, 1 + rng() * 2, 1 + rng() * 2);
  }
  // 竖向流锈
  addStreaks(ctx, w, w, seed + 63, '96,62,38', 0.3, 16, 380, 2.0);
  return toTexture(cv, { repeat });
}

// ---------------- 褪色工业漆（掉漆见锈）----------------
export function paintedSteelTexture(seed = 5, w = 512, repeat = 4) {
  const { cv, ctx } = makeCanvas(w, w);
  noiseFill(ctx, w, w, seed, [108, 116, 122], 16, 8);   // 灰蓝漆面
  // 掉漆块（露出锈）
  addBlotches(ctx, w, w, seed + 15, '126,84,50', 18, 0.42, 10, 44);
  addBlotches(ctx, w, w, seed + 31, '94,62,38', 12, 0.36, 8, 30);
  // 漆面污渍
  addBlotches(ctx, w, w, seed + 47, '70,74,72', 12, 0.2, 12, 40);
  // 掉漆刮痕
  const rng = mulberry32(seed + 55);
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = '130,96,64';
  for (let i = 0; i < 14; i++) {
    const x = rng() * w, y = rng() * w;
    ctx.lineWidth = 1 + rng() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 70, y + (rng() - 0.5) * 50);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return toTexture(cv, { repeat });
}

// ---------------- 波纹金属板 ----------------
export function corrugatedTexture(seed = 6, w = 512, h = 256, repeat = [3, 1]) {
  const { cv, ctx } = makeCanvas(w, h);
  noiseFill(ctx, w, h, seed, [116, 121, 124], 12, 6);
  // 波纹明暗
  const rng = mulberry32(seed + 7);
  const bands = 26;
  const bw = w / bands;
  for (let i = 0; i < bands; i++) {
    const x = i * bw;
    const light = 0.5 + 0.5 * Math.sin(i * 0.9);
    ctx.fillStyle = `rgba(${light > 0.5 ? '150,154,156' : '88,92,95'},${0.5})`;
    ctx.fillRect(x, 0, bw * (0.75 + rng() * 0.2), h);
  }
  // 锈痕与污渍
  addStreaks(ctx, w, h, seed + 21, '104,70,44', 0.3, 18, 300, 2.2);
  addBlotches(ctx, w, h, seed + 33, '120,84,52', 10, 0.28, 10, 40);
  const tex = toTexture(cv, { repeat: repeat[0] });
  tex.repeat.set(repeat[0], repeat[1]);
  return tex;
}

// ---------------- 沥青/厂区地坪 ----------------
export function asphaltTexture(seed = 7, w = 512, repeat = 8) {
  const { cv, ctx } = makeCanvas(w, w);
  noiseFill(ctx, w, w, seed, [74, 76, 74], 14, 10);
  // 磨损车辙（浅）
  addStreaks(ctx, w, w, seed + 9, '108,110,106', 0.16, 10, 480, 8);
  // 油渍
  addBlotches(ctx, w, w, seed + 19, '38,40,38', 14, 0.3, 10, 44);
  // 裂缝
  addCracks(ctx, w, w, seed + 31, '52,54,52', 0.4, 8);
  // 碎砾
  const rng = mulberry32(seed + 43);
  for (let i = 0; i < 3200; i++) {
    const x = rng() * w, y = rng() * w;
    ctx.fillStyle = rng() < 0.5 ? 'rgba(58,60,58,0.6)' : 'rgba(120,122,116,0.35)';
    ctx.fillRect(x, y, 1 + rng() * 2, 1 + rng() * 2);
  }
  return toTexture(cv, { repeat });
}

// ---------------- 桥面沥青（车辙/油渍/裂缝/褪色标线/边缘积尘）----------------
export function deckAsphaltTexture(seed = 71, w = 1024) {
  const { cv, ctx } = makeCanvas(w, w);
  noiseFill(ctx, w, w, seed, [86, 88, 85], 12, 10);
  addStreaks(ctx, w, w, seed + 9, '126,128,122', 0.14, 12, 520, 10);
  addBlotches(ctx, w, w, seed + 19, '44,46,44', 16, 0.3, 12, 50);
  addCracks(ctx, w, w, seed + 31, '60,62,58', 0.42, 10);
  // 碎砾
  const rng = mulberry32(seed + 43);
  for (let i = 0; i < 4200; i++) {
    const x = rng() * w, y = rng() * w;
    ctx.fillStyle = rng() < 0.5 ? 'rgba(56,58,56,0.6)' : 'rgba(122,124,118,0.35)';
    ctx.fillRect(x, y, 1 + rng() * 2, 1 + rng() * 2);
  }
  // 褪色车道标线（磨损的虚线，横贯桥面）
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#cdd0be';
  for (let i = 0; i < 4; i++) {
    const x = (i + 0.5) * w / 4;
    ctx.fillRect(x - w * 0.045, w * 0.47, w * 0.09, w * 0.028);
    ctx.fillRect(x + w * 0.20 - w * 0.045, w * 0.47, w * 0.09, w * 0.028);
  }
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = '#aeb2a0';
  for (let i = 0; i < 4; i++) {
    const x = (i + 0.5) * w / 4;
    ctx.fillRect(x - w * 0.045, w * 0.53, w * 0.09, w * 0.028);
  }
  ctx.globalAlpha = 1;
  // 边缘积尘（上下压暗）
  const g = ctx.createLinearGradient(0, 0, 0, w);
  g.addColorStop(0, 'rgba(42,44,42,0.42)');
  g.addColorStop(0.1, 'rgba(42,44,42,0)');
  g.addColorStop(0.9, 'rgba(42,44,42,0)');
  g.addColorStop(1, 'rgba(42,44,42,0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
  const t = toTexture(cv, { repeat: 1 });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------------- 水面深度斑驳（大尺度暗/浅团块）----------------
export function waterDepthTexture(seed = 8, w = 512, repeat = 2.5) {
  const { cv, ctx } = makeCanvas(w, w);
  noiseFill(ctx, w, w, seed, [96, 106, 100], 14, 5);   // 中等灰度（作为深度遮罩）
  // 深水区暗斑
  addBlotches(ctx, w, w, seed + 11, '52,62,56', 22, 0.5, 18, 90);
  addBlotches(ctx, w, w, seed + 23, '70,82,74', 18, 0.4, 14, 70);
  // 浅水亮斑（近岸样）
  addBlotches(ctx, w, w, seed + 35, '146,158,148', 12, 0.3, 12, 60);
  // 腐殖质细点
  const rng = mulberry32(seed + 47);
  for (let i = 0; i < 1800; i++) {
    const x = rng() * w, y = rng() * w;
    ctx.fillStyle = rng() < 0.6 ? 'rgba(46,54,48,0.5)' : 'rgba(120,128,112,0.4)';
    ctx.fillRect(x, y, 1 + rng() * 2, 1 + rng() * 2);
  }
  return toTexture(cv, { repeat });
}

// ---------------- 柔圆粒（烟/雾/水汽精灵）----------------
export function softCircleTexture(size = 128) {
  const { cv, ctx } = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(cv);
}

// ---------------- 雾噪透明度贴图 ----------------
export function noiseAlphaTexture(seed = 9, w = 512, h = 256) {
  const { cv, ctx } = makeCanvas(w, h);
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm2D((x / w) * 5, (y / h) * 5, seed, 3);
      const a = Math.max(0, n - 0.35) * 255;
      const i = (y * w + x) * 4;
      d[i] = 235; d[i + 1] = 238; d[i + 2] = 234; d[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(cv, { srgb: false });
}

// ---------------- 玻璃渐变（上清下淡）----------------
export function glassGradientTexture() {
  const { cv, ctx } = makeCanvas(64, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(220,232,226,0.55)');
  g.addColorStop(0.4, 'rgba(220,232,226,0.28)');
  g.addColorStop(1, 'rgba(220,232,226,0.10)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(cv);
}
