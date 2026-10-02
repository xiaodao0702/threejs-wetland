// ============================================================
// WindSway.js — 植被风摆（顶点着色器注入）
// 低频小幅摆动：世界坐标相位、底部固定、顶部振幅最大
// ============================================================
import { CONFIG } from '../config/sceneConfig.js';

export const windUniforms = {
  uTime: { value: 0 },
  uWind: { value: CONFIG.anim.wind },
};

const INJECT = `
#include <begin_vertex>
  #ifdef USE_INSTANCING
    vec4 _wp = instanceMatrix * vec4(transformed, 1.0);
  #else
    vec4 _wp = modelMatrix * vec4(transformed, 1.0);
  #endif
  float _ph1 = sin(uTime * 0.85 + _wp.x * 0.32 + _wp.z * 0.24);
  float _ph2 = sin(uTime * 1.15 + _wp.z * 0.41 + _wp.x * 0.19);
  float _wind = (_ph1 * 0.55 + _ph2 * 0.45) * uWind;
  float _h = smoothstep(0.0, 1.15, transformed.y);
  transformed.x += _wind * 0.30 * _h;
  transformed.z += _wind * 0.18 * _h;
`;

export function injectWind(material, key = 'wind') {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWind = windUniforms.uWind;
    // 内置材质自定义 uniform：必须在源码头部自行声明
    shader.vertexShader = 'uniform float uTime;\nuniform float uWind;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', INJECT);
  };
  material.customProgramCacheKey = () => key;
}
