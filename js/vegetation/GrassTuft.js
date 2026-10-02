// ============================================================
// GrassTuft.js — 湿生野草丛（低矮草簇，实例化散布泥滩/岛顶）
// ============================================================
import * as THREE from 'three';
import { mulberry32 } from '../utils/Noise.js';
import { buildBladeGeometry, mergeGeometries } from '../utils/Helpers.js';
import { injectWind } from '../effects/WindSway.js';
import { PALETTE } from '../config/sceneConfig.js';

export function makeGrassGeometry(seed, scale = 1) {
  const rng = mulberry32(seed);
  const parts = [];
  const blades = 5 + Math.floor(rng() * 5);
  for (let b = 0; b < blades; b++) {
    const h = (0.14 + rng() * 0.24) * scale;
    const w = 0.007 + rng() * 0.006;
    const dirA = rng() * Math.PI * 2;
    const lean = 0.2 + rng() * 0.35;
    const dx = Math.cos(dirA), dz = Math.sin(dirA);
    const pts = [];
    const segs = 4;
    for (let s = 0; s <= segs; s++) {
      const t = s / segs;
      const sag = -h * 0.28 * t * t;
      const lat = Math.sin(t * Math.PI) * 0.03 * (rng() - 0.5);
      pts.push({
        x: dx * h * lean * t + lat,
        y: t * h + sag,
        z: dz * h * lean * t,
      });
    }
    parts.push(buildBladeGeometry(pts, w, 0.0015, 4));
  }
  return mergeGeometries(parts);
}

export function createGrassPatch(scene, opts) {
  const {
    x = 0, z = 0, radius = 10, count = 800, seed = 1,
    heightFn = null, baseY = 0, scale = 1, deadMix = 0.25,
  } = opts;
  const rng = mulberry32(seed);
  const geo = makeGrassGeometry(seed, scale);
  const mesh = new THREE.InstancedMesh(geo, grassMaterial, count);
  const m = new THREE.Matrix4();
  const GREENS = PALETTE.grassGreen.map(c => new THREE.Color(c));
  const YELLOWS = PALETTE.reedYellow.map(c => new THREE.Color(c));
  for (let i = 0; i < count; i++) {
    const r = radius * Math.pow(rng(), 0.8);
    const a = rng() * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const pz = z + Math.sin(a) * r;
    const py = heightFn ? heightFn(px, pz) : baseY;
    const s = 0.7 + rng() * 0.7;
    m.makeRotationFromEuler(new THREE.Euler((rng() - 0.5) * 0.08, rng() * Math.PI * 2, (rng() - 0.5) * 0.08, 'YXZ'));
    m.scale(new THREE.Vector3(s, s, s));
    m.setPosition(px, py, pz);
    mesh.setMatrixAt(i, m);
    const dead = rng() < deadMix;
    const c = dead ? YELLOWS[Math.floor(rng() * YELLOWS.length)] : GREENS[Math.floor(rng() * GREENS.length)];
    const j = 0.8 + rng() * 0.4;
    mesh.setColorAt(i, new THREE.Color(c.r * j, c.g * j, c.b * j));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  scene.add(mesh);
  return mesh;
}

const grassMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.88,
  metalness: 0,
  side: THREE.DoubleSide,
  envMapIntensity: 0.28,
});
injectWind(grassMaterial, 'grass');
