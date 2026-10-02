// ============================================================
// main.js — 主装配入口（模块化组装湿地场景）
// index.html 仅入口框架；场景全部由独立模块组装
// ============================================================
import * as THREE from 'three';
import { CONFIG } from './config/sceneConfig.js';
import { createRenderer } from './core/RendererSetup.js';
import { createCameraRig } from './core/CameraRig.js';
import { createLighting } from './core/Lighting.js';
import { createSkyAndFog } from './core/SkyAtmosphere.js';
import { createBasePedestal } from './core/BasePedestal.js';
import { createEnvironmentMap } from './utils/EnvMap.js';
import { createMudBase } from './terrain/MudBase.js';
import { createIsland, sampleIslandHeight } from './terrain/Island.js';
import { createMainWater } from './terrain/WaterBody.js';
import { createReedPatch } from './vegetation/ReedPatch.js';
import { createGrassPatch } from './vegetation/GrassTuft.js';
import { createBushes } from './vegetation/Bush.js';
import { createWaterPlants } from './vegetation/WaterPlants.js';
import { createFactoryComplex } from './industry/FactoryComplex.js';
import { createSmokeSystems } from './industry/SmokeSystem.js';
import { createBridgeRailing } from './bridge/BridgeRailing.js';
import { createMistSystem } from './effects/MistSystem.js';
import { createGlassOverlay } from './effects/GlassOverlay.js';
import { windUniforms } from './effects/WindSway.js';
import { mat } from './utils/Helpers.js';
import { mudTexture } from './utils/TextureFactory.js';

function boot() {
  // ---- 渲染器 ----
  const container = document.getElementById('scene-container');
  const renderer = createRenderer(container);
  const scene = new THREE.Scene();

  // ---- 相机与操控 ----
  const { camera, controls } = createCameraRig(renderer);

  // ---- 环境反射（灰调 PMREM）----
  scene.environment = createEnvironmentMap(renderer);

  // ---- 光照与大气 ----
  createLighting(scene);
  const { fogColor, fogDensity } = createSkyAndFog(scene);

  // ---- 底座与地形 ----
  createBasePedestal(scene);
  createMudBase(scene);

  // ---- 湿地岛屿（含草垛状浅水苇岛）----
  // [x, z, radius, peak]
  const islandSpecs = [
    [-66, 30, 9, 0.9], [-38, 46, 7, 0.75], [-14, 58, 6, 0.7], [16, 30, 10, 1.0],
    [48, 48, 7, 0.8], [74, 26, 6, 0.65], [-52, 8, 8, 0.85], [-6, 12, 9, 0.95],
    [36, 10, 8, 0.85], [66, -8, 7, 0.75], [-24, -22, 8, 0.8], [18, -30, 7, 0.7],
    [56, -38, 6, 0.6], [-62, -42, 5, 0.55], [0, -52, 6, 0.6], [40, -58, 5, 0.55],
    // 草垛状芦苇岛（浅水小泥丘）
    [-44, 62, 2.6, 0.22], [4, 40, 2.2, 0.20], [30, 60, 2.8, 0.24], [-12, 34, 1.9, 0.18],
    [58, 12, 2.4, 0.22], [-30, -6, 1.9, 0.20], [20, -14, 2.8, 0.24], [-8, -40, 2.4, 0.22],
    // 新增散点苇岛（填充水面空隙）
    [-72, 52, 2.2, 0.20], [70, 46, 2.4, 0.22], [-78, -18, 2.0, 0.18], [78, -24, 2.2, 0.20],
    [8, 2, 1.8, 0.16], [-48, -26, 2.2, 0.20], [46, -24, 2.0, 0.18], [-20, 68, 2.0, 0.18],
  ];
  const islands = islandSpecs.map(([x, z, r, p], i) => createIsland(x, z, r * 1.25, p, 200 + i * 17, scene));

  // ---- 水面系统 ----
  const water = createMainWater(scene);

  // ---- 泥堤（近岸带 + 厂区隔离带）----
  const mudT = mudTexture(47, 512, 4);
  const bankMat = mat({ map: mudT, color: 0xbcbca9, roughness: 0.98, metalness: 0, envIntensity: 0.2 });
  const nearBank = new THREE.Mesh(new THREE.BoxGeometry(192, 0.5, 4), bankMat);
  nearBank.position.set(0, 0.25, 84);
  nearBank.receiveShadow = true;
  scene.add(nearBank);

  const isoBank = new THREE.Mesh(new THREE.BoxGeometry(192, 0.35, 6), bankMat);
  isoBank.position.set(0, 0.175, -65);
  isoBank.receiveShadow = true;
  scene.add(isoBank);

  // ---- 芦苇丛 ----
  // 岛屿苇丛（岛心密丛）
  for (const isl of islands) {
    const count = Math.max(180, Math.min(1100, Math.floor(isl.radius * isl.radius * 9.0)));
    const fn = (x, z) => sampleIslandHeight(isl.radius, isl.peak, 200 + islands.indexOf(isl) * 17, x - isl.x, z - isl.z);
    createReedPatch(scene, {
      x: isl.x, z: isl.z, radius: isl.radius * 0.8, count,
      seed: 600 + islands.indexOf(isl) * 29, heightScale: 1.05 + (isl.peak > 0.6 ? 0.3 : 0.0),
      heightFn: fn, deadMix: isl.peak > 0.2 ? 0.14 : 0.3,
    });
  }
  // 近岸泥堤苇带
  createReedPatch(scene, { x: -45, z: 84, radius: 15, count: 950, seed: 9001, heightScale: 1.15, baseY: 0.5, deadMix: 0.16 });
  createReedPatch(scene, { x: 12, z: 84, radius: 15, count: 920, seed: 9002, heightScale: 1.2, baseY: 0.5, deadMix: 0.16 });
  createReedPatch(scene, { x: 64, z: 84, radius: 12, count: 780, seed: 9003, heightScale: 1.05, baseY: 0.5, deadMix: 0.2 });
  // 厂区隔离泥堤苇带
  createReedPatch(scene, { x: -62, z: -65, radius: 15, count: 830, seed: 9004, heightScale: 1.1, baseY: 0.35, deadMix: 0.2 });
  createReedPatch(scene, { x: -8, z: -65, radius: 17, count: 980, seed: 9005, heightScale: 1.15, baseY: 0.35, deadMix: 0.2 });
  createReedPatch(scene, { x: 52, z: -65, radius: 15, count: 830, seed: 9006, heightScale: 1.05, baseY: 0.35, deadMix: 0.22 });
  createReedPatch(scene, { x: -86, z: -65, radius: 9, count: 480, seed: 9007, heightScale: 1.0, baseY: 0.35, deadMix: 0.24 });
  createReedPatch(scene, { x: 84, z: -65, radius: 9, count: 480, seed: 9008, heightScale: 1.0, baseY: 0.35, deadMix: 0.24 });

  // ---- 湿生野草 ----
  for (const isl of islands) {
    const count = Math.max(40, Math.min(220, Math.floor(isl.radius * isl.radius * 1.7)));
    const fn = (x, z) => sampleIslandHeight(isl.radius, isl.peak, 200 + islands.indexOf(isl) * 17, x - isl.x, z - isl.z);
    createGrassPatch(scene, {
      x: isl.x, z: isl.z, radius: isl.radius * 0.55, count,
      seed: 700 + islands.indexOf(isl) * 31, heightFn: fn,
    });
  }
  createGrassPatch(scene, { x: -50, z: 83, radius: 30, count: 460, seed: 7001, baseY: 0.5 });
  createGrassPatch(scene, { x: 28, z: 83, radius: 30, count: 450, seed: 7002, baseY: 0.5 });
  createGrassPatch(scene, { x: -40, z: -64, radius: 30, count: 380, seed: 7003, baseY: 0.35 });
  createGrassPatch(scene, { x: 30, z: -64, radius: 30, count: 380, seed: 7004, baseY: 0.35 });

  // ---- 低矮灌木（岛缘缓坡 + 岸沿）----
  const bushSpots = [
    [-60, 34, 1.1, 31], [-38, 50, 0.9, 32], [14, 36, 1.0, 33], [48, 52, 0.9, 34],
    [76, 30, 0.8, 35], [-6, 16, 1.1, 36], [36, 14, 1.0, 37], [66, -4, 0.8, 38],
    [20, -26, 0.9, 39], [-24, -18, 0.9, 40], [0, -48, 0.8, 41], [-66, 24, 0.7, 42],
    [58, -34, 0.7, 43], [-50, 4, 0.8, 44], [86, 40, 0.7, 45], [-40, 78, 0.8, 46],
    [40, 78, 0.7, 47],
  ];
  const bushes = [];
  for (const [x, z, s, seed] of bushSpots) {
    const b = createBushes(scene, [[x, z, s, seed]])[0];
    // 就近取所属岛屿表面高度；否则落在泥堤/岸沿
    let bestY = 0.5;
    let bestD = 1e9, bestIsl = null;
    for (const isl of islands) {
      const d = Math.hypot(x - isl.x, z - isl.z);
      if (d < isl.radius * 1.05 && d < bestD) { bestD = d; bestIsl = isl; }
    }
    if (bestIsl) {
      bestY = sampleIslandHeight(bestIsl.radius, bestIsl.peak, 200 + islands.indexOf(bestIsl) * 17, x - bestIsl.x, z - bestIsl.z);
    }
    b.position.y = bestY;
    bushes.push(b);
  }

  // ---- 水面零散植物 ----
  createWaterPlants(scene);

  // ---- 远景重工业厂区 + 烟气 ----
  const { group: factoryGroup, smokeEmitters } = createFactoryComplex(scene);
  scene.add(factoryGroup);
  const smoke = createSmokeSystems(scene, smokeEmitters);

  // ---- 近景高架桥梁护栏 ----
  createBridgeRailing(scene);

  // ---- 薄雾与水汽 ----
  const mist = createMistSystem(scene);

  // ---- 车窗玻璃观感 ----
  createGlassOverlay(camera);
  scene.add(camera);   // 相机加入场景图，其子物体（玻璃层）才参与渲染

  // ---- 动画循环 ----
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    windUniforms.uTime.value = t;
    water.update(t);
    smoke.update(t);
    mist.update(t);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // 调试/工具句柄（供离屏渲染与排查使用；浏览器中亦可用）
  try { globalThis.__SCENE__ = { scene, camera, renderer, controls }; } catch (e) { /* noop */ }

  // WebGL 上下文丢失保护
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('WebGL context lost');
  });
}

// ---- 启动（含降级提示）----
(function start() {
  try {
    if (!window.WebGLRenderingContext) throw new Error('WebGL 不可用');
    boot();
  } catch (err) {
    console.error(err);
    const c = document.getElementById('scene-container');
    if (c) {
      c.innerHTML = '<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#e88;font-size:14px;font-family:monospace;background:#101312;padding:40px;white-space:pre-wrap;">加载失败：' + (err && err.message ? err.message : String(err)) + '</div>';
    }
  }
})();
