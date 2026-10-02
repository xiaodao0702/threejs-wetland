// ============================================================
// scripts/render-verify.js — 离屏渲染验证工具（Node + headless-gl）
// 复用项目全部模块，多机位渲染 PNG，用于画面质量迭代
// 运行：node scripts/render-verify.js
// ============================================================
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const W = 1600, H = 900;

// ---- 1. 全局 polyfill（先于模块导入）----
const createGL = require('gl');
let gl = createGL(W, H, { antialias: true, preserveDrawingBuffer: true, webgl2: true });
if (!gl) gl = createGL(W, H, { antialias: true, preserveDrawingBuffer: true });
if (!gl) { console.error('headless-gl 上下文创建失败'); process.exit(1); }

const Canvas2D = require('canvas').Canvas;
const fakeDoc = {
  addEventListener() {}, removeEventListener() {},
  documentElement: { style: {} },
  createElement(tag) {
    if (tag === 'canvas') return new Canvas2D(64, 64);
    return { style: {}, appendChild() {}, addEventListener() {}, removeEventListener() {} };
  },
  getElementById() { return container; },
  body: { appendChild() {} },
};
const container = { appendChild() {}, style: {} };
const fakeCanvas = {
  width: W, height: H, style: {},
  clientWidth: W, clientHeight: H,
  getContext(type) { return (type || '').includes('webgl') ? gl : null; },
  addEventListener() {}, removeEventListener() {},
  setPointerCapture() {}, releasePointerCapture() {},
  ownerDocument: fakeDoc,
};

global.window = {
  devicePixelRatio: 1, innerWidth: W, innerHeight: H,
  addEventListener() {}, removeEventListener() {},
  WebGLRenderingContext: function WebGLRenderingContext() {},
  WebGL2RenderingContext: function WebGL2RenderingContext() {},
};
global.document = fakeDoc;
global.requestAnimationFrame = () => {};   // 循环停住，boot 只渲染首帧
global.addEventListener = () => {};
globalThis.__RENDER_CANVAS__ = fakeCanvas; // 注入 headless WebGL canvas
// WebGL 能力标记（node 环境无原生构造器，polyfill 为真值）
global.WebGLRenderingContext = function WebGLRenderingContext() {};
global.WebGL2RenderingContext = function WebGL2RenderingContext() {};

// ---- 2. 导入项目（boot 自动执行，渲染默认机位一帧）----
(async () => {
  try {
    await import(path.join(__dirname, '..', 'js', 'main.js'));
  } catch (e) {
    console.error('模块导入失败:', e.message);
    process.exit(1);
  }
  const S = globalThis.__SCENE__;
  if (!S) { console.error('未取得 __SCENE__ 句柄'); process.exit(1); }
  const { scene, camera, renderer, controls } = S;

  // ---- 3. 多机位渲染 ----
  // 支持自定义机位：node render-verify.js px py pz tx ty tz [name]
  const args = process.argv.slice(2);
  let views;
  if (args.length >= 6) {
    const name = args[6] || 'custom';
    views = [{
      name,
      pos: [parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2])],
      tgt: [parseFloat(args[3]), parseFloat(args[4]), parseFloat(args[5])],
    }];
  } else {
    views = [
      { name: '01-default', pos: [0, 7.3, 89.2], tgt: [0, 2.2, -55] },
      { name: '02-wide-top', pos: [0, 46, 96], tgt: [0, 0, -20] },
      { name: '03-factory', pos: [30, 12, -40], tgt: [10, 12, -85] },
      { name: '04-wetland-close', pos: [-24, 4.2, 60], tgt: [-18, 0.6, 20] },
      { name: '05-side-orbit', pos: [95, 14, -10], tgt: [0, 2, -30] },
      { name: '06-bridge-low', pos: [6, 7.25, 91], tgt: [0, 2.2, -55] },
    ];
  }

  const outDir = path.join(__dirname, '..', 'assets', 'screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  for (const v of views) {
    camera.position.set(...v.pos);
    controls.target.set(...v.tgt);
    controls.update();
    renderer.render(scene, camera);
    gl.finish();

    const buf = Buffer.alloc(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    // 垂直翻转（WebGL 原点左下）
    const flipped = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) {
      buf.copy(flipped, y * W * 4, (H - 1 - y) * W * 4, (H - y) * W * 4);
    }
    const png = new PNG({ width: W, height: H });
    flipped.copy(png.data);
    const file = path.join(outDir, v.name + '.png');
    fs.writeFileSync(file, PNG.sync.write(png));
    console.log('rendered', v.name);
  }
  process.exit(0);
})();
