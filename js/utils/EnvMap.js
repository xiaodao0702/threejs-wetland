// ============================================================
// EnvMap.js — 灰调环境贴图（PMREM）
// 阴天均匀灰蒙环境：上灰下暗，为 PBR 材质提供柔反射
// ============================================================
import * as THREE from 'three';

export function createEnvironmentMap(renderer) {
  const cv = document.createElement('canvas');
  cv.width = 2048; cv.height = 1024;
  const ctx = cv.getContext('2d');

  // 天空渐变（水平线略亮 → 天顶略暗），无方向性
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, '#7d8581');
  g.addColorStop(0.42, '#a1aaa6');
  g.addColorStop(0.52, '#aab3af');
  g.addColorStop(0.58, '#8f9894');
  g.addColorStop(1.0, '#3a3f3a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2048, 512);

  // 地面（暗、微噪，消除纯色死板）
  const img = ctx.createImageData(2048, 512);
  const d = img.data;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 2048; x++) {
      const n = Math.sin(x * 0.01 + y * 0.013) * 3;
      const i = ((y + 512) * 2048 + x) * 4;
      const v = 60 + n;
      d[i] = v; d[i + 1] = v + 2; d[i + 2] = v; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 512);

  const tex = new THREE.CanvasTexture(cv);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose();
  return rt.texture;
}
