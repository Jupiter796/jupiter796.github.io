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

### 改内容

**静态文案**集中在 `src/content.ts`：

```ts
profile       // 名字、handle、一句话简介、头像路径、首屏介绍
socialLinks   // 头部那排外链按钮（icon 见下）
about         // 「关于我」正文，一段一个字符串
skills        // 技能标签
projects      // 项目卡片
```

`socialLinks[].icon` 可选：`'github' | 'x' | 'bilibili' | 'instagram' | 'telegram' | 'code'`。
图标路径在 `src/brand-icons.ts`（取自 simple-icons，24×24），想加新平台就往那个文件里补一条。

**博客文章**每篇一个 Markdown 文件，放在仓库根目录的 `blogs/`：

```markdown
---
title: 文章标题
date: 2026-09-10
summary: 列表里显示的一句话摘要
tags: [随笔, 前端]
draft: true
---

正文用 Markdown 写，GFM 语法可用（表格、删除线、任务列表等）。
```

几个约定：

- **文件名就是 URL**：`blogs/hello-world.md` → `/blog/hello-world`。想改地址就重命名文件（注意大小写会原样带进 URL，`CED.md` 就是 `/blog/CED`）。
- 列表按 Front Matter 里的 `date` 倒序排列，格式固定 `YYYY-MM-DD`。
- Front Matter 只解析最简子集：`key: value`、`key: [a, b]`、`key: true`。
- **新增文章只需往 `blogs/` 里丢一个 `.md`**，不用改任何代码——`src/posts.ts` 用 `import.meta.glob` 自动收集全部 md。
- `draft: true` 会在界面上显示「示例」角标，定稿后删掉这一行即可。
- 项目卡片带 `placeholder: true` 的会显示成虚线占位样式。
- 换头像：替换 `public/avatar.jpg`（现在是 GitHub 头像，460px）。

### 文章大纲与数学公式

**大纲**由正文标题自动生成，取「最浅的那一级 + 它下面一级」，所以既支持从 `##` 写起的文章，也支持拿 `#` 当大节的论文笔记（否则用 `#` 开头的文章会整节从目录里消失）。

- **宽屏（≥1024px）**：大纲在**右侧栏**，`position: sticky` 跟着正文滚动一直可见；超长时自身内部滚动，高亮项会自动跟进到目录可视区内。
- **窄屏**：没有侧栏可用，大纲落在正文上方（标题下方），自身带滚动条，不会把正文顶下去。

点标题跳转（原生锚点，可右键复制链接），滚动时高亮当前小节。为实现右侧栏，文章页整体比首页宽（`--post-maxw`，1060px），顶栏和页脚会跟着一起变宽以便左对齐。

**数学公式**用 [KaTeX](https://katex.org/) 渲染：

| 写法 | 效果 |
| --- | --- |
| `$E = mc^2$` | 行内公式 |
| `$$` 单独占行的 | 块级公式（居中） |

注意两点：

- 出于中文排版考虑开了**宽松匹配**：`$` 前后不加空格也算公式，所以「公式$E=mc^2$」贴着中文写没问题。**代价是正文里要显示美元符号得转义成 `\$`**（反引号里的代码片段不受影响）。
- LaTeX 只有被 `$` 或 `$$` 包起来才会渲染。像 `\boxed{...}` 这样漏了 `$` 的会**原样当文本显示**。

### 目录结构

```
blogs/             # 博客文章，一篇一个 .md
src/
├── content.ts     # 静态文案（改文案动这里）
├── posts.ts       # 读取 blogs/*.md、解析 Front Matter（轻量，进主包）
├── PostView.tsx   # 文章详情：marked + KaTeX，抽目录，**懒加载**
├── router.tsx     # History API 路由 + <Link>
├── brand-icons.ts # 社交图标路径
├── types/         # 类型补丁（见下）
├── App.tsx        # 页面结构
├── useTheme.ts    # 深浅色主题，写进 <html data-theme>
├── index.css      # 全部样式
└── main.tsx       # 入口
```

文章详情被拆成独立 chunk（`lazy()` + `Suspense`），因为 marked + KaTeX 加起来有 300KB 左右：

| | 首页 | 打开文章再加载 |
| --- | --- | --- |
| JS | ~89 KB (gzip) | +92 KB |
| CSS | ~3 KB (gzip) | +8 KB |

也就是说**首页访客不会为了数学公式白白多下载近百 KB**。KaTeX 的字体有 59 个文件，但浏览器只按需取用到的字形。

`src/types/marked-katex-extension.d.ts` 是个类型补丁：那个包把 `types` 指向了未编译的 `src/index.ts`，`tsc` 会连带检查它自己的源码并撞上本项目的 `noUnusedParameters`（`skipLibCheck` 对 `.ts` 源码无效）。上游补上 `.d.ts` 后，这个文件和 `tsconfig.json` 里对应的 `paths` 就可以删掉。

### 路由（路径里不带 #）

用 History API 做前端路由，地址是干净的路径：

| 地址 | 内容 |
| --- | --- |
| `/` | 首页 |
| `/blog/<slug>` | 文章详情 |
| 其它 | 404 页 |

纯静态托管没有服务端路由，所以**直接访问 `/blog/xxx` 依赖 `404.html` 兜底**：workflow 会把 `dist/index.html` 复制成 `dist/404.html`，GitHub Pages 对未知路径返回它，React 启动后再按 `location.pathname` 渲染对应文章。**这个复制步骤不能删**，否则刷新文章页会 404。

> 代价是深链接返回的 HTTP 状态码是 404（页面内容正常显示）。这是 GitHub Pages 上做 SPA 的常规办法；如果要真正的 200，只能改回 hash 路由，或换成支持 rewrites 的托管。

Markdown 由 [`marked`](https://marked.js.org/) 在运行时渲染，md 内容属于你自己仓库的可信文件，所以正文用 `dangerouslySetInnerHTML` 直接注入，没有做 HTML 消毒——**不要在文章里贴来路不明的 HTML**。

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
