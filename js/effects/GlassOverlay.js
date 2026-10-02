// ============================================================
// GlassOverlay.js — 隔车窗玻璃观感
// 相机前贴近平面的极淡玻璃层：微弱反射、高光、朦胧雾感
// ============================================================
import * as THREE from 'three';
import { glassGradientTexture } from '../utils/TextureFactory.js';

export function createGlassOverlay(camera) {
  const geo = new THREE.PlaneGeometry(9.4, 5.6);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xe4ece6,
    map: glassGradientTexture(),
    transparent: true,
    opacity: 0.08,               // 极淡：贴图 alpha(≤0.55) 相乘后峰值仅 ~0.044
    roughness: 0.08,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.35,
    envMapIntensity: 1.4,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0, -2.0);     // 贴相机近平面
  mesh.renderOrder = 20;
  camera.add(mesh);

  return mesh;
}
