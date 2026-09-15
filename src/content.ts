/**
 * 站点的静态文案都集中在这里 —— 改这些内容只动这个文件，不用碰组件。
 *
 * 博客文章不在这个文件里：每篇一个 Markdown 文件，放在仓库根目录的 blogs/，
 * 解析逻辑见 src/posts.ts。
 *
 * 标了 TODO 的地方是占位内容，上线前记得换成你自己的。
 */

export type SocialLink = {
  label: string
  href: string
  /** 鼠标悬停提示 */
  hint: string
  /** 图标，对应 App.tsx 里的 SocialIcon */
  icon: 'github' | 'x' | 'bilibili' | 'instagram' | 'telegram' | 'code'
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

/* ------------------------------------------------------------------ */
/* 个人资料                                                            */
/* ------------------------------------------------------------------ */

export const profile = {
  /** 来自你 GitHub 的显示名 */
  name: 'クローバー',
  handle: 'Jupiter796',
  /** 一句话简介，来自你 GitHub 的 bio */
  tagline: 'Dum spiro, spero.',
  avatar: '/avatar.jpg',
  avatarAlt: 'クローバー 的头像',
  /** 首屏那句稍长一点的自我介绍 */
  intro: '风遇山止，船到岸停',
}

/**
 * 外链按钮。改地址、换图标或加一个都行。
 *
 * TODO：哔哩哔哩 / Instagram / Telegram 三条是**占位用的 mock 地址**，
 * 换成你自己的主页，或者把整条删掉。
 */
export const socialLinks: SocialLink[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/Jupiter796',
    hint: 'github.com/Jupiter796',
    icon: 'github',
  },
  {
    label: 'X',
    href: 'https://x.com/XinZhang423298',
    hint: '@XinZhang423298',
    icon: 'x',
  },
  {
    label: 'bilibili',
    href: 'https://space.bilibili.com/652444279',
    hint: 'bilibili home page',
    icon: 'bilibili',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/zx62462025',
    hint: 'ins home page',
    icon: 'instagram',
  },
  {
    label: 'Telegram',
    href: 'https://t.me/jupiter486',
    hint: '@jupiter486',
    icon: 'telegram',
  },
    {
    label: '本站源码',
    href: 'https://github.com/Jupiter796/jupiter796.github.io',
    hint: 'source code of this site',
    icon: 'code',
  }
]

/** 「关于我」正文，一段一个字符串，加段落直接往数组里塞 */
export const about: string[] = [
  '我是 クローバー，GitHub 上的 Jupiter796。',
  '这个站点是我的个人主页，同时也是我的试验田：用 React 19 + Vite + TypeScript 从零??，push 之后由 GitHub Actions 自动构建并发布到 GitHub Pages。没有后端、没有数据库，纯静态。',
  '平时主要写 TypeScript 和 React，也会用 Node.js 写点小工具。想聊点什么，从上面的链接找我就行。',
]

/** 技能标签 */
export const skills: string[] = [
  'TypeScript',
  'React',
  'Vite',
  'Python',
  'Java',
  'Graph',
  'LLM',
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
