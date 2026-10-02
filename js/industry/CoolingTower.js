// ============================================================
// CoolingTower.js — 双曲面冷却塔（独立建模）
// 拉成曲面成形 + 混凝土水渍/返碱 + 顶部圈梁
// ============================================================
import * as THREE from 'three';
import { concreteTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';

export function makeCoolingTower({ h = 28, r = 8, seed = 2 }) {
  const group = new THREE.Group();
  const tex = concreteTexture(seed, 512, 2);
  const cm = mat({ map: tex, color: 0xd0d2cb, roughness: 0.94, metalness: 0, envIntensity: 0.28 });

  // 双曲线剖面点
  const pts = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * h;
    const waist = 0.52;
    const rr = r * (1 - waist * Math.sin(Math.PI * Math.pow(t, 0.82)));
    pts.push(new THREE.Vector2(rr * 0.92 + (t < 0.05 ? 0.06 : 0), y));
  }
  const geo = new THREE.LatheGeometry(pts, 20);
  const body = new THREE.Mesh(geo, cm);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 顶部圈梁
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.3, 20), cm);
  lip.position.y = h + 0.14;
  lip.castShadow = true;
  group.add(lip);

  // 下部进风口圈（暗色开口带）
  const inlet = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.62, r * 0.92, 0.4, 20, 1, true),
    mat({ color: 0x2b2d28, roughness: 1, metalness: 0, envIntensity: 0.08 })
  );
  inlet.position.y = 0.2;
  group.add(inlet);

  return { group, height: h };
}
