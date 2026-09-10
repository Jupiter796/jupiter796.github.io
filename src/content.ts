/**
 * 站点所有文案都集中在这里 —— 改内容只动这个文件，不用碰组件。
 *
 * 标了 TODO 的地方是占位内容，上线前记得换成你自己的。
 */

export type SocialLink = {
  label: string
  href: string
  /** 鼠标悬停提示 */
  hint: string
}

export type Project = {
  title: string
  desc: string
  href: string
  tags: string[]
  /** 主语言，用于渲染一个语言色点 */
  lang?: string
  /** TODO 占位项：把这一行删掉，卡片就会变成正式项目样式 */
  placeholder?: boolean
}

export type Post = {
  slug: string
  title: string
  /** YYYY-MM-DD */
  date: string
  summary: string
  tags: string[]
  /** 正文，一段一个字符串 */
  body: string[]
  /** TODO 示例文章：删掉 draft 就会去掉列表里的「示例」角标 */
  draft?: boolean
}

/* ------------------------------------------------------------------ */
/* 个人资料                                                            */
/* ------------------------------------------------------------------ */

export const profile = {
  /** 来自你 GitHub 的显示名 */
  name: 'クローバー',
  handle: 'Jupiter796',
  /** 一句话简介，来自你 GitHub 的 bio */
  tagline: 'Just be simple',
  avatar: '/avatar.jpg',
  avatarAlt: 'クローバー 的头像',
  /** 首屏那句稍长一点的自我介绍 */
  intro: '把复杂的问题拆成简单的部分，再一个一个解决。',
}

/** 外链按钮。改地址或加一个都行 */
export const socialLinks: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/Jupiter796', hint: 'github.com/Jupiter796' },
  {
    label: '本站源码',
    href: 'https://github.com/Jupiter796/jupiter796.github.io',
    hint: '这个站点的源代码',
  },
  { label: 'X / Twitter', href: 'https://x.com/XinZhang423298', hint: '@XinZhang423298' },
]

/** 「关于我」正文，一段一个字符串，加段落直接往数组里塞 */
export const about: string[] = [
  '我是 クローバー，GitHub 上的 Jupiter796。座右铭是「Just be simple」——先把复杂的问题拆成足够小的部分，再一个一个解决。',
  '这个站点是我的个人主页，同时也是我的试验田：用 React 19 + Vite + TypeScript 从零手写，push 之后由 GitHub Actions 自动构建并发布到 GitHub Pages。没有后端、没有数据库，纯静态。',
  '平时主要写 TypeScript 和 React，也会用 Node.js 写点小工具。想聊点什么，从上面的链接找我就行。',
]

/** 技能标签 */
export const skills: string[] = [
  'TypeScript',
  'React',
  'Vite',
  'Node.js',
  'CSS',
  'Git',
  'GitHub Actions',
]

/* ------------------------------------------------------------------ */
/* 项目                                                               */
/* ------------------------------------------------------------------ */

export const projects: Project[] = [
  {
    title: 'jupiter796.github.io',
    desc: '你正在看的这个站点。React 19 + Vite + TypeScript 手写的单页主页，push 后自动构建、部署到 GitHub Pages。',
    href: 'https://github.com/Jupiter796/jupiter796.github.io',
    tags: ['React 19', 'Vite', 'TypeScript', 'GitHub Actions'],
    lang: 'TypeScript',
  },
  {
    title: '项目二',
    desc: 'TODO：一句话说清它在解决什么问题，以及你负责了哪一部分。',
    href: 'https://github.com/Jupiter796',
    tags: ['占位'],
    placeholder: true,
  },
  {
    title: '项目三',
    desc: 'TODO：一句话说清技术栈和你做的贡献，最好带上能看的 demo 地址。',
    href: 'https://github.com/Jupiter796',
    tags: ['占位'],
    placeholder: true,
  },
]

/* ------------------------------------------------------------------ */
/* 博客                                                               */
/* ------------------------------------------------------------------ */

/** 列表按 date 倒序展示 */
export const posts: Post[] = [
  {
    slug: 'hello-world',
    title: '开始写点什么',
    date: '2026-09-10',
    summary: '开通这个博客的第一篇：在满地都是写作平台的今天，为什么还要自己搭一个站。',
    tags: ['随笔'],
    draft: true,
    body: [
      'TODO：这是占位正文，把 src/content.ts 里这篇的 body 换成你自己的文字就行。',
      '自建博客最大的好处是数据完全属于自己：文章就是仓库里的一组字符串，没有平台会突然关停，也没有编辑器绑架你的格式。',
      '坏处当然也有——没有评论区，没有推荐流量，写完大概率只有自己看。不过对一个用来整理思路的地方来说，这算不上问题。',
      '所以就这样开始了。写点踩坑记录、写点工具心得，也写点纯粹的想法。',
    ],
  },
  {
    slug: 'why-vite-over-jekyll',
    title: '把站点从 Jekyll 换成了 Vite',
    date: '2026-09-08',
    summary: '原来的 Jekyll + Chirpy 主题其实够用，但我更想要一个能随手写 React 的地方。',
    tags: ['前端', 'Vite'],
    draft: true,
    body: [
      'TODO：这是占位正文，换成你自己的内容。',
      'Jekyll 的问题不在于不好，而在于它是一套「你要按它的规矩来」的系统：目录结构、Front Matter、Liquid 语法，每一样都得单独学一遍。',
      '换成 Vite 之后整个站点就是一个普通的 React 项目：想加一个组件就加一个组件，想要构建优化就改 vite.config.ts，心智负担几乎为零。',
      '代价是原本主题白送的东西——文章列表、分页、标签页——都得自己写。不过这些逻辑加起来也就几百行，写着写着反而更清楚站点在做什么。',
    ],
  },
  {
    slug: 'github-pages-actions-notes',
    title: 'GitHub Pages 用 Actions 部署踩过的坑',
    date: '2026-09-05',
    summary: 'Source 必须选 GitHub Actions，vite 的 base 不能乱改，concurrency 千万别设成 true。',
    tags: ['CI/CD', 'GitHub Pages'],
    draft: true,
    body: [
      'TODO：这是占位正文，换成你自己的内容。',
      '第一个坑：Pages 的 Source 必须选「GitHub Actions」。如果选的是「Deploy from a branch」，GitHub 会把仓库原始文件直接当站点发布，于是线上打开的是一份引用 /src/main.tsx 的源码 index.html，浏览器执行不了 TypeScript，页面就是一片白。',
      '第二个坑：这是用户主页仓库，站点挂在域名根路径，所以 vite.config.ts 里的 base 必须保持 /。一旦改成 /jupiter796.github.io/，所有资源都会 404。',
      '第三个坑：workflow 里的 concurrency 要设成 cancel-in-progress: false。设成 true 时，连续 push 会取消正在进行的 deploy，被取消的部署会在 Pages 侧留下一条永远 in-progress 的记录，之后每次部署都被它挡住。',
    ],
  },
]
