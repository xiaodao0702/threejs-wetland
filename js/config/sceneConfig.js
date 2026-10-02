// ============================================================
// sceneConfig.js — 全局场景配置（唯一布局/调色权威来源）
// 与 LAYOUT.md 一一对应；修改布局先改这里。
// ============================================================
import * as THREE from 'three';

export const CONFIG = {
  // ---- 正方形纯色底座 ----
  base: { size: 200, thickness: 7, topY: 0, color: 0x1d2022, sideColor: 0x191b1d },

  // ---- 湿地范围（中景）----
  wetland: { xHalf: 96, zFar: -68, zNear: 86 },

  // ---- 标高 ----
  levels: {
    mudFloor: 0.0,        // 泥滩基底
    water: 0.16,          // 主水面
    puddle: 0.2,          // 浅水洼地
    mudSkirt: 0.05,       // 岛屿水下泥裙
    bankLine: 0.5,        // 近岸泥堤（桥下芦苇带）
    isoline: 0.35,        // 厂区隔离泥堤
    factoryTop: 0.5,      // 厂区地坪
  },

  // ---- 高架桥梁（近景观察结构）----
  bridge: {
    zNear: 100, zFar: 86,          // 桥面纵深
    deckTop: 5.4, deckThick: 1.1,  // 桥面顶标高与板厚
    parapetH: 1.15, parapetW: 0.55,// 护栏高度/宽度
    edgeBeam: 0.45,                // 远端矮缘石
  },

  // ---- 相机与操控 ----
  camera: {
    fov: 50, near: 0.5, far: 1600,
    pos: [0, 7.3, 89.2], target: [0, 2.2, -55],
    minDistance: 6, maxDistance: 150,
    minPolar: 0.12, maxPolar: 1.55,   // 允许近桥面低机位（约 88.8°），同时避免钻入地表
    damping: 0.09,
  },

  // ---- 大气 ----
  fog: { color: 0x9aa39f, density: 0.004 },
  sky: { radius: 700, horizon: '#a6afab', zenith: '#7d8581', groundBand: '#8f9894' },

  // ---- 光照（阴天漫射）----
  lights: {
    hemi: { sky: 0xb6bfbb, ground: 0x3a3f3a, intensity: 1.18 },
    dir:  { color: 0xd8deda, intensity: 0.92, pos: [80, 150, 60] },
    fill: { color: 0xb6c2bb, intensity: 0.38, pos: [0, 40, -260] }, // 相机侧冷补光，照亮护栏/近岸
  },

  // ---- 色调 ----
  tone: { exposure: 0.88 },

  // ---- 水面 ----
  water: {
    deep: new THREE.Color('#4a5b53'),
    shallow: new THREE.Color('#7d9186'),
    sky: new THREE.Color('#a9b2ae'),
    opacity: 0.66,
    lightDir: new THREE.Vector3(0.45, 0.75, 0.35).normalize(),
  },

  // ---- 厂区 ----
  factory: {
    zRows: [-78, -84, -90],           // 三排纵深
    trestleZ: -72,                     // 横穿栈桥
  },

  // ---- 动态 ----
  anim: { wind: 0.14 },
};

// 低饱和植物调色板（灰绿/橄榄/枯黄）
export const PALETTE = {
  reedGreen:   [0x5a6a52, 0x6d7d5f, 0x4e5d47],   // 活苇
  reedYellow:  [0x8a8458, 0x9a8f62, 0x7a7450],   // 枯黄苇
  grassGreen:  [0x5d6b52, 0x68775a, 0x55634c],
  bushGreen:   [0x3f4d3e, 0x4c5a48, 0x374536],
  waterPlant:  [0x44523f, 0x3e4c3a],
  mudDark:     0x4a4c42,
  wood:        [0x4a4034, 0x5a4f40],
};

export function hex(c) { return '#' + c.toString(16).padStart(6, '0'); }
