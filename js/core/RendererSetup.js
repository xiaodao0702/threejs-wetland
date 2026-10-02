// ============================================================
// RendererSetup.js — 渲染器（ACES 电影色调、柔和阴影、抗锯齿）
// ============================================================
import * as THREE from 'three';
import { CONFIG } from '../config/sceneConfig.js';

export function createRenderer(container) {
  // 支持离屏渲染等环境注入 canvas（浏览器中为 undefined，正常自建）
  const injected = (typeof globalThis !== 'undefined' && globalThis.__RENDER_CANVAS__) || undefined;
  const renderer = new THREE.WebGLRenderer({
    canvas: injected,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = CONFIG.tone.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return renderer;
}
