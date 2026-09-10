---
title: 把站点从 Jekyll 换成了 Vite
date: 2026-09-08
summary: 原来的 Jekyll + Chirpy 主题其实够用，但我更想要一个能随手写 React 的地方。
tags: [前端, Vite]
draft: true
---

这个站最早是 Jekyll + [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 主题搭的，用了挺长时间，其实一直够用。换掉它不是因为不能用，而是因为**心智负担**。

## Jekyll 的问题

Jekyll 不是不好，它是「你必须按它的规矩来」的那类系统：

- 目录结构是约定死的，`_posts/`、`_data/`、`_tabs/` 各管各的
- 每篇文章都要写 Front Matter
- 模板要学 Liquid 语法，而 Liquid 的调试体验相当原始——写错了通常就是白屏，没有报错
- 想加一点交互？得绕一大圈塞 JavaScript

更麻烦的是依赖。`Gemfile`、`bundle install`、Ruby 版本……为了改个样式去折腾一遍 Ruby 环境，时间全花在工具链上了。

## 换成 Vite 之后

整个站点变成了一个普通的 React 项目：

```bash
npm install
npm run dev      # 本地开发
npm run build    # 产物输出到 dist/
```

想加一个组件就加一个组件，想改构建就动 `vite.config.ts`。原本需要查文档才能做的几件事，现在都是顺手就写：

```ts
// 主题切换：真就是十行
const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? readSystemTheme())

useEffect(() => {
  document.documentElement.dataset.theme = theme
}, [theme])
```

## 代价

主题白送的东西都得自己写：文章列表、标签、分页、主题切换。不过这些逻辑加起来也就几百行，写着写着反而更清楚站点到底在做什么。

| 方面 | Jekyll | Vite |
| --- | --- | --- |
| 语言 | Ruby + Liquid | TypeScript |
| 本地启动 | `bundle exec jekyll serve` | `npm run dev` |
| 加交互 | 绕 | 直接写 |
| 主题生态 | 现成主题多 | 要自己搭 |

## 结论

如果你只是想要一个能写字的博客，Jekyll 加上现成主题是更省事的选择。但如果你本来就会写前端，而且想让站点变成自己的试验田，Vite 这条路会更舒服。

> 换不换不重要，重要的是知道自己在为什么付费——无论是用时间付费，还是用灵活性付费。
