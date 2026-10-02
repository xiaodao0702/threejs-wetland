// ============================================================
// BridgeRailing.js — 近景高架桥梁护栏与桥面边缘
// 混凝土护栏（污渍/水痕/风化裂纹/磨损）+ 桥面板厚/倒角/缘石
// ============================================================
import * as THREE from 'three';
import { CONFIG } from '../config/sceneConfig.js';
import { concreteTexture, deckAsphaltTexture } from '../utils/TextureFactory.js';
import { mat } from '../utils/Helpers.js';

const B = CONFIG.bridge;

export function createBridgeRailing(scene) {
  const group = new THREE.Group();
  const tex = concreteTexture(91, 1024, 6);
  tex.repeat.set(28, 1.6);
  const cm = mat({ map: tex, bumpMap: tex, color: 0xd8dacf, roughness: 0.94, metalness: 0, envIntensity: 0.3, bumpScale: 0.04 });

  // ---- 桥面板（真实厚度 + 倒角）----
  const deck = new THREE.Mesh(new THREE.BoxGeometry(200, B.deckThick, B.zNear - B.zFar), cm);
  deck.position.set(0, B.deckTop - B.deckThick / 2, (B.zNear + B.zFar) / 2);
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // 桥面沥青覆层（车辙/油渍/裂缝/褪色标线/边缘积尘）
  const asphalt = deckAsphaltTexture();
  asphalt.repeat.set(36, 2.5);
  const deckTop = new THREE.Mesh(
    new THREE.PlaneGeometry(200, B.zNear - B.zFar),
    mat({ map: asphalt, color: 0xf2f2e8, roughness: 0.9, metalness: 0, envIntensity: 0.3 })
  );
  deckTop.rotation.x = -Math.PI / 2;
  deckTop.position.set(0, B.deckTop + 0.015, (B.zNear + B.zFar) / 2);
  deckTop.receiveShadow = true;
  group.add(deckTop);

  // 桥面边缘倒角（微斜面，用细长斜棱代替）
  const chamferMat = mat({ color: 0xb8bab4, roughness: 0.96, metalness: 0, envIntensity: 0.22 });
  for (const [cz, cw] of [[B.zFar + 0.12, 0.24], [B.zNear - 0.12, 0.24]]) {
    const cham = new THREE.Mesh(new THREE.BoxGeometry(200, 0.1, cw), chamferMat);
    cham.position.set(0, B.deckTop - 0.05, cz);
    group.add(cham);
  }

  // ---- 混凝土护栏（湿地侧，画面近景下缘）----
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(200, B.parapetH, B.parapetW), cm);
  parapet.position.set(0, B.deckTop + B.parapetH / 2, B.zFar + B.parapetW / 2);
  parapet.castShadow = true;
  parapet.receiveShadow = true;
  group.add(parapet);

  // 护栏顶帽（微挑檐，制造真实倒角轮廓）
  const cap = new THREE.Mesh(new THREE.BoxGeometry(200, 0.14, B.parapetW + 0.16), cm);
  cap.position.set(0, B.deckTop + B.parapetH + 0.07, B.zFar + B.parapetW / 2);
  cap.castShadow = true;
  group.add(cap);

  // 护栏竖向伸缩缝（近景真实度关键细节）
  const parapetJointMat = mat({ color: 0x2c2f28, roughness: 1, metalness: 0, envIntensity: 0.08 });
  for (let x = -96; x <= 96; x += 8) {
    const j = new THREE.Mesh(new THREE.BoxGeometry(0.05, B.parapetH, 0.03), parapetJointMat);
    j.position.set(x, B.deckTop + B.parapetH / 2, B.zFar + B.parapetW / 2 + 0.045);
    group.add(j);
  }

  // 伸缩缝（横向暗槽，桥面真实度）
  const jointMat = mat({ color: 0x33362f, roughness: 1, metalness: 0, envIntensity: 0.1 });
  for (let x = -88; x <= 88; x += 22) {
    const joint = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, B.zNear - B.zFar), jointMat);
    joint.position.set(x, B.deckTop + 0.01, (B.zNear + B.zFar) / 2);
    group.add(joint);
  }

  // ---- 远端矮缘石（桥面外侧低坎）----
  const edge = new THREE.Mesh(new THREE.BoxGeometry(200, B.edgeBeam, 0.32), cm);
  edge.position.set(0, B.deckTop + B.edgeBeam / 2, B.zNear - 0.2);
  edge.castShadow = true;
  group.add(edge);

  // 护栏泄水口污渍（竖向深痕，桥面边缘细节）
  const stainMat = mat({ color: 0x4d5048, roughness: 1, metalness: 0, transparent: true, opacity: 0.5 });
  for (const x of [-86, -60, -34, -8, 18, 44, 70]) {
    const stain = new THREE.Mesh(new THREE.PlaneGeometry(0.16, B.parapetH * 1.15), stainMat);
    stain.position.set(x, B.deckTop + B.parapetH * 0.52, B.zFar + B.parapetW / 2 + 0.02);
    stain.rotation.y = Math.PI;
    group.add(stain);
  }

  scene.add(group);
  return group;
}
