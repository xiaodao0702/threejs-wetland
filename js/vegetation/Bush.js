// ============================================================
// Bush.js — 低矮灌木丛（独立建模：枝干 + 叶簇团）
// ============================================================
import * as THREE from 'three';
import { mulberry32 } from '../utils/Noise.js';
import { bendCylinder, mergeGeometries, mat } from '../utils/Helpers.js';
import { PALETTE } from '../config/sceneConfig.js';

export function makeBush(seed, scale = 1) {
  const rng = mulberry32(seed);
  const group = new THREE.Group();

  // 枝干（3~6 根，弯曲、灰褐）
  const branches = [];
  for (let i = 0; i < 3 + Math.floor(rng() * 4); i++) {
    const h = (0.28 + rng() * 0.42) * scale;
    const r = 0.012 + rng() * 0.012;
    const a = rng() * Math.PI * 2;
    const b = bendCylinder(r * 0.4, r, h, 4, 3, (rng() - 0.5) * 0.4);
    b.translate(Math.cos(a) * 0.08, h / 2, Math.sin(a) * 0.08);
    branches.push(b);
  }
  const branchMat = mat({ color: 0x3f3a2f, roughness: 0.95, metalness: 0, envIntensity: 0.2 });
  const branchMesh = new THREE.Mesh(mergeGeometries(branches), branchMat);
  branchMesh.castShadow = true;
  group.add(branchMesh);

  // 叶簇（6~12 团低多边形叶片团）
  const leafGeoParts = [];
  const leafColors = [];
  const base = new THREE.Color(PALETTE.bushGreen[0]);
  for (let i = 0; i < 6 + Math.floor(rng() * 7); i++) {
    const r = (0.05 + rng() * 0.07) * scale;
    const a = rng() * Math.PI * 2;
    const rr = rng() * 0.5;
    const h = (0.2 + rng() * 0.5) * scale;
    const s = new THREE.SphereGeometry(r, 5, 4);
    s.scale(1, 0.78, 1 + rng() * 0.4);
    s.translate(Math.cos(a) * rr * scale * 0.45, h, Math.sin(a) * rr * scale * 0.45);
    // 叶色 jitter
    const j = 0.75 + rng() * 0.5;
    leafColors.push(base.r * j, base.g * j, base.b * j);
    leafGeoParts.push(s);
  }
  const leafGeo = mergeGeometries(leafGeoParts);
  leafGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(leafColors), 3));
  const leafMat = mat({
    color: 0xffffff, roughness: 0.92, metalness: 0, envIntensity: 0.25, vertexColors: true,
  });
  const leafMesh = new THREE.Mesh(leafGeo, leafMat);
  leafMesh.castShadow = true;
  group.add(leafMesh);

  group.scale.setScalar(1);
  return group;
}

// 散布灌木（14~20 丛：岛缘缓坡、岸沿、泥堤）
export function createBushes(scene, spots) {
  const bushes = [];
  for (const [x, z, s, seed] of spots) {
    const b = makeBush(seed, s);
    b.position.set(x, 0, z); // 高度由组装层通过 heightFn 设置
    scene.add(b);
    bushes.push(b);
  }
  return bushes;
}
