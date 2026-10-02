# 滨海芦苇湿地 · 远眺重工业厂区 — 微缩三维景观（Three.js）

模块化 Three.js 写实微缩场景：阴天灰蒙的滨海芦苇沼泽湿地，从高架桥梁外侧远眺地平线上的重工业厂区。
第三人称自由观景视角：拖拽 360° 旋转、无极缩放、无任何 UI。

## 运行方式

```bash
# 任选其一（ES Module 需经 HTTP 服务访问，不能直接双击 index.html）
bash start.sh          # 默认 8090，端口被占自动后移；可传参指定 bash start.sh 7070
# 或
python3 -m http.server 8090
# 或
npx serve .
```

然后浏览器打开 `http://localhost:8090/`。

> 依赖：本项目使用本地化 `vendor/three.module.js`（three@0.160.0），**完全离线可用**，无任何外部 CDN 依赖。

## 画面验证（离屏渲染）

`scripts/render-verify.js` 使用 Node + headless-gl 对同一场景做 6 机位离屏渲染，
输出到 `assets/screenshots/`（01 默认 / 02 俯视 / 03 厂区 / 04 湿地近景 / 05 侧轨 / 06 桥底），用于质量迭代验证。

```bash
node scripts/render-verify.js                 # 渲染全部 6 机位
node scripts/render-verify.js 0 7.3 89.2 0 2.2 -55 shot     # 自定义机位
```

> 注：依赖 `gl`/`canvas`/`pngjs` 仅用于开发期离屏验证，运行网页本体不需要。

## 项目结构（模块化架构）

```
index.html                    入口主框架（仅壳 + importmap，无场景逻辑）
vendor/                       three.js 本地化依赖
js/
├── config/sceneConfig.js     全局布局/配色/光照/雾 配置（与 LAYOUT.md 对应）
├── main.js                   主装配：组装各模块 + 动画循环
├── core/                     渲染器 / 相机操控 / 光照 / 天空大气 / 底座
│   ├── RendererSetup.js       WebGL 渲染器（ACES 电影色调、柔和阴影）
│   ├── CameraRig.js           第三人称轨道相机（360°旋转/无极缩放）
│   ├── Lighting.js            阴天漫射光（半球光+软方向光+补光）
│   ├── SkyAtmosphere.js       灰蒙渐变天穹 + FogExp2 空气透视
│   └── BasePedestal.js        200×200 正方形纯色底座
├── utils/                     噪声 / 程序化纹理工厂 / 灰调环境贴图
├── terrain/                  湿地地形
│   ├── MudBase.js             全域泥滩基底
│   ├── Island.js              湿地岛屿 + 水下泥裙（含高度采样）
│   └── WaterBody.js           浑浊水面系统（自定义涟漪着色器）
├── vegetation/               植被（全部独立建模）
│   ├── ReedPlant.js           芦苇单株（秆/鞘/叶/穗）
│   ├── ReedPatch.js           芦苇丛（实例化，双变体+风摆）
│   ├── GrassTuft.js           湿生野草
│   ├── Bush.js                低矮灌木
│   └── WaterPlants.js         漂浮叶/残枝/藻斑/出水莎草
├── industry/                 远景重工业厂区（每件独立建模）
│   ├── Chimney.js  CoolingTower.js  DistillationTower.js
│   ├── StorageTank.js  Gasholder.js  PipeRack.js
│   ├── SteelFrame.js  Warehouse.js  SmokeSystem.js
│   └── FactoryComplex.js      厂区总装（地坪/道路/栈桥/堆场）
├── bridge/BridgeRailing.js   近景高架桥梁护栏与桥面
└── effects/                  动态氛围
    ├── WindSway.js            植被顶点风摆
    ├── MistSystem.js          薄雾层 + 水汽粒子
    └── GlassOverlay.js        车窗玻璃观感（极淡反射/雾感）
```

## 核心需求速览（详见 AGENT.md / LAYOUT.md）

- **布局**：近景桥梁护栏 → 中景交错水道/芦苇滩涂/湿地岛屿 → 远景沿平直地平线展开的化工冶炼厂区。
- **风格**：低饱和灰绿/冷青/浅灰，阴天漫射柔光，空气透视薄雾，写实纪录片质感。
- **动态**：芦苇低频风摆、水面细密涟漪、烟囱烟气缓升横漂、薄雾缓慢流动；光线稳定。
- **质量**：PBR 材质 + 程序化写实纹理（混凝土返碱/锈蚀钢/湿泥/波纹板等），不合并网格、不简化细节。
- **约束**：无 UI、无水印、无人物动物；渲染目标 60fps（桌面）/ 30fps+（移动）。

## 文档

- `AGENT.md` — 项目核心需求与工程约束权威来源
- `LAYOUT.md` — 场景布局方案（坐标/标高/资产清单）
- `docs/layout-plan.html` — 布局示意图（俯视平面 + 纵向剖面）
