# 第三版 GitHub Pages

- 仓库：https://github.com/Throne-kari/seven-worlds-birthday-kitchen-v3
- 页面：https://throne-kari.github.io/seven-worlds-birthday-kitchen-v3/
- 源码分支：`main`
- Pages 分支：`gh-pages`，目录 `/`
- `main` 保留源码、构建结果、测试与复核脚本；`gh-pages` 只包含 `dist/`。
- Vite 使用相对资源路径 `base: './'`，适用于仓库子目录。
- `public/.nojekyll` 随构建发布，避免 Jekyll 转换静态文件。

发布只操作本第三版仓库，不替换前两版。当前版本保存状态于访问者浏览器，没有账户、后端或在线队友。GitHub Pages 与本地地址的浏览器存储相互独立。

## 更新发布

在本项目中完成修改和验收，再执行：

```powershell
npm test
npm run build
git add src public dist tests scripts index.html package.json package-lock.json vite.config.js README.md docs/DEPLOYMENT.md
git commit -m "Update third edition"
git push origin main
git subtree split --prefix dist -b pages-next
git push origin pages-next:gh-pages
git branch -D pages-next
```

若 Pages 分支出现冲突，先检查远端变化，不强制覆盖。发布完成后验证线上七主题、搜索及完整配方，检查手机视口和素材请求。相关运行记录保存在本地 `qa/github-pages/`。

## 验收范围

300 道食谱 SHA-256：`247c304aa21a9523cc6b6290a7a4cac759e126130e68eb2cc14483b668f792e6`。

桌面及320/390宽度使用本机 Chrome 验证；没有声称实体手机、Safari、Firefox或全部辅助技术均经过测试，也未逐道实际下厨。
