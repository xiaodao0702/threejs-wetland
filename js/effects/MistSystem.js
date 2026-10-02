// ============================================================
// MistSystem.js — 湿地薄雾与空气水汽
// 多层低空雾面缓慢漂移 + 细微水汽粒子层
// ============================================================
import * as THREE from 'three';
import { noiseAlphaTexture, softCircleTexture } from '../utils/TextureFactory.js';
import { mulberry32 } from '../utils/Noise.js';
import { CONFIG } from '../config/sceneConfig.js';

export function createMistSystem(scene) {
  const group = new THREE.Group();
  const layers = [];

  // ---- 低空薄雾层（3 层，缓慢漂移）----
  const specs = [
    { w: 220, d: 60, y: 1.3, opacity: 0.07, seed: 81, speed: 0.010 },
    { w: 180, d: 46, y: 2.6, opacity: 0.05, seed: 82, speed: 0.014 },
    { w: 240, d: 70, y: 4.2, opacity: 0.04, seed: 83, speed: 0.008 },
  ];
  for (const s of specs) {
    const tex = noiseAlphaTexture(s.seed, 512, 256);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: s.opacity, depthWrite: false,
      color: 0xc4cbc5, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, s.y, -20);
    mesh.renderOrder = 3;
    group.add(mesh);
    layers.push({ mesh, speed: s.speed, baseX: 0 });
  }

  // ---- 远景地平线薄雾带（厂区前，空气透视软边）----
  const farTex = noiseAlphaTexture(87, 512, 128);
  const farMat = new THREE.MeshBasicMaterial({
    map: farTex, transparent: true, opacity: 0.16, depthWrite: false,
    color: 0xc8d0c9, side: THREE.DoubleSide,
  });
  const farHaze = new THREE.Mesh(new THREE.PlaneGeometry(280, 46), farMat);
  farHaze.rotation.x = -Math.PI / 2;
  farHaze.position.set(0, 6.2, -86);
  farHaze.renderOrder = 3;
  group.add(farHaze);
  layers.push({ mesh: farHaze, speed: 0.006, baseX: 0 });

  // ---- 细微水汽粒子（湿地空气中悬浮）----
  const count = 420;
  const rng = mulberry32(91);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rng() - 0.5) * 180;
    positions[i * 3 + 1] = 0.4 + rng() * 6.5;
    positions[i * 3 + 2] = (rng() - 0.5) * 140 - 15;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pm = new THREE.PointsMaterial({
    map: softCircleTexture(64), size: 2.6, transparent: true, opacity: 0.055,
    color: 0xd6dcd6, depthWrite: false, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, pm);
  points.frustumCulled = false;
  points.renderOrder = 4;
  group.add(points);

  scene.add(group);
  return {
    group,
    update(t) {
      for (const l of layers) {
        l.mesh.position.x = l.baseX + Math.sin(t * l.speed * 2.2) * 26;
        l.mesh.position.z = -20 + Math.cos(t * l.speed * 1.4) * 8;
      }
      points.rotation.y = Math.sin(t * 0.02) * 0.05;
    },
  };
}
