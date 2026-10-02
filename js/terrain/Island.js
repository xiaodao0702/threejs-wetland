// ============================================================
// Island.js — 湿地岛屿（不规则泥丘）+ 水下泥裙
// 环形网格噪声成形；顶点色做岸边湿黑→顶部干燥渐变
// ============================================================
import * as THREE from 'three';
import { CONFIG } from '../config/sceneConfig.js';
import { fbm2D, smoothstep, mulberry32 } from '../utils/Noise.js';
import { islandMudTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';

function buildIslandGeometry(radius, peak, seed) {
  const rings = 24, segs = 32;
  const positions = [], uvs = [], colors = [], indices = [];
  const rng = mulberry32(seed + 77);
  const dry = new THREE.Color(0.52, 0.50, 0.41);
  const wet = new THREE.Color(0.26, 0.27, 0.24);

  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const r = radius * Math.pow(t, 0.78);
    const fall = 1 - smoothstep(0.42, 1.0, t);
    const n = fbm2D(Math.cos(i * 0.7) * 3.1, Math.sin(i * 0.7) * 3.1 + seed * 0.13, seed, 3);
    let h = peak * fall * (0.72 + 0.28 * n);
    h += peak * 0.14 * (n - 0.5) * t;
    h = Math.max(0.02, h);
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2 + fbm2D(i * 0.9, j * 0.17, seed + 9, 2) * 0.05;
      const rr = r * (1 + fbm2D(i * 0.8, j * 0.23, seed + 21, 2) * 0.09);
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      positions.push(x, h, z);
      uvs.push((x / radius) * 0.5 + 0.5, (z / radius) * 0.5 + 0.5);
      const wetAmt = smoothstep(0.3, 0.92, t) * (0.75 + 0.25 * fbm2D(x * 0.5, z * 0.5, seed + 33, 2));
      const c = dry.clone().lerp(wet, wetAmt);
      colors.push(c.r, c.g, c.b);
      if (i < rings && j < segs) {
        const a0 = i * (segs + 1) + j, a1 = a0 + 1, b0 = (i + 1) * (segs + 1) + j, b1 = b0 + 1;
        indices.push(a0, b0, a1, a1, b0, b1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geo.computeVertexNormals();
  return geo;
}

// 岛屿表面高度采样（与几何成形公式近似一致，供植被贴地）
export function sampleIslandHeight(radius, peak, seed, x, z) {
  const t0 = Math.min(1, Math.hypot(x, z) / radius);
  const t = Math.pow(t0, 1 / 0.78);
  const fall = 1 - smoothstep(0.42, 1.0, t);
  const n = fbm2D(x * 0.35, z * 0.35, seed, 3);
  let h = peak * fall * (0.72 + 0.28 * n) + peak * 0.14 * (n - 0.5) * t;
  return Math.max(0.02, h) - 0.07; // 轻微下沉，避免植被浮空
}

// 岛屿：返回 mesh（castShadow）
export function createIsland(x, z, radius, peak, seed, scene) {
  const geo = buildIslandGeometry(radius, peak, seed);
  const material = mat({
    map: islandMudTexture(seed % 97 + 5, 512, 2.5),
    color: 0xc2c0a8,
    roughness: 0.96, metalness: 0,
    envIntensity: 0.25,
    vertexColors: true,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, CONFIG.levels.mudFloor, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // 水下泥裙（略低于水面，模拟浅泥延伸与水深渐变）
  const skirt = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 1.26, 26),
    mat({ color: 0x3b3d35, roughness: 1.0, metalness: 0, envIntensity: 0.1 })
  );
  skirt.rotation.x = -Math.PI / 2;
  skirt.position.set(x, CONFIG.levels.mudSkirt, z);
  skirt.receiveShadow = false;
  scene.add(skirt);

  return { mesh, skirt, radius, peak, x, z };
}
