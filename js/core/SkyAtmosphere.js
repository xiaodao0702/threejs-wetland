// ============================================================
// SkyAtmosphere.js — 灰蒙阴天穹顶 + 指数雾
// 浅灰绿渐变天空（无云、低对比）+ FogExp2 空气透视
// ============================================================
import * as THREE from 'three';
import { CONFIG } from '../config/sceneConfig.js';

export function createSkyAndFog(scene) {
  const S = CONFIG.sky;
  const F = CONFIG.fog;

  // 渐变天空纹理（细垂直噪声破带纹）
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 512;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, S.zenith);
  g.addColorStop(0.55, '#939c98');
  g.addColorStop(0.72, S.horizon);
  g.addColorStop(1.0, S.groundBand);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 512);
  // 薄层云状噪声
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = i % 2 ? '#c2c9c5' : '#6e7673';
    const x = Math.random() * 64, y = Math.random() * 512, w = 4 + Math.random() * 16, h = 8 + Math.random() * 40;
    ctx.fillRect(x, y, w, h);
  }
  ctx.globalAlpha = 1;

  const skyTex = new THREE.CanvasTexture(cv);
  skyTex.colorSpace = THREE.SRGBColorSpace;

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(S.radius, 32, 18),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  scene.add(sky);

  const fog = new THREE.FogExp2(F.color, F.density);
  scene.fog = fog;

  return { sky, fog, fogColor: new THREE.Color(F.color), fogDensity: F.density };
}
