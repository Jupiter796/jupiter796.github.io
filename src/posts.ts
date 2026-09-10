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

// eager + ?raw：构建时就把每个 md 的原文内联进来，运行时不发请求
const files = import.meta.glob('../blogs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** 按日期倒序 */
export const posts: Post[] = Object.entries(files)
  .map(([path, raw]) => {
    const slug = path.split('/').pop()!.replace(/\.md$/, '')
    const { data, content } = parseFrontMatter(raw)

    return {
      slug,
      title: typeof data.title === 'string' ? data.title : slug,
      date: typeof data.date === 'string' ? data.date : '',
      summary: typeof data.summary === 'string' ? data.summary : '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      draft: data.draft === true,
      minutes: estimateMinutes(content),
      markdown: content,
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

export function findPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug)
}
