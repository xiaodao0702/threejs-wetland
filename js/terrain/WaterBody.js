// ============================================================
// WaterBody.js — 浑浊静水水面系统
// 自定义着色器：解析涟漪法线、深度斑驳混色、菲涅尔弱反射、
// 微高光、指数雾衰减、顶点微浪动画
// ============================================================
import * as THREE from 'three';
import { CONFIG } from '../config/sceneConfig.js';
import { fbm2D } from '../utils/Noise.js';
import { waterDepthTexture } from '../utils/TextureFactory.js';

const VERT = /* glsl */`
uniform float uTime;
varying vec3 vW;
#include <common>
#include <fog_pars_vertex>
void main() {
  vec3 p = position;
  float t = uTime;
  // 顶点微浪（幅度小、低频）
  p.y += 0.045 * sin(p.x * 0.16 + t * 0.5)
       + 0.032 * sin(p.z * 0.13 - t * 0.38)
       + 0.022 * sin((p.x + p.z) * 0.10 + t * 0.3);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FRAG = /* glsl */`
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSky;
uniform vec3 uLightDir;
uniform float uOpacity;
uniform sampler2D uDepth;
varying vec3 vW;
#include <common>
#include <fog_pars_fragment>

float rippleH(vec2 p, float t) {
  float h = 0.0;
  h += sin(p.x * 0.32 + t * 0.75) * 0.24;
  h += sin(p.y * 0.27 - t * 0.62) * 0.18;
  h += sin((p.x + p.y) * 0.19 + t * 0.44) * 0.15;
  h += sin(p.x * 0.11 - t * 0.50) * 0.12;
  h += sin(p.y * 0.15 + t * 0.33) * 0.10;
  h += sin((p.x * 0.5 - p.y * 0.4) + t * 0.27) * 0.07;
  return h;
}

void main() {
  vec2 px = vW.xz;
  float t = uTime;
  const float e = 0.45;
  float dhdx = (rippleH(px + vec2(e, 0.0), t) - rippleH(px - vec2(e, 0.0), t)) / (2.0 * e);
  float dhdz = (rippleH(px + vec2(0.0, e), t) - rippleH(px - vec2(0.0, e), t)) / (2.0 * e);
  vec3 n = normalize(vec3(-dhdx, 1.0, -dhdz));

  // 深度斑驳（世界坐标采样，大尺度暗/浅团块 → 浑浊与深浅变化）
  vec4 dep = texture2D(uDepth, px * 0.012);
  vec3 c = mix(uDeep, uShallow, dep.r);

  vec3 V = normalize(cameraPosition - vW);
  // 菲涅尔弱反射（灰蒙天空色）：远视距反射带更明显
  float fres = pow(1.0 - max(dot(n, V), 0.0), 2.6);
  c = mix(c, uSky, fres * 0.5);

  // 微光闪烁（水纹细碎高光，阴天弱）
  float glint = pow(max(0.0, 0.5 + 0.5 * sin(dhdx * 46.0 + dhdz * 52.0 + t * 1.7)), 16.0);
  c += vec3(glint) * uSky * 0.30;

  // 柔和镜面高光（阴天低强度）
  vec3 H = normalize(uLightDir + V);
  float spec = pow(max(dot(n, H), 0.0), 44.0) * 0.30
             + pow(max(dot(n, H), 0.0), 7.0) * 0.08;
  c += vec3(spec) * uSky * 0.6;

  gl_FragColor = vec4(c, uOpacity);
  #include <fog_fragment>
}
`;

function createWaterMaterial(opts = {}) {
  const W = CONFIG.water;
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: opts.deep || W.deep.clone() },
      uShallow: { value: opts.shallow || W.shallow.clone() },
      uSky: { value: W.sky.clone() },
      uLightDir: { value: W.lightDir.clone() },
      uOpacity: { value: opts.opacity || W.opacity },
      uDepth: { value: waterDepthTexture(8, 512, 2.5) },
      // ShaderMaterial 需自行提供雾 uniform（three 的 refreshFogUniforms 会同步场景雾）
      fogColor: { value: new THREE.Color(CONFIG.fog.color) },
      fogDensity: { value: CONFIG.fog.density },
    },
  });
  return mat;
}

// 有机湿地外轮廓（带 jitter 的矩形 → 自然水网岸线）
function organicShape(xHalf, zNear, zFar, seed, jitter = 5.5) {
  const corners = [[-xHalf, zNear], [xHalf, zNear], [xHalf, zFar], [-xHalf, zFar]];
  const perEdge = 110;
  const pts = [];
  for (let e = 0; e < 4; e++) {
    const A = corners[e], B = corners[(e + 1) % 4];
    // 外法线
    const nx = -(B[1] - A[1]), nz = (B[0] - A[0]);
    const nl = Math.hypot(nx, nz);
    const ux = nx / nl, uz = nz / nl;
    for (let s = 0; s < perEdge; s++) {
      const t = s / perEdge;
      const px = A[0] + (B[0] - A[0]) * t;
      const pz = A[1] + (B[1] - A[1]) * t;
      const n = fbm2D(t * 1.8 + e * 9.1, seed * 0.41, seed, 3);
      const off = (n - 0.5) * 2 * jitter + Math.sin(t * 14 + e * 3) * 1.2;
      // Shape 局部 Y 需为世界 Z 的负值（旋转 -90° 后 y → -z）
      pts.push([px + ux * off, -(pz + uz * off)]);
    }
  }
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();
  return shape;
}

// 主水面（覆盖整片湿地，岛屿从其上浮出）
export function createMainWater(scene) {
  const W = CONFIG.wetland;
  const shape = organicShape(W.xHalf, W.zNear, W.zFar, 101, 6.0);
  // Shape 局部 Y 表示世界 Z（负），旋转 -90° 对齐
  const geo = new THREE.ShapeGeometry(shape, 1);
  const mesh = new THREE.Mesh(geo, createWaterMaterial());
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = CONFIG.levels.water;
  mesh.renderOrder = 1;
  scene.add(mesh);

  // 浅水洼地（泥滩上零星静水塘）
  const puddleSeeds = [
    [-72, 62, 5.2], [-30, 68, 6.4], [28, 72, 5.8], [66, 58, 4.6],
    [-46, 40, 3.4], [8, -6, 4.2], [-10, -34, 3.8], [52, -20, 4.8],
  ];
  const puddles = [];
  for (const [x, z, r] of puddleSeeds) {
    const sh = new THREE.Shape();
    const pts = [];
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (1 + fbm2D(Math.cos(a) * 2, Math.sin(a) * 2, i * 7 + 3, 2) * 0.3);
      pts.push([Math.cos(a) * rr, -Math.sin(a) * rr]);
    }
    sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n; i++) sh.lineTo(pts[i][0], pts[i][1]);
    sh.closePath();
    const m = new THREE.Mesh(
      new THREE.ShapeGeometry(sh, 1),
      createWaterMaterial({ shallow: new THREE.Color('#7a8d81'), opacity: 0.82 })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, CONFIG.levels.puddle, z);
    m.renderOrder = 2;
    scene.add(m);
    puddles.push(m);
  }

  const mats = [mesh.material, ...puddles.map(p => p.material)];
  return {
    group: mesh,
    puddles,
    materials: mats,
    update(t) { for (const m of mats) m.uniforms.uTime.value = t; },
  };
}
