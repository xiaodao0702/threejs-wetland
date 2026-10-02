// ============================================================
// MudBase.js — 全域泥滩基底（潮湿淤泥质地、极缓起伏）
// ============================================================
import * as THREE from 'three';
import { CONFIG } from '../config/sceneConfig.js';
import { fbm2D } from '../utils/Noise.js';
import { mudTexture } from '../utils/TextureFactory.js';

export function createMudBase(scene) {
  const W = CONFIG.wetland;
  const size = (W.xHalf + 2) * 2; // 196

  const seg = 56;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    // 极缓起伏 + 浅洼倾向（主水道区略低）
    let h = fbm2D(x * 0.06, z * 0.06, 31, 3) * 0.10 - 0.05;
    // 中央水道区轻微下陷，形成排水走势
    const canal = Math.exp(-((x * 0.22) * (x * 0.22))) * 0.03 * Math.sin(z * 0.08 + 1.7);
    h += canal;
    pos.setY(i, Math.max(-0.16, h));
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: mudTexture(31, 512, 7),
    color: 0xb9b9a8,
    roughness: 0.97,
    metalness: 0.0,
    envMapIntensity: 0.22,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = CONFIG.levels.mudFloor;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
