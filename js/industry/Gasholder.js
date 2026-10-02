// ============================================================
// Gasholder.js — 储气柜（独立建模）
// 圆筒基座 + 球形柜顶 + 外部导向钢架；锈蚀钢
// ============================================================
import * as THREE from 'three';
import { rustTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';

export function makeGasholder({ r = 7, h = 8, seed = 5 }) {
  const group = new THREE.Group();
  const tex = rustTexture(seed, 512, 1);
  const rm = mat({ map: tex, color: 0xbfbfbb, roughness: 0.9, metalness: 0.4, envIntensity: 0.35 });

  // 筒体
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h * 0.62, 18, 2), rm);
  body.position.y = h * 0.31;
  group.add(body);

  // 球顶
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), rm);
  dome.position.y = h * 0.62;
  group.add(dome);

  // 外部导向钢架（8 根立柱 + 环梁）
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, h * 1.12, 5), rm);
    col.position.set(Math.cos(a) * r * 1.08, h * 0.56, Math.sin(a) * r * 1.08);
    group.add(col);
    const beam = new THREE.Mesh(new THREE.TorusGeometry(r * 1.08, 0.07, 4, 18), rm);
    beam.rotation.x = Math.PI / 2;
    beam.position.y = h * (0.35 + (i % 2) * 0.2);
    group.add(beam);
  }

  // 顶部栏杆
  const rail = new THREE.Mesh(new THREE.TorusGeometry(r * 0.4, 0.05, 4, 12), rm);
  rail.rotation.x = Math.PI / 2;
  rail.position.y = h * 1.0;
  group.add(rail);

  for (const m of group.children) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  return { group, height: h };
}
