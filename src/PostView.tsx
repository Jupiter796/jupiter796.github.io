import { useEffect, useMemo, useState } from 'react'
import { Marked } from 'marked'
import markedKatex from 'marked-katex-extension'
// KaTeX 的样式（含字体）只在这个 chunk 里加载，首页访客不必下载
import 'katex/dist/katex.min.css'
import { formatPostDate, type Post } from './posts'
import { Link } from './router'

/**
 * 文章详情。这个模块（含 marked 和 KaTeX）由 App 用 lazy() 按需加载，
 * 所以首页访客不会为了数学公式多下载近百 KB。
 */

type Heading = {
  depth: number
  text: string
  id: string
}

/** 从标题文字生成锚点 id，保留中英文和数字 */
function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
  return base || 'section'
}

/**
 * 扫一遍 Markdown 源文，按出现顺序抽出所有标题。
 * 代码块里的 # 不算标题，所以用 inFence 跳过围栏块。
 */
function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = []
  const seen = new Map<string, number>()
  let inFence = false

  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const matched = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!matched) continue

    // 目录里不显示标记符号
    const text = matched[2].replace(/[*`_]/g, '').trim()
    const base = slugify(text)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)

    headings.push({
      depth: matched[1].length,
      text,
      id: count === 0 ? base : `${base}-${count}`,
    })
  }

  return headings
}

/**
 * Markdown -> HTML。
 *
 * - KaTeX 负责数学公式：`$...$` 行内、`$$...$$` 独占一行时块级。
 *   nonStandard: true 让 `$` 前面不必是空格——中文里「公式$E=mc^2$」这种
 *   写法才不会漏掉；代价是正文里真要写美元符号时得转义成 `\$`。
 * - 标题渲染时补上 id，供目录锚点跳转。
 */
function renderMarkdown(markdown: string): { html: string; headings: Heading[] } {
  const headings = extractHeadings(markdown)
  let cursor = 0

  const instance = new Marked()
  instance.use(markedKatex({ throwOnError: false, nonStandard: true }))
  instance.use({
    renderer: {
      heading(token) {
        // 按渲染顺序（也就是文档顺序）取预先算好的 id
        const current = headings[cursor]
        cursor += 1

        const inner = this.parser.parseInline(token.tokens)
        const id = current ? current.id : slugify(token.text)
        return `<h${token.depth} id="${id}">${inner}</h${token.depth}>\n`
      },
    },
  })

  return { html: instance.parse(markdown) as string, headings }
}

/** 文章大纲：点标题跳到锚点，滚动时高亮当前小节 */
function Toc({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState('')
  // 节数多的时候默认折叠，免得目录占满整个首屏
  const [open, setOpen] = useState(headings.length <= 12)

  useEffect(() => {
    const onScroll = () => {
      // 距顶部 120px 那条线以上的最后一个标题，就是当前所在的小节
      let current = ''
      for (const heading of headings) {
        const element = document.getElementById(heading.id)
        if (element && element.getBoundingClientRect().top <= 120) current = heading.id
      }
      setActiveId(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  if (headings.length === 0) return null

  return (
    <details
      className="toc"
      open={open}
      // 受控 + 同步：滚动高亮会频繁重渲染，不这样会把用户展开的状态顶回去
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="toc-title">
        目录
        <span className="toc-count">{headings.length} 节</span>
      </summary>

      <ul className="toc-list">
        {headings.map((heading) => (
          <li key={heading.id} className={`toc-item toc-h${heading.depth}`}>
            {/* 用原生锚点，浏览器自己处理滚动和「复制链接地址」 */}
            <a
              href={`#${heading.id}`}
              className={heading.id === activeId ? 'is-active' : undefined}
              aria-current={heading.id === activeId ? 'location' : undefined}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}

export default function PostView({ post }: { post: Post }) {
  const { html, toc } = useMemo(() => {
    const rendered = renderMarkdown(post.markdown)
    // 目录取「最浅的那一级 + 它下面一级」。
    // 有的文章从 ## 写起，有的（比如论文笔记）拿 # 当大节 —— 都按最浅层级对齐，
    // 大纲层级才跟原文一致；否则用 # 开头的文章会整节从目录里消失。
    const minDepth = rendered.headings.reduce(
      (min, heading) => Math.min(min, heading.depth),
      Number.POSITIVE_INFINITY,
    )
    return {
      html: rendered.html,
      toc: rendered.headings
        .filter((heading) => heading.depth <= minDepth + 1)
        .map((heading) => ({ ...heading, depth: heading.depth - minDepth + 1 })),
    }
  }, [post.markdown])

  // 深链接进来时（/blog/xxx#某标题）正文刚挂载，App 那次滚动还找不到锚点，这里补一次
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    if (!hash) return
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <article className="post">
      <Link className="back" href="/#blog">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            d="M15 5 8 12l7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        返回列表
      </Link>

      <h1>{post.title}</h1>

      <div className="post-meta post-meta-lg">
        <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <span>{post.minutes} 分钟阅读</span>
        {post.draft ? <span className="badge">示例文章</span> : null}
      </div>

      <Toc headings={toc} />

      {/* 正文来自本仓库的 blogs/*.md，是可信内容 */}
      <div className="prose prose-md" dangerouslySetInnerHTML={{ __html: html }} />

      <ul className="chips chips-tight">
        {post.tags.map((tag) => (
          <li key={tag} className="chip chip-sm">
            {tag}
          </li>
        ))}
      </ul>

      <Link className="back back-bottom" href="/#blog">
        看其它文章 →
      </Link>
    </article>
  )
}
