// ============================================================
// SmokeSystem.js — 烟囱烟气（粒子着色器）
// 缓升 + 横向漂移 + 扩散 + 渐隐；灰蒙空气中的自然烟气
// ============================================================
import * as THREE from 'three';
import { mulberry32 } from '../utils/Noise.js';
import { softCircleTexture } from '../utils/TextureFactory.js';

const VERT = /* glsl */`
attribute float aSeed;
attribute vec2  aDrift;
attribute float aHeight;
uniform float uTime;
uniform float uSize;
varying float vLife;
void main() {
  float t = uTime * 0.055 + aSeed * 0.41;
  float life = fract(t);
  float h = life * aHeight;
  vec3 p = position;
  // 横向漂移 + 湍流扰动
  vec2 wind = aDrift * life
            + vec2(sin(life * 2.1 + aSeed * 21.0), cos(life * 1.7 + aSeed * 13.0)) * 1.2 * life;
  vec3 pos = vec3(p.x + wind.x, p.y + h, p.z + wind.y * 0.9);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (uSize * (1.0 + life * 2.4)) * (260.0 / max(1.0, -mv.z));
  vLife = life;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */`
uniform vec3 uColor;
varying float vLife;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv) * 2.0;
  float a = smoothstep(1.0, 0.15, d);
  // 生起渐显、扩散渐隐
  a *= smoothstep(0.0, 0.08, vLife) * (1.0 - smoothstep(0.68, 1.0, vLife));
  gl_FragColor = vec4(uColor, a * 0.34);
}
`;

export function makeSmokeEmitter(anchor, { seed = 1, height = 16, drift = [0.55, 0.2], size = 3.2, count = 56 }) {
  const rng = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const drifts = new Float32Array(count * 2);
  const heights = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2, rr = rng() * 0.9;
    positions[i * 3] = Math.cos(a) * rr;
    positions[i * 3 + 1] = (rng() - 0.5) * 0.8;
    positions[i * 3 + 2] = Math.sin(a) * rr;
    seeds[i] = rng();
    drifts[i * 2] = drift[0] * (0.6 + rng() * 0.8);
    drifts[i * 2 + 1] = drift[1] * (0.5 + rng() * 0.9);
    heights[i] = height * (0.6 + rng() * 0.7);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 2));
  geo.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xcdd1cd) },
      uSize: { value: size },
    },
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 5;
  anchor.add(points);
  return points;
}

// 批量创建多个烟囱的烟气
export function createSmokeSystems(scene, emitters) {
  const systems = [];
  for (const e of emitters) {
    systems.push(makeSmokeEmitter(e.anchor, e));
  }
  return {
    systems,
    update(t) {
      for (const s of systems) s.material.uniforms.uTime.value = t;
    },
  };
}
