// ============================================================
// BasePedestal.js — 规整正方形纯色底座（微缩模型基座）
// 200×200×7，顶面为世界地面 Y=0，材质暗灰绿纯色
// ============================================================
import * as THREE from 'three';
import { CONFIG } from '../config/sceneConfig.js';

export function createBasePedestal(scene) {
  const B = CONFIG.base;
  const geo = new THREE.BoxGeometry(B.size, B.thickness, B.size);
  const mat = new THREE.MeshStandardMaterial({
    color: B.color,
    roughness: 0.94,
    metalness: 0.0,
    envMapIntensity: 0.25,
  });
  const base = new THREE.Mesh(geo, mat);
  base.position.y = B.topY - B.thickness / 2;
  base.receiveShadow = true;
  base.castShadow = false;
  scene.add(base);

  // 顶面边缘微棱线（纯色基座的轻微明度界定，不构成花纹）
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0x24272a, roughness: 0.95, metalness: 0, envMapIntensity: 0.2,
  });
  const edge = new THREE.Mesh(new THREE.BoxGeometry(B.size, 0.08, B.size), edgeMat);
  edge.position.y = B.topY + 0.01;
  edge.receiveShadow = true;
  scene.add(edge);

  return base;
}
