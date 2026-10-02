// ============================================================
// FactoryComplex.js — 远景重工业厂区总装
// 厂区地坪 + 道路 + 三排工业构筑物 + 横穿栈桥 + 堆场
// 独立组装每一个构件，全部独立建模、独立渲染
// ============================================================
import * as THREE from 'three';
import { CONFIG } from '../config/sceneConfig.js';
import { asphaltTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';
import { makeChimney } from './Chimney.js';
import { makeCoolingTower } from './CoolingTower.js';
import { makeDistillationTower } from './DistillationTower.js';
import { makeStorageTank } from './StorageTank.js';
import { makeGasholder } from './Gasholder.js';
import { makePipeRack } from './PipeRack.js';
import { makeSteelFrame } from './SteelFrame.js';
import { makeWarehouse } from './Warehouse.js';

const F = CONFIG.factory;
const TOP = CONFIG.levels.factoryTop;

export function createFactoryComplex(scene) {
  const group = new THREE.Group();

  // ---- 厂区地坪平台（混凝土沥青）----
  const asphalt = asphaltTexture(77, 512, 9);
  const groundMat = mat({ map: asphalt, color: 0xc4c6bf, roughness: 0.96, metalness: 0, envIntensity: 0.2 });
  const ground = new THREE.Mesh(new THREE.BoxGeometry(192, TOP, 28), groundMat);
  ground.position.set(0, TOP / 2, (F.trestleZ - 4 - 96) / 2);
  ground.receiveShadow = true;
  ground.castShadow = false;
  group.add(ground);

  // ---- 道路（横向主干道 + 纵向连接）----
  const roadMat = mat({ map: asphalt, color: 0x9fa19c, roughness: 0.98, metalness: 0, envIntensity: 0.15 });
  const road1 = new THREE.Mesh(new THREE.BoxGeometry(190, 0.06, 3.4), roadMat);
  road1.position.set(0, TOP + 0.02, -73.5);
  road1.receiveShadow = true;
  group.add(road1);
  for (const rx of [-86, -12, 68]) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 24), roadMat);
    road.position.set(rx, TOP + 0.02, -82);
    road.receiveShadow = true;
    group.add(road);
  }

  // ---- 烟囱 ----
  const chimneySpecs = [
    [-82, -90, 34, 2.6], [-56, -92, 38, 3.0], [-6, -90, 30, 2.4], [46, -92, 36, 3.0],
    [20, -84, 24, 2.5], [72, -86, 20, 2.3], [88, -88, 26, 2.5],
  ];
  const smokeEmitters = [];
  chimneySpecs.forEach(([x, z, h, r], i) => {
    const { group: g, anchor } = makeChimney({ h, r, seed: 100 + i * 13 });
    g.position.set(x, TOP, z);
    group.add(g);
    if (i === 0 || i === 1 || i === 3 || i === 4 || i === 6) {
      smokeEmitters.push({
        anchor, seed: 500 + i * 77, height: h * 0.8,
        drift: [0.5 + (i % 3) * 0.25, 0.15 + (i % 2) * 0.1],
        size: 2.8 + (i % 2), count: 54,
      });
    }
  });

  // ---- 冷却塔 ----
  const cts = [
    [-48, -85, 26, 7.5], [62, -87, 30, 8.2],
  ];
  cts.forEach(([x, z, h, r], i) => {
    const { group: g } = makeCoolingTower({ h, r, seed: 200 + i * 17 });
    g.position.set(x, TOP, z);
    group.add(g);
  });

  // ---- 精馏塔组 ----
  const distGroups = [
    [-20, -84, [[16, 0.9], [21, 1.15]]],
    [16, -85, [[14, 0.85], [18, 1.0], [23, 1.2]]],
    [70, -83, [[15, 0.9], [19, 1.1]]],
  ];
  distGroups.forEach(([x, z, towers], gi) => {
    const span = towers.length > 2 ? 4.4 : 3.2;
    towers.forEach(([h, r], ti) => {
      const { group: g } = makeDistillationTower({ h, r, seed: 300 + gi * 11 + ti * 5, platforms: h > 17 ? 3 : 2 });
      g.position.set(x + (ti - (towers.length - 1) / 2) * span, TOP, z);
      group.add(g);
    });
  });

  // ---- 储罐（两排）----
  const tankSpecs = [
    [-78, -76, 5.5, 6.5, true], [-56, -76, 4, 5, true], [-34, -77, 5, 4.5, false], [-12, -76, 4.5, 6, true],
    [14, -76, 6, 8, true], [38, -77, 5.5, 6.5, true], [62, -76, 4, 5, true], [82, -77, 5, 5.5, true],
    [-30, -82, 4, 4.5, true],
  ];
  tankSpecs.forEach(([x, z, r, h, dome], i) => {
    const { group: g } = makeStorageTank({ r, h, seed: 400 + i * 19, dome });
    g.position.set(x, TOP, z);
    group.add(g);
  });

  // ---- 储气柜 ----
  const gash = [[-70, -91, 6.5, 7], [30, -91, 8, 8.5]];
  gash.forEach(([x, z, r, h], i) => {
    const { group: g } = makeGasholder({ r, h, seed: 600 + i * 29 });
    g.position.set(x, TOP, z);
    group.add(g);
  });

  // ---- 输送管廊 ----
  const racks = [
    [-90, -8, -79, 7], [-60, 60, -84.5, 8], [-30, 90, -88, 6.5],
  ];
  racks.forEach(([x0, x1, z, h], i) => {
    const { group: g } = makePipeRack({ x0, x1, z, h, seed: 700 + i * 31 });
    group.add(g);
  });
  // 横穿管廊（沿 Z 方向，绕 Y 旋转 90°：局部 X → 世界 -Z）
  for (const [x, z0, z1, h, seed] of [[-45, -94, -72, 6, 731], [58, -94, -72, 7, 733]]) {
    const { group: g } = makePipeRack({ x0: -z1, x1: -z0, z: x, h, seed });
    g.rotation.y = Math.PI / 2;
    group.add(g);
  }

  // ---- 钢结构支架塔 ----
  const frames = [[-64, -74, 16], [4, -74, 13], [30, -75, 19], [62, -74, 15]];
  frames.forEach(([x, z, h], i) => {
    const { group: g } = makeSteelFrame({ h, b: 3.2, seed: 800 + i * 37 });
    g.position.set(x, TOP, z);
    group.add(g);
  });

  // ---- 厂房/仓库 ----
  const warehouses = [
    [-84, -74, 16, 7, 5.5], [-24, -74, 22, 8, 6], [48, -74, 20, 7, 5], [84, -74, 14, 6, 5],
  ];
  warehouses.forEach(([x, z, w, d, h], i) => {
    const { group: g } = makeWarehouse({ w, d, h, seed: 900 + i * 43 });
    g.position.set(x, TOP, z);
    group.add(g);
  });

  // ---- 小附属建筑（低矮棚）----
  for (const [x, z, w, d, h, s] of [[-12, -77, 6, 3.5, 3, 1001], [52, -78, 5, 3, 2.8, 1002]]) {
    const { group: g } = makeWarehouse({ w, d, h, seed: s });
    g.position.set(x, TOP, z);
    group.add(g);
  }

  // ---- 堆场（木箱/货堆）----
  const crateMat = mat({ color: 0x4c453a, roughness: 0.92, metalness: 0, envIntensity: 0.25 });
  const stacks = [[-88, -77, 0], [-86, -78, 1], [-90, -79, 2], [-84, -80, 3], [-88, -81, 4]];
  stacks.forEach(([x, z, k], i) => {
    const n = 2 + (i % 3);
    for (let c = 0; c < n; c++) {
      for (let r = 0; r < 2; r++) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), crateMat);
        crate.position.set(x + c * 1.2, TOP + 0.55 + r * 1.1, z + r * 1.2 * (i % 2 ? -1 : 1));
        crate.castShadow = true;
        group.add(crate);
      }
    }
  });

  // ---- 工业栈桥（横穿厂区前方，带桥墩）----
  const trestleZ = F.trestleZ;
  const deckMat = mat({ map: asphalt, color: 0xb8bbb6, roughness: 0.92, metalness: 0, envIntensity: 0.25 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(184, 0.8, 4.2), deckMat);
  deck.position.set(0, 7.8, trestleZ);
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  const pierGeo = new THREE.BoxGeometry(1.3, 7.3, 1.3);
  const pierMat = mat({ map: asphalt, color: 0x9b9e99, roughness: 0.95, metalness: 0, envIntensity: 0.2 });
  const piers = new THREE.InstancedMesh(pierGeo, pierMat, 11);
  const pm = new THREE.Matrix4();
  for (let i = 0; i < 11; i++) {
    const x = -90 + i * 18;
    pm.makeTranslation(x, TOP + 3.65, trestleZ);
    piers.setMatrixAt(i, pm);
  }
  piers.instanceMatrix.needsUpdate = true;
  piers.castShadow = true;
  piers.receiveShadow = true;
  group.add(piers);

  // 栈桥护栏
  const railMat = mat({ color: 0x6d706b, roughness: 0.85, metalness: 0.35, envIntensity: 0.3 });
  for (const sx of [-1.5, 1.5]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(184, 0.12, 0.22), railMat);
    rail.position.set(0, 8.9, trestleZ + sx);
    rail.castShadow = true;
    group.add(rail);
  }

  return { group, smokeEmitters };
}
