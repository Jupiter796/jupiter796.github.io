# AGENT.md

给在这个仓库里干活的 AI 编码代理看的说明书。人类读者请看 `README.md`（那份是面向使用者/部署的），这份是面向「改代码」的。

## 这是什么项目

个人主页 + 博客，**纯静态单页应用，没有后端、没有数据库、没有评论系统**。

- 技术栈：React 19 + Vite + TypeScript（`strict`），Markdown 由 `marked` 运行时渲染，数学公式由 `katex` 渲染。
- 线上地址：<https://jupiter796.github.io/>，push 到 `main` 后由 GitHub Actions 构建并部署到 GitHub Pages。
- 这是一个**用户主页仓库**（`<用户名>.github.io`），站点挂在域名根路径。

## 命令

```bash
npm install        # 依赖装不上时见文末「网络受限」
npm run dev        # 开发服务器，默认 http://localhost:5173
npm run build      # tsc --noEmit && vite build，产物在 dist/
npm run preview    # 预览 dist/ 的构建结果
npm run typecheck  # 只做类型检查
```

**没有 lint / format 脚本**，也没有测试框架。改完代码的最低验证标准是 `npm run typecheck` 通过，功能类改动再跑一次 `npm run build`。

## 硬性约束（改错了线上就炸）

1. **`vite.config.ts` 里的 `base` 保持默认 `'/'`**。这是用户主页仓库，站点在根路径。改成 `/jupiter796.github.io/` 会让所有资源 404、页面白屏。
2. **`.github/workflows/deploy.yml` 里「复制 `dist/index.html` 为 `dist/404.html`」这一步不能删**。纯静态托管没有服务端路由，删掉后刷新 `/blog/xxx` 会真 404。
3. **Pages 的 Source 必须是 `GitHub Actions`**，不能是 `Deploy from a branch`（后者会把仓库源码当站点发布，既白屏又泄露源码）。这是仓库设置，不是文件，排错时先确认它。
4. **`package-lock.json` 必须提交**，Actions 里跑的是 `npm ci`。
5. **Actions 部署发布的只有 artifact（`dist/`）的内容**，仓库里的文件不会被直接发布。

## 内容放哪里

| 想改的东西 | 位置 | 说明 |
| --- | --- | --- |
| 静态文案（名字、社交链接、关于我、技能、项目卡片） | `src/content.ts` | 全部集中在这一个文件，改文案不用碰组件 |
| 博客文章 | 仓库根目录 `blogs/*.md` | 一篇一个文件，文件名即 URL slug |
| 头像 / favicon / 封面等免打包静态资源 | `public/` | 原样复制进 `dist/`，线上路径为 `/文件名` |

**新增文章不需要改任何代码**：`src/posts.ts` 用 `import.meta.glob('../blogs/*.md', { query: '?raw', eager: true })` 在构建时收集全部 md。

Front Matter 只支持最简子集：`key: value`、`key: [a, b]`、`key: true/false`。当前字段：

```yaml
---
title: 文章标题
date: 2026-09-10        # 必须 YYYY-MM-DD，列表按它倒序
summary: 列表里显示的一句话摘要
tags: [随笔, 前端]
draft: true             # 界面上显示「示例」角标，定稿后删掉
cover: /covers/xxx.jpg  # 可选，见下
coverAlt: 封面描述       # 可选，缺省时回退到 title
---
```

### 封面图（cover）

- `cover` 二选一：**本地图片**写在 `public/covers/` 下，Front Matter 里写 `/covers/文件名`；或者直接写 `https://…` 外链。`coverAlt` 可选，缺省回退到 `title`。
- 解析逻辑在 `resolveCover()`（`src/posts.ts`）：外链原样返回；本地路径在 `COVER_FILES` 里查（先精确匹配再忽略大小写）；查不到时开发模式 `console.warn`，界面回退成渐变占位块——**不会渲染成破图**。
- **glob 的写法有坑，已被踩过两次，改之前先读 `src/posts.ts` 里的注释**：必须是文件相对路径 `'../public/covers/*.svg'` + `import: 'default'`。写成站内 URL 形式 `'/covers/*.svg'` 时 Vite 会生成一堆空记录，封面全部静默回退占位块且不报错。
- 呈现：列表左侧 3:2 缩略图（≤640px 改成整幅 16:9）；文章页正文上方 21:9 大图。
- 没有 `cover` 字段的文章显示渐变占位封面，列表布局不会塌。

## 代码结构

```
blogs/              # 文章源文件（.md）
public/             # 免打包静态资源（covers/ 放封面）
src/
├── content.ts      # 静态文案
├── posts.ts        # 读 blogs/*.md、解析 Front Matter、解析封面、算阅读时长（轻量，在主包里）
├── Cover.tsx       # 封面图组件：加载/失败/没有封面三种情况的兜底
├── PostView.tsx    # 文章详情：marked + KaTeX + 目录，**懒加载**
├── AboutSection.tsx # 「关于我」区块：首页和鲜花页共用（改文案只改 content.ts）
├── Romance.tsx     # 浪漫页 /romance 的内容与版式，**懒加载**
├── romance-canvas.tsx # 浪漫页的星空 canvas（手写粒子，无第三方库）
├── Flowers.tsx     # 鲜花页 /flowers 的内容与按钮，**懒加载**
├── flowers-canvas.tsx # 鲜花页的花束：全部几何现算，无图片、无素材、无绘图库
├── App.tsx         # 首页结构（首屏/关于/项目/博客列表）+ 路由分发
├── router.tsx      # History API 路由 + <Link>
├── useTheme.ts     # 深浅色主题，写进 <html data-theme>
├── brand-icons.ts  # 社交图标路径（simple-icons，24×24）
├── index.css       # 全部样式，无 CSS Modules、无 Tailwind
├── types/          # 类型补丁（marked-katex-extension）
└── main.tsx        # 入口
```

### 关键取舍，别随手改掉

- **文章详情是独立 chunk**。`marked` + `katex`（含 CSS）约 300KB，`App.tsx` 用 `lazy()` + `Suspense` 把它拆出去，所以**首页访客不会为数学公式白白多下载近百 KB**。往主包里塞重依赖前先想清楚这一点；反过来，往 `PostView.tsx` 或它下游加东西是安全的。
- **路由是 History API，路径里不带 `#`**：`/`、`/blog/<slug>`、`/romance`、`/flowers`、其它 404。新增页面要在 `router.tsx` 的 `parsePath()` 里加分支，并且记得 `404.html` 兜底（纯静态托管靠它把深链接交回给前端路由）。`/romance` 和 `/flowers` 走「自带顶栏与页脚」的独立分支，加新页面时照抄这个结构。
- **样式只有 `src/index.css` 一个文件**，用 CSS 变量做主题（`:root` 深色默认，`:root[data-theme='light']` 覆盖）。加颜色请用变量，不要写死色值，否则浅色模式会瞎。
  - 例外：**浪漫页 `/romance` 另起了一套 `--ro-*` 变量**（定义在 `.shell-romance` 上），因为它要的是「夜空蓝紫 → 粉白 + 金」，首页那套蓝紫在浅色主题下太寡淡。浅色主题走 `.shell-romance[data-ro-theme='dawn']`。
  - **给标题之类的元素加颜色/渐变时注意特异度**：全局有 `h1, h2, h3 { color: var(--text-strong) }`（特异度 0,0,1）。`.romance-title`（0,1,0）本来能赢，但**同特异度的规则靠源码顺序决胜** —— 一旦有别的规则和它打平，就会被那个纯白 color 顶掉。浪漫页标题因此写成 `.shell-romance .romance-title`，别简化回去。
- **主题闪一下的问题已经处理过**：`index.html` 里有一段内联脚本在首次绘制前设置 `data-theme`，改主题逻辑时别破坏它（要和 `useTheme.ts` 保持一致，localStorage 键是 `jupiter796-theme`）。
- **Markdown 正文用 `dangerouslySetInnerHTML` 直接注入，没有做 HTML 消毒**，因为内容来自本仓库、视为可信。**不要**把这段改成渲染用户输入，除非同时引入消毒。
- 组件里没有状态管理库，`useTheme` 之外的状态都是组件内的 `useState`/`useEffect`。
- **动画要自己处理降级**：两个 canvas 页面都会读 `prefers-reduced-motion`（开了就画静态一帧、不启动 rAF），并在标签页隐藏时停掉动画、用 `ResizeObserver` 跟随尺寸重建。新增动效请沿用这套（CSS 侧统一在 `@media (prefers-reduced-motion: reduce)` 里兜底）。
- **Canvas 动画的三条硬规矩**（`flowers-canvas.tsx` 踩出来的，别再犯）：
  1. **首帧先同步画一帧「完成态」**，别把首次绘制交给 rAF。rAF 在后台标签页、省电模式、无头浏览器里会被节流甚至完全冻结，只在 rAF 里画的结果就是一片空白。
  2. **确认「时间真的在走」之后再播动画**。某些环境 rAF 只被调用几帧且时间戳完全相同（`dt` 恒为 0），进度会永远停在起点，并且一帧帧把首帧画好的内容擦成空背景。`flowers-canvas.tsx` 的做法是先空转两帧探路，时间不走就停在完成态。
  3. 排查「画布空白」先看 canvas 上的 `data-growth` / `data-frames` / `data-stage`（绘制阶段崩溃会写成 `failed:<阶段名>`，并在画布左上角糊一块红），比盯着配色猜快得多。另外 `/flowers?still=1` 只渲染确定的一帧（无摇曳抖动），适合截图与视觉比对。

## 风格约定

- 代码注释、界面文案、文档**一律中文**；变量名、函数名英文。
- TS 开了 `strict` + `noUnusedLocals` + `noUnusedParameters`，未使用的导入/参数会直接构建失败。
- 组件是函数组件，没有用 `React.FC`；文件名：组件 `PascalCase.tsx`，工具模块 `camelCase.ts`。
- 注释解释「**为什么**」而不是复述代码；仓库现有注释密度较高，跟住这个风格。
- 没有引入任何 UI 组件库或图标库（社交图标是手写在 `src/brand-icons.ts` 里的 SVG path）。加依赖前先掂量体积。

## Git 与部署

- 分支 `main`，commit message 用 `feat(blog):` / `fix(post):` / `chore(deploy):` 这类前缀（中英混合的历史都在，别纠结）。
- **不要擅自 `git commit` / `git push`**，除非用户明确要求。改完文件后 `git status` 保持干净可读即可。
- 部署是自动的：push 到 `main` → Actions 构建 → 发布。**没有手动部署步骤**；本地 `dist/` 是构建产物，已被 `.gitignore` 忽略。

## 已知坑 / 排错

- **线上白屏且能公网访问到 `package.json`、`/src/main.tsx`** → Pages 的 Source 是 `Deploy from a branch`，改回 `GitHub Actions`。
- **刷新子路由 404** → workflow 里的 `404.html` 兜底步骤被删了。
- **深链接文章页返回的 HTTP 状态码是 404**（内容正常显示）。这是 GitHub Pages 上做 SPA 的常规代价，不是 bug；要真 200 只能改回 hash 路由或换托管。
- `src/types/marked-katex-extension.d.ts` 是类型补丁：上游包把 `types` 指向未编译的 `src/index.ts`，`tsc` 会连它的源码一起检查并撞上本项目的 `noUnusedParameters`。上游修好后这个文件和 `tsconfig.json` 里的 `paths` 可以一起删。
- 首屏头像 `public/avatar.jpg` 目前是 GitHub 头像（460px）。

## 本机网络环境（受限）

- `registry.npmjs.org`、`api.github.com`、`codeload.github.com` 可直连。
- **`github.com` 是 SNI 层阻断**（TCP 通、TLS 握手卡死，DNS 还可能返回假地址 `198.51.45.8`），所以 `git push` 走默认 HTTPS 会一直挂着。用 **SSH over 443**：`Host github.com` → `HostName ssh.github.com` / `Port 443` / `User git`，或给 git 配本地代理 `http://127.0.0.1:7890`。
- npm 写默认缓存可能 `EPERM`，用 `npm install --cache ./.npm-cache`（该目录已 gitignore）。
