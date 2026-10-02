// ============================================================
// Helpers.js — 通用工具：随机、调色、几何合并、材质辅助
// ============================================================
import * as THREE from 'three';
import { mulberry32 } from './Noise.js';

export function makeRng(seed) { return mulberry32(seed); }

export function rand(rng, min, max) { return min + (max - min) * rng(); }
export function randInt(rng, min, max) { return Math.floor(rand(rng, min, max + 1)); }
export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
export function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }

// 在圆盘内取点（r 为最大半径）
export function pointInDisk(rng, r) {
  const a = rng() * Math.PI * 2;
  const rr = Math.sqrt(rng()) * r;
  return { x: Math.cos(a) * rr, z: Math.sin(a) * rr };
}

// 沿圆弧插值取点
export function arcPoint(cx, cz, r, angle) {
  return { x: cx + Math.cos(angle) * r, z: cz + Math.sin(angle) * r };
}

// 手动合并多个 BufferGeometry（不依赖 addon）
export function mergeGeometries(geoms) {
  const attrs = {};
  let indexCount = 0, vertexCount = 0;
  for (const g of geoms) {
    if (g.index) indexCount += g.index.count;
    vertexCount += g.attributes.position.count;
  }
  const pos = new Float32Array(vertexCount * 3);
  const nor = new Float32Array(vertexCount * 3);
  const uv = new Float32Array(vertexCount * 2);
  let vOff = 0;
  for (const g of geoms) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    pos.set(p.array, vOff * 3);
    nor.set(n.array, vOff * 3);
    if (u) uv.set(u.array, vOff * 2);
    vOff += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (indexCount > 0) {
    const idx = new Uint32Array(indexCount);
    let iOff = 0, base = 0;
    for (const g of geoms) {
      if (g.index) {
        for (let i = 0; i < g.index.count; i++) idx[iOff + i] = g.index.getX(i) + base;
        iOff += g.index.count;
      }
      base += g.attributes.position.count;
    }
    out.setIndex(new THREE.BufferAttribute(idx, 1));
  }
  out.computeBoundingSphere();
  return out;
}

// 由沿曲线采样的控制点构建弯曲带状叶片（宽随 t 收缩至尖）
// 控制点: 数组 {x,y,z}，朝向由相邻点切向决定
export function buildBladeGeometry(points, widthStart, widthEnd, segments = 6) {
  const verts = [];
  const idx = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const w = lerp(widthStart, widthEnd, t);
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[Math.min(n - 1, i + 1)];
    const tx = p1.x - p0.x, ty = p1.y - p0.y, tz = p1.z - p0.z;
    const len = Math.max(1e-6, Math.sqrt(tx * tx + ty * ty + tz * tz));
    // 侧向 = 切向 × 上方向(0,1,0) 归一
    let sx = -tz * 1 + ty * 0, sy = tz * 0 - tx * 0, sz = tx * 1 - ty * 0;
    // 叉积 (t × up)
    sx = ty * 0 - tz * 1; // t×up = (ty*0 - tz*1, tz*0 - tx*0, tx*1 - ty*0)
    sy = tz * 0 - tx * 0;
    sz = tx * 1 - ty * 0;
    const sl = Math.max(1e-6, Math.sqrt(sx * sx + sy * sy + sz * sz));
    sx /= sl; sy /= sl; sz /= sl;
    verts.push(p0.x + sx * w, p0.y + sy * w, p0.z + sz * w);
    verts.push(p0.x - sx * w, p0.y - sy * w, p0.z - sz * w);
  }
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

// 轻微弯曲圆柱（用于芦苇秆/枝）
export function bendCylinder(rTop, rBottom, height, radialSeg = 5, heightSeg = 4, bend = 0) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, height, radialSeg, heightSeg);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const f = y / height + 0.5;          // -0.5..0.5
    const k = Math.pow(f + 0.5, 1.6);    // 底部少弯
    p.setX(i, p.getX(i) + bend * k);
    p.setZ(i, p.getZ(i) + bend * k * 0.4);
  }
  g.computeVertexNormals();
  return g;
}

// 简单材质构造（含表面粗糙度/金属度）
export function mat({ color = 0x888888, roughness = 0.9, metalness = 0, map = null, bumpMap = null, bumpScale = 0.02, normalMap = null, normalScale = 1, envIntensity = 0.35, transparent = false, opacity = 1, side = THREE.FrontSide, vertexColors = false, flat = false }) {
  return new THREE.MeshStandardMaterial({
    color, roughness, metalness, map, bumpMap, bumpScale, normalMap, normalScale,
    envMapIntensity: envIntensity, transparent, opacity, side, vertexColors, flatShading: flat,
  });
}

export const UP = new THREE.Vector3(0, 1, 0);
export function lookAtUp(obj, x, z) {
  obj.lookAt(x, obj.position.y + 10, z);
}

// 在四边形内均匀撒点（用于厂区地坪杂物）
export function jitterGrid(rng, x0, x1, z0, z1, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: rand(rng, x0, x1), z: rand(rng, z0, z1) });
  }
  return pts;
}
