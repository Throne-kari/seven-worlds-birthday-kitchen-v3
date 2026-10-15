# 七界厨房 · 第三版

独立的生日料理网站。七套游戏界面承担选菜、备料、器具配置、采购、烹饪步骤与计时，完整保留 300 道食谱，前两版继续保留。

在线体验：**https://throne-kari.github.io/seven-worlds-birthday-kitchen-v3/**

第三版独立仓库：https://github.com/Throne-kari/seven-worlds-birthday-kitchen-v3 。发布方式见 `docs/DEPLOYMENT.md`。

## 直接启动成品

已安装 Node.js 时，双击 **`start-local.cmd`**，然后打开 **http://127.0.0.1:4186/**。此入口直接运行 `dist/`，无需安装 npm 依赖、无需联网。请保持终端运行，按 Ctrl+C 停止。

也可在本目录运行：

```powershell
node scripts/serve-dist.mjs
```

如果 4186 已占用，先访问该地址；脚本不会停止其他服务。需要其他端口时可运行 `$env:PORT=4187; node scripts/serve-dist.mjs`。不要直接双击 `dist/index.html`。

## 七种操作方式

| 主题 | 菜谱 | 主要操作 |
| --- | --- | --- |
| 森林 | 晋菜 50 | 实物库存铺垫、点按或拖入组合区、翻页料理手册 |
| CS:GO | 川菜 50 | Panorama 大厅、六区购买选择、食材检视与回合步骤 |
| 三角洲 | 湘菜 40 | 多尺寸物资仓库、称量数值、缺额与器具配装 |
| PUBG | 鲁菜 40 | 附近物资、晚餐背包、人数准备和料理 HUD |
| Apex | 粤菜 40 | 三工位步骤分配、需要材料/处理中/等待/完成标记 |
| 法环 | 江浙 40 | 物品制作、覆盖全部 40 道菜的地图、赐福步骤路径 |
| 帕鲁 | 西餐甜点 40 | 真实器具筛选、基地工作台、可排序制作队列 |

顶部常驻跨主题菜名/中英文食材搜索、收藏、采购和计时器。键盘 `/` 聚焦搜索；方向键选结果、Enter 打开、Escape 关闭。主要料理操作留在各自主题内，完整食谱阅读页提供所有材料说明、替代、失误处理、保存与来源。

所有准备、数量、器具、完成、收藏及队列都由用户操作产生，保存在当前浏览器。没有联网队友、实时库存、商品价格或自动烹饪完成。计时到零只提示检查食物。份量换算改变材料用量，不机械缩放时间、火候、器具或成形尺寸。

设置中可以启用系统指针及减少动态效果，也尊重系统的减少动态偏好。七套指针各自独立，文本输入保留 I-beam。无需拖拽也可以完成全部操作。

## 继续开发

本机验证环境为 Node.js 24.14.0。源码入口为 `src/v3/main.js`。

```powershell
npm ci --offline=false --ignore-scripts --cache .npm-cache --no-audit --no-fund
npm run dev
```

开发地址为 **http://127.0.0.1:5186/**，双击 `start-dev.cmd` 也可启动。端口严格固定且只监听本机，不停止其他版本服务。

```powershell
npm test
npm run validate:data
npm run build
```

浏览器复核先启动 4186 成品服务，再运行：

```powershell
$env:REVIEW_URL='http://127.0.0.1:4186/'
node scripts/verify-v3.mjs
node scripts/verify-workflows.mjs
node scripts/audit-300-browser.mjs
```

脚本使用项目内 Playwright 和本机 Chrome。非默认安装位置可设置 `CHROME_PATH`。结果保存至 `qa/`，截图位于 `qa/screenshots/`。

## 数据、来源与交付

- `src/data/recipes/all.json`：唯一正式 300 食谱，SHA-256 `247c304aa21a9523cc6b6290a7a4cac759e126130e68eb2cc14483b668f792e6`。
- `dist/`：已构建的成品，与 GitHub Pages 发布分支对应。
- 本地完整交付另保留第二版基线、第三版设计与研究说明、实际验收报告、研究图及交付压缩包；这些资料不进入公共仓库。研究截图没有作为交互界面或进入生产构建。

配方继承原版的无主动乳制品配料约束，保留包装核对及交叉接触提示；前台不展示朋友私人健康信息。300 道配方未逐道厨房试做。游戏名称归各自权利人，本项目为非官方生日作品。
