# jupiter796.github.io

个人主页，React 19 + Vite + TypeScript，通过 GitHub Actions 构建并部署到 GitHub Pages。

线上地址：<https://jupiter796.github.io/>

---

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览 dist/ 的构建结果
```

### 本机网络环境

- `registry.npmjs.org`、`api.github.com`、`codeload.github.com` **可直连**。
- `github.com` 是 **SNI 层阻断**：TCP 能连上，但 TLS 握手会卡死。所以 `git push` 走默认 HTTPS 会一直挂在那儿。DNS 也会返回假地址（`198.51.45.8`）。
- 出路是 **SSH over 443**，`ssh.github.com:443` 实测可连：

  ```bash
  # 追加到 ~/.ssh/config
  # Host github.com
  #   HostName ssh.github.com
  #   Port 443
  #   User git

  git remote set-url origin git@github.com:Jupiter796/jupiter796.github.io.git
  ssh -T git@github.com          # 验证：出现 "Hi Jupiter796!" 即成功
  ```

  或者给 git 配本地代理（本机 `127.0.0.1:7890` 有 Clash 类代理在跑）：

  ```bash
  git config --global http.proxy http://127.0.0.1:7890
  git config --global https.proxy http://127.0.0.1:7890
  ```

受限环境下 npm 可能报 `EPERM` 写不了默认缓存，把缓存指到项目内即可：

```bash
npm install --cache ./.npm-cache
```

---

## 部署方式

**Source 必须是 `GitHub Actions`**（Settings → Pages → Build and deployment → Source）。

工作流 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 的流程：

1. `npm ci` 装依赖（依赖 `package-lock.json`，**必须提交进仓库**）
2. `npm run build` → `dist/`
3. 复制 `dist/index.html` 为 `dist/404.html`，给前端路由做深链接兜底
4. 上传 `dist/` 作为 Pages artifact 并部署

**关键点**：Actions 部署时，线上发布的**只有 artifact 的内容**——仓库里放什么都不会被直接发布。这与「Deploy from a branch」完全不同（后者会把分支原始文件直接当站点发布）。

> 这个仓库是**用户主页仓库**（`<用户名>.github.io`），站点挂在域名根路径，所以 `vite.config.ts` 里 `base` 保持默认 `'/'`。**不要**改成 `/jupiter796.github.io/`，否则所有资源 404、页面白屏。

---

## 从 Jekyll 迁移过来（已完成）

本站原本是 Jekyll + [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 主题，迁移已完成：

- 旧站在 **`backup/jekyll-site`** 分支完整保留（本地 + 远程），要回溯随时 `git checkout backup/jekyll-site`。
- `main` 上已移除全部 Jekyll / Chirpy 文件：

  | 类别 | 已删除 |
  |---|---|
  | 配置 | `_config.yml`、`Gemfile`、`.gitmodules`、根级 `.nojekyll`（`public/.nojekyll` 已接替其作用） |
  | 内容 | `_data/`、`_posts/`、`_tabs/`、`_plugins/` |
  | 资源 | `assets/`（含 `assets/lib` submodule → cotes2020/chirpy-static-assets） |
  | 工具 | `tools/`、`.devcontainer/`（Jekyll 镜像）、`.vscode/`（Jekyll 构建任务） |
  | CI | `.github/workflows/pages-deploy.yml`（Chirpy 自带的 Jekyll 部署工作流） |
  | 许可 | `LICENSE`（Chirpy 主题的 MIT，© 2021 Cotes Chung，主题代码已全部移除） |

- 保留了 `.editorconfig`、`.gitattributes`——与框架无关，仍然有用。
- 想恢复某个被删文件：`git checkout HEAD~1 -- <路径>`（或在 `backup/jekyll-site` 分支上找）。

**还需在 GitHub 上手动做一步**：Settings → Pages → **Source** 选 `GitHub Actions`。这一步不做的话，Actions 即使跑成功也不会发布任何东西。

---

## 自定义域名

1. 域名商处加解析：
   - 根域名：4 条 `A` 记录 → `185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153`
   - `www` 或子域：`CNAME` → `jupiter796.github.io`
2. Settings → Pages → Custom domain 填域名
3. 等 DNS 生效后勾选 **Enforce HTTPS**

---

## 常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| Actions 报 `npm ci` 失败 | 仓库里没有 `package-lock.json` | 本地 `npm install` 后把 lockfile 提交上去 |
| 页面白屏、控制台资源 404 | `base` 被改成了 `/jupiter796.github.io/` | 改回默认 `'/'` |
| push 后线上没变化 | Source 还是 `Deploy from a branch` | 改成 `GitHub Actions` |
| 刷新子路由 404 | 纯静态托管没有服务端路由 | workflow 里的 `404.html` 兜底已处理 |
| 想再放些不参与打包的静态文件 | — | 放进 `public/`，会原样复制到 `dist/`，线上路径为 `/文件名` |
| `deploy` 步骤报 `Deployment request failed ... due to in progress deployment` | 之前有一次 deploy job 被中途取消，Pages 的部署记录卡死了（**与代码无关**） | 见下节「部署卡死怎么解」 |

### 部署卡死怎么解

这是 [actions/deploy-pages#22](https://github.com/actions/deploy-pages/issues/22) 记录的已知问题：deploy job 被取消时，连带的取消请求可能失败，导致 Pages 留下一条永远处于 `in progress` 的部署记录，此后**每次部署都会被它挡住**，重试无效。

报错里会点名卡住的那个 commit，例如：

```
Deployment request failed for <新commit> due to in progress deployment.
Please cancel <卡住的commit> first or wait for it to complete.
```

按顺序尝试：

1. **等一下再重跑**。GitHub 侧的缓解最慢约 1 小时生效。Actions → 选失败的 `Deploy Pages` → **Re-run failed jobs**。
2. **切换 Source 强制重建部署状态**（最有效）：Settings → Pages → Source 先改成 `Deploy from a branch`（随便选个分支）并 Save，再改回 `GitHub Actions` 并 Save。这会重置 Pages 的部署状态机。之后重新触发一次 workflow。
3. **用 API 删掉卡死的那条部署**（需要 PAT）：
   ```bash
   # 先列出部署，找到报错里那个 commit 对应的 id
   curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
     "https://api.github.com/repos/Jupiter796/jupiter796.github.io/deployments?per_page=30"
   # 再删除
   curl -X DELETE -H "Authorization: Bearer $GITHUB_TOKEN" \
     "https://api.github.com/repos/Jupiter796/jupiter796.github.io/deployments/<id>"
   ```
4. 还不行就找 GitHub Support。

**预防**：`.github/workflows/deploy.yml` 里必须是 `cancel-in-progress: false`（GitHub 官方 Pages 模板就是 false）。设成 `true` 会在连续推送时取消正在进行的 deploy，正是卡死的成因——本仓库踩过这个坑，已在 2026-09-10 修正。
