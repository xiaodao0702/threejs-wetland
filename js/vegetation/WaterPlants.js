// ============================================================
// WaterPlants.js — 水面零散植物：漂浮叶、残枝、藻斑、出水莎草
// 全部独立小物件，散布静水面
// ============================================================
import * as THREE from 'three';
import { CONFIG, PALETTE } from '../config/sceneConfig.js';
import { mulberry32 } from '../utils/Noise.js';
import { mat, buildBladeGeometry, mergeGeometries } from '../utils/Helpers.js';

const W = CONFIG.levels.water;

export function makeFloatingLeaf(seed, x, z, s = 1) {
  const rng = mulberry32(seed);
  const g = new THREE.SphereGeometry(0.16 + rng() * 0.2, 8, 5);
  g.scale(1, 0.14, 1.35);
  g.rotateY(rng() * Math.PI * 2);
  const m = new THREE.Mesh(g, mat({
    color: PALETTE.waterPlant[0], roughness: 0.85, metalness: 0, envIntensity: 0.3,
  }));
  m.position.set(x, W + 0.085, z);
  m.rotation.z = (rng() - 0.5) * 0.12;
  m.scale.setScalar(s);
  return m;
}

export function makeDriftTwig(seed, x, z, s = 1) {
  const rng = mulberry32(seed);
  const len = (0.4 + rng() * 0.7) * s;
  const g = new THREE.CylinderGeometry(0.008, 0.014, len, 4, 2);
  g.translate(0, len / 2, 0);
  const branch = new THREE.CylinderGeometry(0.005, 0.009, len * 0.5, 4, 2);
  branch.translate(len * 0.25, len * 0.55, 0.02);
  const merged = mergeGeometries([g, branch]);
  const m = new THREE.Mesh(merged, mat({
    color: 0x3d372c, roughness: 0.9, metalness: 0, envIntensity: 0.2,
  }));
  m.position.set(x, W + 0.06, z);
  m.rotation.y = rng() * Math.PI * 2;
  m.rotation.z = (rng() - 0.5) * 0.06;
  return m;
}

export function makeAlgaePatch(seed, x, z, r = 1.2) {
  const g = new THREE.CircleGeometry(r, 20);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat({
    color: 0x35402f, roughness: 1, metalness: 0,
    transparent: true, opacity: 0.34, envIntensity: 0.2,
  }));
  m.position.set(x, W + 0.02, z);
  m.rotation.z = mulberry32(seed)() * Math.PI;
  m.material.polygonOffset = true;
  m.material.polygonOffsetFactor = 1;
  m.material.polygonOffsetUnits = 1;
  m.renderOrder = 2;
  return m;
}

// 出水莎草（水面冒出的短草簇）
export function makeEmergentSedge(seed, x, z, h = 0.4) {
  const rng = mulberry32(seed);
  const parts = [];
  const n = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < n; i++) {
    const hh = h * (0.7 + rng() * 0.5);
    const a = rng() * Math.PI * 2;
    const pts = [];
    const segs = 4;
    for (let s = 0; s <= segs; s++) {
      const t = s / segs;
      pts.push({
        x: Math.cos(a) * t * t * 0.06,
        y: t * hh,
        z: Math.sin(a) * t * t * 0.06,
      });
    }
    parts.push(buildBladeGeometry(pts, 0.012 + rng() * 0.008, 0.002, 4));
  }
  const m = new THREE.Mesh(mergeGeometries(parts), mat({
    color: 0x4a5840, roughness: 0.85, metalness: 0, envIntensity: 0.25, side: THREE.DoubleSide,
  }));
  m.position.set(x, W, z);
  return m;
}

// 批量组装水面零散植物
export function createWaterPlants(scene) {
  const rng = mulberry32(2024);
  const items = [];
  const box = { x: [-90, 90], z: [-64, 82] };
  for (let i = 0; i < 12; i++) {
    const x = box.x[0] + rng() * (box.x[1] - box.x[0]);
    const z = box.z[0] + rng() * (box.z[1] - box.z[0]);
    const leaf = makeFloatingLeaf(Math.floor(rng() * 1e6), x, z, 0.7 + rng() * 0.8);
    scene.add(leaf); items.push(leaf);
  }
  for (let i = 0; i < 10; i++) {
    const x = box.x[0] + rng() * (box.x[1] - box.x[0]);
    const z = box.z[0] + rng() * (box.z[1] - box.z[0]);
    const twig = makeDriftTwig(Math.floor(rng() * 1e6), x, z, 0.8 + rng() * 0.8);
    scene.add(twig); items.push(twig);
  }
  for (let i = 0; i < 6; i++) {
    const x = box.x[0] + rng() * (box.x[1] - box.x[0]);
    const z = box.z[0] + rng() * (box.z[1] - box.z[0]);
    const al = makeAlgaePatch(Math.floor(rng() * 1e6), x, z, 0.8 + rng() * 1.6);
    scene.add(al); items.push(al);
  }
  // 出水莎草：贴岸/浅水处
  const spots = [[-60, 74, 0.5], [10, 66, 0.6], [44, 36, 0.45], [-26, -12, 0.55], [62, -30, 0.5], [-8, -52, 0.5], [28, 4, 0.6], [-70, 20, 0.5]];
  for (const [x, z, h] of spots) {
    const sg = makeEmergentSedge(Math.floor(rng() * 1e6), x, z, h);
    scene.add(sg); items.push(sg);
  }
  return items;
}
