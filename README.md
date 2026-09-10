# jupiter796.github.io

个人主页，React 19 + Vite + TypeScript，通过 GitHub Actions 构建并部署到 GitHub Pages。

线上地址：<https://jupiter796.github.io/>

---

## 本地开发

```bash
npm install
npm run dev        # 开发服务器 http://localhost:5173
npm run build      # 类型检查 + 构建，产物输出到 dist/
npm run preview    # 本地预览 dist/ 的构建结果
npm run typecheck  # 只做类型检查，不产出文件
```

构建产物结构：

```
dist/
├── .nojekyll                      # 来自 public/，告诉 Pages 不要走 Jekyll 处理
├── avatar.jpg                     # 头像，来自 public/
├── favicon.svg                    # 站标，来自 public/
├── index.html
└── assets/
    ├── index-<hash>.js
    └── index-<hash>.css
```

### 改内容只动一个文件

站点的全部文案——名字、简介、关于我、技能、社交链接、项目、博客文章——都集中在 **`src/content.ts`**，改内容不需要碰任何组件。

```ts
profile       // 名字、handle、一句话简介、头像路径、首屏介绍
socialLinks   // 头部那排外链按钮
about         // 「关于我」正文，一段一个字符串
skills        // 技能标签
projects      // 项目卡片
posts         // 博客文章（标题 / 日期 / 摘要 / tags / body）
```

几个约定：

- `posts` 按 `date` 倒序展示，日期格式固定 `YYYY-MM-DD`。
- 文章正文是**段落数组**（`body: string[]`），一段一个字符串，不是 Markdown。
- 项目或文章上带 `placeholder` / `draft: true` 的，界面上会显示「占位 / 示例」角标，提醒你还没换掉；改完内容把这两个字段删掉即可。
- 换头像：替换 `public/avatar.jpg`（现在是 GitHub 头像，460px）。

### 目录结构

```
src/
├── content.ts     # 全部文案（改内容只动这里）
├── App.tsx        # 页面结构与 hash 路由（首页 / #/blog/<slug>）
├── useTheme.ts    # 深浅色主题，写进 <html data-theme>
├── index.css      # 全部样式
└── main.tsx       # 入口
```

主题切换是纯前端行为，偏好存在 `localStorage` 的 `jupiter796-theme`；`index.html` 里有一段内联脚本，在首次绘制前就把主题定下来，避免浅色用户先看到一帧深色。

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

### 排错：线上白屏、看不到内容

最常见的原因是 **Pages 的 Source 被设成了 `Deploy from a branch`**。此时 GitHub 会把仓库里的**原始文件**直接当站点发布，于是在线打开的是一份**源码版 `index.html`**——它引用的是 `/src/main.tsx`，浏览器无法执行 `.tsx`，`#root` 始终为空，页面就是白的（同时仓库源码、`package.json` 等都会暴露在公网）。

自查：构建产物里**本不该存在**的文件如果能公网访问，就说明跑的是分支发布。

```bash
curl -o /dev/null -w '%{http_code}\n' https://jupiter796.github.io/package.json
# 200 = 正在跑分支发布（错误状态）；404 = 正常（只发布了 dist/ 的内容）

curl -o /dev/null -w '%{http_code}\n' https://jupiter796.github.io/dist/index.html
# 404 = 构建产物没被部署
```

处理：把 Source 改成 `GitHub Actions`，并确保 `.github/workflows/deploy.yml` 已经提交到远端（workflow 不推送上去，Actions 永远不会触发），然后推送一次或到 Actions 页面手动 `Run workflow`。

| 现象 | 原因 | 处理 |
|---|---|---|
| 白屏，且能直接访问到源码文件 | Source 是 `Deploy from a branch` | 改成 `GitHub Actions` |
| push 后线上没动静 | workflow 没提交进仓库，或 Source 不是 Actions | 确认远端存在 `.github/workflows/deploy.yml` |
| Actions 报 `npm ci` 失败 | 仓库里没有 `package-lock.json` | 本地 `npm install` 后把 lockfile 提交上去 |
| 白屏、控制台资源 404 | `base` 被改成了 `/jupiter796.github.io/` | 改回默认 `'/'` |
| 刷新子路由 404 | 纯静态托管没有服务端路由 | workflow 里的 `404.html` 兜底已处理 |
| 想放不参与打包的静态文件 | — | 放进 `public/`，会原样复制到 `dist/`，线上路径为 `/文件名` |
