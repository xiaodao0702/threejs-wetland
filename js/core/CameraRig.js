// ============================================================
// CameraRig.js — 第三人称自由观景相机 + 轨道操控
// 拖拽 360° 旋转、无极缩放、无 UI；保持俯视不钻地
// ============================================================
import * as THREE from 'three';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { CONFIG } from '../config/sceneConfig.js';

export function createCameraRig(renderer) {
  const C = CONFIG.camera;
  const camera = new THREE.PerspectiveCamera(C.fov, window.innerWidth / window.innerHeight, C.near, C.far);
  camera.position.set(C.pos[0], C.pos[1], C.pos[2]);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(C.target[0], C.target[1], C.target[2]);
  controls.enableDamping = true;
  controls.dampingFactor = C.damping;
  controls.minDistance = C.minDistance;
  controls.maxDistance = C.maxDistance;
  controls.minPolarAngle = C.minPolar;
  controls.maxPolarAngle = C.maxPolar;
  controls.enablePan = false;          // 保持构图，禁用平移
  controls.rotateSpeed = 0.85;
  controls.zoomSpeed = 0.9;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return { camera, controls };
}
