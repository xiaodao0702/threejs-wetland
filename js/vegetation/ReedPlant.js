// ============================================================
// ReedPlant.js — 芦苇单株建模
// 细密秆（弯曲圆柱）+ 泥浸黑鞘 + 弯曲草叶 + 穗状花序
// 每株独立由种子生成，几何细节完整（供实例化复用）
// ============================================================
import * as THREE from 'three';
import { mulberry32 } from '../utils/Noise.js';
import { bendCylinder, buildBladeGeometry, mergeGeometries } from '../utils/Helpers.js';

export function makeReedGeometry(seed, heightScale = 1) {
  const rng = mulberry32(seed);
  const parts = [];

  // ---- 芦苇秆（4~7 根，细密、微弯）----
  const stalks = 4 + Math.floor(rng() * 4);
  for (let i = 0; i < stalks; i++) {
    const h = heightScale * (0.95 + rng() * 0.6);
    const r = 0.011 + rng() * 0.009;
    const bend = (rng() - 0.5) * 0.55;
    const st = bendCylinder(r * 0.55, r, h, 4, 4, bend);
    st.translate(0, h / 2, 0);
    parts.push(st);

    // 底部泥浸黑鞘（黑化泥浸痕迹）
    const sheath = new THREE.CylinderGeometry(r * 1.9, r * 1.1, 0.09 + rng() * 0.06, 4, 1);
    sheath.translate(0, 0.055, 0);
    parts.push(sheath);

    // 弯曲草叶（2~3 片/秆）
    const leaves = 2 + Math.floor(rng() * 2);
    for (let l = 0; l < leaves; l++) {
      const len = h * (0.16 + rng() * 0.32);
      const atH = h * (0.14 + rng() * 0.7);
      const dirA = rng() * Math.PI * 2;
      const dx = Math.cos(dirA), dz = Math.sin(dirA);
      const pts = [];
      const segs = 5;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const sag = -len * 0.32 * t * t;
        const lat = Math.sin(t * Math.PI) * 0.05 * (rng() - 0.5);
        pts.push({ x: dx * len * t + lat, y: atH + sag + t * t * 0.06, z: dz * len * t });
      }
      parts.push(buildBladeGeometry(pts, 0.026 + rng() * 0.015, 0.002, 5));
    }
  }

  // ---- 穗状花序（细丝 + 籽粒簇）----
  const topH = heightScale * 1.5;
  const filaments = 4 + Math.floor(rng() * 2);
  for (let f = 0; f < filaments; f++) {
    const a = (f / filaments) * Math.PI * 2 + rng() * 0.5;
    const len = 0.13 + rng() * 0.12;
    const fl = bendCylinder(0.0016, 0.0024, len, 3, 2, 0.1 + rng() * 0.12);
    fl.translate(Math.cos(a) * 0.03, topH + len * 0.35, Math.sin(a) * 0.03);
    parts.push(fl);
    const pods = 3 + Math.floor(rng() * 4);
    for (let p = 0; p < pods; p++) {
      const s = new THREE.SphereGeometry(0.005 + rng() * 0.007, 4, 3);
      s.scale(1, 1.8, 1);
      s.translate(
        Math.cos(a) * 0.05 + (rng() - 0.5) * 0.05,
        topH + len * 0.55 + (rng() - 0.5) * 0.05,
        Math.sin(a) * 0.05 + (rng() - 0.5) * 0.05
      );
      parts.push(s);
    }
  }

  const geo = mergeGeometries(parts);
  geo.userData.seed = seed;
  return geo;
}
