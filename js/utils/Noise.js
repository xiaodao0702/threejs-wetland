// ============================================================
// Noise.js — 确定性随机与程序化噪声（值噪声 + fbm）
// ============================================================

// 可复现 PRNG（mulberry32）
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// 确定性 2D 哈希（值噪声格点）
export function hash2(x, y, seed) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return s - Math.floor(s);
}

export function smoothstep(a, b, t) {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

// 双线性插值值噪声
export function valueNoise2D(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// 分形叠加噪声（octaves 层）
export function fbm2D(x, y, seed = 0, octaves = 4, lacunarity = 2.0, gain = 0.5) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * freq, y * freq, seed + i * 13.7) * amp;
    norm += amp;
    amp *= gain; freq *= lacunarity;
  }
  return sum / norm;
}

// 分形叠加 1D（沿弧长，用于岸线等）
export function fbm1D(t, seed = 0, octaves = 4) {
  return fbm2D(t * 1.0, seed * 0.37 + 0.123, seed, octaves);
}

// 平滑 2D 噪声（范围 0~1，带阈值锐化）
export function noise2D(x, y, seed, octaves = 3) {
  return fbm2D(x, y, seed, octaves);
}
