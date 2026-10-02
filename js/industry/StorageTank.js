// ============================================================
// StorageTank.js — 立式储罐（独立建模）
// 罐体 + 拱顶（或平顶浮盘）+ 裙座 + 环缝；工业漆/锈
// ============================================================
import * as THREE from 'three';
import { paintedSteelTexture, rustTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';

export function makeStorageTank({ r = 4, h = 5, seed = 4, dome = true }) {
  const group = new THREE.Group();
  const paintTex = paintedSteelTexture(seed, 512, 1);
  const rustTex = rustTexture(seed + 9, 512, 1);
  const pm = mat({ map: paintTex, color: 0xc6caca, roughness: 0.84, metalness: 0.3, envIntensity: 0.4 });
  const rm = mat({ map: rustTex, color: 0xb8b8b4, roughness: 0.88, metalness: 0.45, envIntensity: 0.35 });

  // 罐体
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16, 2), pm);
  body.position.y = h / 2;
  group.add(body);

  // 拱顶 / 平顶
  if (dome) {
    const roof = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), pm);
    roof.position.y = h;
    group.add(roof);
    // 顶部小通风
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.06, r * 0.06, 0.4, 8), rm);
    vent.position.y = h + r * 0.35;
    group.add(vent);
  } else {
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r, 0.14, 16), pm);
    roof.position.y = h + 0.06;
    group.add(roof);
  }

  // 环缝带（底部与中部）
  for (const fy of [0.3, 0.55 * h]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.08, 16), rm);
    ring.position.y = fy;
    group.add(ring);
  }

  // 裙座
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.12, 0.5, 16), rm);
  skirt.position.y = 0.25;
  group.add(skirt);

  for (const m of group.children) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  return { group, height: h, radius: r };
}
