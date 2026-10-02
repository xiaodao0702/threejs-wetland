// ============================================================
// SteelFrame.js — 钢结构支架塔（独立建模）
// 四柱格构 + 层间横撑/斜撑 + 顶部平台；锈蚀钢
// ============================================================
import * as THREE from 'three';
import { rustTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';

export function makeSteelFrame({ h = 18, b = 3.2, seed = 7 }) {
  const group = new THREE.Group();
  const tex = rustTexture(seed, 512, 1);
  const rm = mat({ map: tex, color: 0xbcbcb8, roughness: 0.9, metalness: 0.42, envIntensity: 0.35 });

  const half = b / 2;
  const topHalf = b * 0.32;

  // 四根主立柱（微收分）
  const legs = [
    [-half, -half], [half, -half], [half, half], [-half, half],
  ];
  for (const [lx, lz] of legs) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, 0.3), rm);
    leg.position.set(lx, h / 2, lz);
    leg.castShadow = true;
    group.add(leg);
  }

  // 层间横撑 + 对角斜撑（每 1/4 高度）
  const levels = 4;
  for (let L = 1; L <= levels; L++) {
    const fy = (L / levels) * h;
    const k = 1 - (L / levels) * (1 - topHalf / half);   // 收分系数
    const r2 = half * k;
    for (const s of [-1, 1]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(b * k, 0.14, 0.14), rm);
      beam.position.set(0, fy, s * r2);
      beam.castShadow = true;
      group.add(beam);
      const beam2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, b * k), rm);
      beam2.position.set(s * r2, fy, 0);
      beam2.castShadow = true;
      group.add(beam2);
    }
    // 斜撑（两条对角）
    if (L > 0) {
      const prevY = ((L - 1) / levels) * h;
      const kp = 1 - ((L - 1) / levels) * (1 - topHalf / half);
      const lenDiag = Math.hypot(h / levels, (b * k - b * kp) * 0.5);
      const diag = new THREE.Mesh(new THREE.BoxGeometry(0.12, lenDiag, 0.12), rm);
      diag.position.set((b * k * 0.5 + b * kp * 0.5) * 0.5 - b * k * 0.25, (fy + prevY) / 2, 0);
      diag.rotation.z = Math.atan2(h / levels, b * (k - kp) * 0.5) * 0.5;
      diag.castShadow = true;
      group.add(diag);
    }
  }

  // 顶部平台
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(b * 0.9, b * 0.9, 0.16, 10), rm);
  platform.position.y = h + 0.06;
  platform.castShadow = true;
  group.add(platform);

  return { group, height: h };
}
