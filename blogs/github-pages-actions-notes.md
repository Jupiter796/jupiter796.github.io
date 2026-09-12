---
title: GitHub Pages 用 Actions 部署踩过的坑
date: 2026-08-29
summary: Source 必须选 GitHub Actions，vite 的 base 不能乱改，concurrency 千万别设成 true。
tags: [CI/CD, GitHub Pages]
draft: true
---

把站点迁到 Vite 之后，部署这块连着踩了几个坑，记一下。

## 坑一：Source 选错，页面白屏

这是最坑的一个。Pages 的 **Source** 有两个选项：

- `Deploy from a branch` —— 把分支里的**原始文件**直接当站点发布
- `GitHub Actions` —— 只发布你上传的 artifact

如果选的是前者，GitHub 会把仓库根目录原样发出去。于是线上打开的是那份源码 `index.html`，而它引用的是：

```html
<script type="module" src="/src/main.tsx"></script>
```

浏览器根本执行不了 `.tsx`，`<div id="root">` 一直是空的，**页面就是一片白**。

更糟的是，`package.json`、`vite.config.ts` 这些文件也全都暴露在公网上了。

自查方法很简单——看看构建产物里**本不该存在**的文件能不能访问：

```bash
curl -o /dev/null -w '%{http_code}\n' https://example.github.io/package.json
# 200 => 正在跑分支发布，配置错了
# 404 => 正常
```

## 坑二：base 改错，资源全 404

这是**用户主页仓库**（形如 `<用户名>.github.io`），站点挂在域名根路径。所以 `vite.config.ts` 里的 `base` 必须保持默认：

```ts
export default defineConfig({
  plugins: [react()],
  // base 保持默认 '/'，不要改成 '/jupiter796.github.io/'
})
```

一旦改成子路径，所有资源请求都会 404，页面同样白屏。区别是这次控制台会明确报错，比坑一好排查。

判断方法：仓库名是否等于 `<用户名>.github.io`。是的话就是根路径，不是的话才需要配 `base`。

## 坑三：concurrency 设成 true 会锁死部署

`actions/deploy-pages` 有个已知问题（[actions/deploy-pages#22](https://github.com/actions/deploy-pages/issues/22)）：deploy job 被中途取消时，Pages 侧会留下一条永远处于 `in-progress` 的部署记录，此后**每次部署都被它挡住**，重试也没用。

报错长这样：

```text
Deployment request failed for <新commit> due to in progress deployment.
```

所以 workflow 里必须是：

```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```

设成 `true` 时，连续 push 会取消正在进行的 deploy，正好触发这个 bug。

## 小结

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 白屏，且能直接访问到源码文件 | Source 是 `Deploy from a branch` | 改成 `GitHub Actions` |
| push 后线上没动静 | workflow 没提交进仓库 | 确认远端有 `.github/workflows/deploy.yml` |
| `npm ci` 失败 | 仓库里没有 `package-lock.json` | 把 lockfile 提交上去 |
| 白屏，控制台资源 404 | `base` 被改成了子路径 | 改回默认 `'/'` |
| 刷新子路由 404 | 纯静态托管没有服务端路由 | 用 `404.html` 兜底 |

这几个坑里，**坑一**最值得注意：它的报错方式不是报错，而是安静地给你一个白屏页面。
