// ============================================================
// ReedPatch.js — 芦苇丛（实例化成片，独立簇/岛/岸线共用）
// 双变体几何 + 逐株矩阵/色彩变化 + 顶点风摆
// ============================================================
import * as THREE from 'three';
import { mulberry32 } from '../utils/Noise.js';
import { makeReedGeometry } from './ReedPlant.js';
import { injectWind } from '../effects/WindSway.js';
import { PALETTE } from '../config/sceneConfig.js';

const GREENS = PALETTE.reedGreen.map(c => new THREE.Color(c));
const YELLOWS = PALETTE.reedYellow.map(c => new THREE.Color(c));

function composeMatrix(out, px, py, pz, s, rx, ry, rz) {
  out.makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
  out.scale(new THREE.Vector3(s, s, s));
  out.setPosition(px, py, pz);
  return out;
}

// 创建一处芦苇丛
// opts: {x, z, radius, count, seed, heightScale, heightFn, deadMix, split}
export function createReedPatch(scene, opts) {
  const {
    x = 0, z = 0, radius = 8, count = 300, seed = 1,
    heightScale = 1, heightFn = null, baseY = 0,
    deadMix = 0.18, split = [0.6, 0.4],
  } = opts;

  const rng = mulberry32(seed);
  const g1 = makeReedGeometry(seed, heightScale);
  const g2 = makeReedGeometry(seed + 557, heightScale * 0.72);
  const n1 = Math.floor(count * split[0]);
  const n2 = count - n1;

  const makeInstanced = (geo, n, variant) => {
    const mesh = new THREE.InstancedMesh(geo, reedMaterial, n);
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      // 密度：中心密、边缘疏
      const r = radius * Math.pow(rng(), 0.65);
      const a = rng() * Math.PI * 2;
      const px = x + Math.cos(a) * r;
      const pz = z + Math.sin(a) * r;
      const py = heightFn ? heightFn(px, pz) : baseY;
      const s = (0.72 + rng() * 0.55) * (variant === 1 ? 1 : 0.85);
      const rx = (rng() - 0.5) * 0.07, rz = (rng() - 0.5) * 0.07, ry = rng() * Math.PI * 2;
      composeMatrix(m, px, py, pz, s, rx, ry, rz);
      mesh.setMatrixAt(i, m);
      // 色彩：活苇灰绿 / 枯黄死苇
      const dead = rng() < deadMix;
      const c = dead ? YELLOWS[Math.floor(rng() * YELLOWS.length)] : GREENS[Math.floor(rng() * GREENS.length)];
      const j = 0.82 + rng() * 0.34;
      mesh.setColorAt(i, new THREE.Color(c.r * j, c.g * j, c.b * j));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    scene.add(mesh);
    return mesh;
  };

  const reedMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.3,
  });
  injectWind(reedMaterial, 'reed');

  const meshes = [];
  meshes.push(makeInstanced(g1, n1, 1));
  if (n2 > 0) meshes.push(makeInstanced(g2, n2, 2));

  // ---- 远观草冠层（小锥簇）：为远处芦苇提供成片毛糙质感 ----
  if (opts.canopy !== false) {
    const n = Math.floor(count * 0.4);
    const cgeo = new THREE.ConeGeometry(0.085, 0.34, 6, 1);
    cgeo.translate(0, 0.17, 0);
    const cmesh = new THREE.InstancedMesh(cgeo, reedMaterial, n);
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const r = radius * Math.pow(rng(), 0.55);
      const a = rng() * Math.PI * 2;
      const px = x + Math.cos(a) * r;
      const pz = z + Math.sin(a) * r;
      const py = heightFn ? heightFn(px, pz) : baseY;
      const s = 0.7 + rng() * 0.55;
      const cy = py + (1.5 * heightScale) * 0.66 * s;
      composeMatrix(m, px, cy, pz, s, (rng() - 0.5) * 0.35, rng() * Math.PI * 2, (rng() - 0.5) * 0.35);
      cmesh.setMatrixAt(i, m);
      const dead = rng() < deadMix + 0.1;
      const c = dead ? YELLOWS[Math.floor(rng() * YELLOWS.length)] : GREENS[Math.floor(rng() * GREENS.length)];
      cmesh.setColorAt(i, new THREE.Color(c.r, c.g, c.b).multiplyScalar(0.78 + rng() * 0.32));
    }
    cmesh.instanceMatrix.needsUpdate = true;
    if (cmesh.instanceColor) cmesh.instanceColor.needsUpdate = true;
    scene.add(cmesh);
    meshes.push(cmesh);
  }
  return meshes;
}
