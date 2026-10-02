// ============================================================
// Chimney.js — 混凝土烟囱（独立建模）
// 锥形筒身 + 圈梁 + 顶部收口；混凝土返碱/裂纹/水渍
// 附带烟气锚点（供 SmokeSystem 挂载）
// ============================================================
import * as THREE from 'three';
import { concreteTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';

export function makeChimney({ h = 26, r = 2.6, seed = 1 }) {
  const group = new THREE.Group();
  const tex = concreteTexture(seed, 512, 2);
  const cm = mat({ map: tex, color: 0xd6d8d1, roughness: 0.93, metalness: 0, envIntensity: 0.3, bumpScale: 0.02 });

  // 筒身（微锥）
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r, h, 14, 2), cm);
  body.position.y = h / 2;
  group.add(body);

  // 顶部收口圈梁
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.80, r * 0.80, 0.22, 14), cm);
  lip.position.y = h + 0.1;
  group.add(lip);

  // 圈梁（2 道）
  for (const fy of [0.34, 0.68]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.0, r * 1.0, 0.16, 14), cm);
    ring.position.y = h * fy;
    group.add(ring);
  }

  // 顶口内部（暗，防俯视穿帮）
  const inner = new THREE.Mesh(
    new THREE.CircleGeometry(r * 0.70, 14),
    mat({ color: 0x23241f, roughness: 1, metalness: 0, envIntensity: 0.05 })
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = h + 0.26;
  group.add(inner);

  // 爬梯（细扁条，提升结构真实感）
  const ladder = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, h * 0.92, 0.35),
    mat({ color: 0x55584f, roughness: 0.85, metalness: 0.4, envIntensity: 0.3 })
  );
  ladder.position.set(r * 0.9, h * 0.46, 0);
  group.add(ladder);

  // 底部裙座
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.16, 0.9, 14), cm);
  skirt.position.y = 0.45;
  group.add(skirt);

  for (const m of group.children) {
    m.castShadow = true;
    m.receiveShadow = true;
  }

  const anchor = new THREE.Object3D();
  anchor.position.set(0, h + 0.6, 0);
  group.add(anchor);

  return { group, anchor, height: h };
}
