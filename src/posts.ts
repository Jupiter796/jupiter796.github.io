/**
 * 文章元信息。
 *
 * 正文写在仓库根目录的 blogs/ 里，一个 .md 一个文件。这里只做两件轻量的事：
 * 把原文读进来、解析 Front Matter 抽元信息。
 *
 * **Markdown / 公式的渲染不在这里** —— 那部分会引入 marked 和 KaTeX（体积不小），
 * 放在 src/PostView.tsx 里按需加载，这样首页访客不必下载数学公式渲染器。
 */

export type Post = {
  slug: string
  title: string
  /** YYYY-MM-DD */
  date: string
  summary: string
  tags: string[]
  /** 示例文章，界面上会显示「示例」角标 */
  draft: boolean
  /** 预估阅读时长（分钟） */
  minutes: number
  /** 封面图地址（已解析成可直接用的 URL）；没写或找不到文件时为 undefined */
  cover?: string
  /** 封面图的 alt 文本，缺省回退到 title */
  coverAlt: string
  /** Markdown 原文，交给 PostView 渲染 */
  markdown: string
}

type FrontMatterValue = string | string[] | boolean

/** 支持的最小子集：key: value、key: [a, b]、key: true/false */
function parseFrontMatter(raw: string): { data: Record<string, FrontMatterValue>; content: string } {
  const matched = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!matched) return { data: {}, content: raw }

  const data: Record<string, FrontMatterValue> = {}

  for (const line of matched[1].split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const colon = trimmed.indexOf(':')
    if (colon === -1) continue

    const key = trimmed.slice(0, colon).trim()
    const rawValue = trimmed.slice(colon + 1).trim()

    if (rawValue === 'true' || rawValue === 'false') {
      data[key] = rawValue === 'true'
      continue
    }

    const list = /^\[(.*)\]$/.exec(rawValue)
    if (list) {
      data[key] = list[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      continue
    }

    // 去掉包裹的引号
    data[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }

  return { data, content: raw.slice(matched[0].length) }
}

/** 中文大约 300 字/分钟，代码块和块级公式不计入 */
function estimateMinutes(markdown: string): number {
  const prose = markdown.replace(/```[\s\S]*?```/g, '').replace(/\$\$[\s\S]*?\$\$/g, '')
  const chars = prose.replace(/\s/g, '').length
  return Math.max(1, Math.round(chars / 300))
}

/** '2026-09-10' -> '2026 年 9 月 10 日'；格式不对时返回空串 */
export function formatPostDate(iso: string): string {
  const parts = iso.split('-')
  if (parts.length !== 3) return ''
  return `${parts[0]} 年 ${Number(parts[1])} 月 ${Number(parts[2])} 日`
}

/**
 * 封面图解析。
 *
 * 两种写法都支持：
 *   cover: /covers/hello.jpg          本地图片，放在 public/covers/ 下
 *   cover: https://example.com/a.jpg  站外图片，原样使用
 *
 * 匹配不到的本地路径在开发模式下会 warn 一声，界面上则回退成渐变占位块，
 * 不会出现破图，也不会塌掉一块空白。
 */
function resolveCover(raw: string | undefined): string | undefined {
  if (!raw) return undefined

  const value = raw.trim()
  if (!value) return undefined

  // 外链 / data URL 直接放行，不做本地查找
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value) || value.startsWith('data:')) return value

  // '/covers/a.jpg' / 'covers/a.jpg' / './covers/a.jpg' 归一成 '/covers/a.jpg'
  const key = '/' + value.replace(/\\/g, '/').replace(/^\.?\//, '')
  const found = COVER_FILES[key] ?? COVER_FILES[key.toLowerCase()]

  if (!found && import.meta.env.DEV) {
    console.warn(
      `[posts] 找不到封面图 "${value}"。请把图片放进 public/covers/，` +
        `Front Matter 里写 /covers/文件名；已有文件：${Object.keys(COVER_FILES).join(', ') || '（无）'}`,
    )
  }

  return found
}

// eager + ?raw：构建时就把每个 md 的原文内联进来，运行时不发请求
const files = import.meta.glob('../blogs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// public/covers/ 下的封面图。
//
// 这里两个写法都是踩过坑才定下来的，别改回去：
//   1. glob 必须写**文件相对路径** '../public/covers/*.svg'。写成站内 URL 形式
//      '/covers/*.svg' 时 Vite 在 dev 下会生成一堆空记录 —— 封面全部静默回退成
//      占位块，而且不报任何错，很难查。
//   2. `import: 'default'` 必须带，glob 本身返回 null；另外保留 `query: '?url'`：
//      不带 query 时 public 里的 svg 会走普通 import 解析，文件名带空格或引号的
//      条目（如 'Kelman Filter.svg'）解析失败、整条记录被丢掉。
// 结果是 path -> URL 的映射，path 形如 '../public/covers/a.svg'。
const coverFiles = import.meta.glob('../public/covers/*.{jpg,jpeg,png,webp,avif,gif,svg}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** 键统一成 Front Matter 里写的站内地址，如 '/covers/a.svg' */
const COVER_FILES: Record<string, string> = {}

for (const [path, url] of Object.entries(coverFiles)) {
  // '../public/covers/a.svg' -> '/covers/a.svg'
  COVER_FILES['/' + path.replace(/^.*?public\//, '').replace(/\\/g, '/')] = url
}

/** 按日期倒序 */
export const posts: Post[] = Object.entries(files)
  .map(([path, raw]) => {
    const slug = path.split('/').pop()!.replace(/\.md$/, '')
    const { data, content } = parseFrontMatter(raw)
    const title = typeof data.title === 'string' ? data.title : slug

    return {
      slug,
      title,
      date: typeof data.date === 'string' ? data.date : '',
      summary: typeof data.summary === 'string' ? data.summary : '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      draft: data.draft === true,
      minutes: estimateMinutes(content),
      cover: resolveCover(typeof data.cover === 'string' ? data.cover : undefined),
      coverAlt: typeof data.coverAlt === 'string' && data.coverAlt ? data.coverAlt : title,
      markdown: content,
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

export function findPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug)
}
