// ============================================================
// DistillationTower.js — 精馏塔（独立建模）
// 塔体 + 平台 + 侧管 + 顶部冷凝器；褪色工业漆/锈
// ============================================================
import * as THREE from 'three';
import { paintedSteelTexture, rustTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';

export function makeDistillationTower({ h = 18, r = 1.0, seed = 3, platforms = 2 }) {
  const group = new THREE.Group();
  const paintTex = paintedSteelTexture(seed, 512, 1);
  const rustTex = rustTexture(seed + 13, 512, 1);
  const pm = mat({ map: paintTex, color: 0xc9cdcd, roughness: 0.82, metalness: 0.35, envIntensity: 0.4 });
  const rm = mat({ map: rustTex, color: 0xbfbfbd, roughness: 0.85, metalness: 0.5, envIntensity: 0.35 });

  // 塔体
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 12, 4), pm);
  body.position.y = h / 2;
  group.add(body);

  // 操作平台（多层设备平台）
  for (let i = 1; i <= platforms; i++) {
    const fy = (i / (platforms + 1)) * h;
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.85, r * 1.85, 0.12, 12), rm);
    plat.position.y = fy;
    group.add(plat);
    // 平台栏杆（小立柱环）
    const rail = new THREE.Mesh(new THREE.TorusGeometry(r * 1.85, 0.035, 4, 14), rm);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = fy + 0.5;
    group.add(rail);
  }

  // 侧管
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.16, h * 0.92, 6, 2), rm);
  pipe.position.set(r * 1.35, h * 0.48, 0);
  group.add(pipe);
  const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.10, r * 0.10, h * 0.7, 6, 2), rm);
  pipe2.position.set(-r * 1.1, h * 0.36, r * 0.6);
  group.add(pipe2);

  // 顶部冷凝器球
  const cond = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 10, 8), pm);
  cond.position.y = h + r * 0.35;
  group.add(cond);

  // 裙座
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.7, 1.1, 12), rm);
  skirt.position.y = 0.55;
  group.add(skirt);

  for (const m of group.children) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  return { group, height: h };
}
