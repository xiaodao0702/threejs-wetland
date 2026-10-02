// ============================================================
// Warehouse.js — 低矮厂房/仓库（独立建模）
// 波纹板墙身 + 人字屋顶 + 屋脊通风 + 大门；锈与漆
// ============================================================
import * as THREE from 'three';
import { corrugatedTexture, paintedSteelTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';

export function makeWarehouse({ w = 20, d = 8, h = 6, seed = 8 }) {
  const group = new THREE.Group();
  const corrTex = corrugatedTexture(seed, 512, 256, [4, 1]);
  const paintTex = paintedSteelTexture(seed + 7, 512, 1);
  const cm = mat({ map: corrTex, color: 0xc6c9c6, roughness: 0.88, metalness: 0.35, envIntensity: 0.35 });
  const pm = mat({ map: paintTex, color: 0xc9ccca, roughness: 0.86, metalness: 0.3, envIntensity: 0.35 });

  // 墙身
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cm);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 人字屋顶（棱柱）
  const roofH = h * 0.28;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 - 0.4, 0);
  shape.lineTo(w / 2 + 0.4, 0);
  shape.lineTo(0, roofH);
  shape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: d + 0.8, bevelEnabled: false });
  const roof = new THREE.Mesh(roofGeo, pm);
  roof.rotation.x = -Math.PI / 2;
  roof.rotation.z = Math.PI / 2;
  roof.position.y = h;
  roof.castShadow = true;
  group.add(roof);

  // 屋脊通风器（2 个小盒）
  for (const s of [-1, 1]) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(w * 0.18, 0.35, 0.5), pm);
    vent.position.set(s * w * 0.3, h + roofH + 0.16, 0);
    vent.castShadow = true;
    group.add(vent);
  }

  // 大门（深色矩形，正面）
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.28, h * 0.62),
    mat({ color: 0x3c3f3a, roughness: 0.92, metalness: 0.2, envIntensity: 0.2 })
  );
  door.position.set(0, h * 0.31, d / 2 + 0.01);
  group.add(door);

  // 基础勒脚
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.4, d + 0.4), pm);
  plinth.position.y = 0.2;
  plinth.castShadow = true;
  group.add(plinth);

  return { group, width: w, depth: d, height: h + roofH };
}
