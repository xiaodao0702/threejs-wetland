// ============================================================
// PipeRack.js — 输送管廊（独立建模）
// 立柱排架 + 顶层横梁 + 双层管道；工业漆/锈
// ============================================================
import * as THREE from 'three';
import { paintedSteelTexture, rustTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';

export function makePipeRack({ x0, x1, z, h = 7, seed = 6 }) {
  const group = new THREE.Group();
  const paintTex = paintedSteelTexture(seed, 512, 1);
  const rustTex = rustTexture(seed + 5, 512, 1);
  const pm = mat({ map: paintTex, color: 0xc3c7c6, roughness: 0.84, metalness: 0.35, envIntensity: 0.38 });
  const rm = mat({ map: rustTex, color: 0xbdbdb9, roughness: 0.9, metalness: 0.4, envIntensity: 0.35 });

  const len = x1 - x0;
  const span = 6;
  const posts = Math.floor(len / span) + 1;

  // 立柱（实例化）
  const postGeo = new THREE.BoxGeometry(0.24, h, 0.24);
  const inst = new THREE.InstancedMesh(postGeo, pm, posts);
  const m = new THREE.Matrix4();
  for (let i = 0; i < posts; i++) {
    const x = x0 + i * span;
    m.makeTranslation(x, h / 2, z);
    inst.setMatrixAt(i, m);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = true;
  inst.receiveShadow = true;
  group.add(inst);

  // 顶层横梁（两道，含斜撑位）
  for (const yOff of [h - 0.15, h * 0.55]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(len, 0.16, 0.5), pm);
    beam.position.set(x0 + len / 2, yOff, z);
    beam.castShadow = true;
    group.add(beam);
  }

  // 管道层（双层：粗管 + 细管）
  const pipeLayers = [
    { r: 0.22, y: h - 0.7, tex: rm },
    { r: 0.34, y: h - 1.55, tex: rm },
    { r: 0.16, y: h - 1.9, tex: pm },
  ];
  for (const { r, y, tex: t } of pipeLayers) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len * 0.98, 8, 2), t);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(x0 + len / 2, y, z);
    pipe.castShadow = true;
    group.add(pipe);
  }

  // 管道支墩（间隔横撑）
  for (let i = 0; i < posts - 1; i++) {
    const x = x0 + i * span + span / 2;
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.14, h * 0.5, 0.14), rm);
    brace.position.set(x, h * 0.28, z);
    group.add(brace);
  }

  return { group };
}
