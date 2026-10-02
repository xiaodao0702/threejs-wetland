// ============================================================
// Lighting.js — 电影级阴天漫射光
// 半球天光 + 极软方向主光（柔和阴影）+ 微弱环境补光
// ============================================================
import * as THREE from 'three';
import { CONFIG } from '../config/sceneConfig.js';

export function createLighting(scene) {
  const L = CONFIG.lights;

  const hemi = new THREE.HemisphereLight(L.hemi.sky, L.hemi.ground, L.hemi.intensity);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(L.dir.color, L.dir.intensity);
  dir.position.set(L.dir.pos[0], L.dir.pos[1], L.dir.pos[2]);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -140;
  dir.shadow.camera.right = 140;
  dir.shadow.camera.top = 140;
  dir.shadow.camera.bottom = -140;
  dir.shadow.camera.near = 10;
  dir.shadow.camera.far = 500;
  dir.shadow.bias = -0.0004;
  dir.shadow.normalBias = 0.04;
  scene.add(dir);

  const fill = new THREE.DirectionalLight(L.fill.color, L.fill.intensity);
  fill.position.set(L.fill.pos[0], L.fill.pos[1], L.fill.pos[2]);
  scene.add(fill);

  return { hemi, dir, fill };
}
