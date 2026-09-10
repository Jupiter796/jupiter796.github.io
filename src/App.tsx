import { useEffect, useMemo, useState } from 'react'
import {
  about,
  posts,
  profile,
  projects,
  skills,
  socialLinks,
  type Post,
} from './content'
import { useTheme, type Theme } from './useTheme'

/* ------------------------------------------------------------------ */
/* 小工具                                                             */
/* ------------------------------------------------------------------ */

/** '2026-09-10' -> '2026 年 9 月 10 日' */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
}

/** 按中文 300 字/分钟粗估阅读时长 */
function readingMinutes(body: string[]): number {
  const chars = body.join('').replace(/\s/g, '').length
  return Math.max(1, Math.round(chars / 300))
}

/** 项目卡片上的语言色点 */
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Go: '#00add8',
  Rust: '#dea584',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
}

const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date))

/* ------------------------------------------------------------------ */
/* hash 路由                                                          */
/* ------------------------------------------------------------------ */
// #/            首页
// #/blog/<slug> 文章详情
// #about        普通锚点，不参与路由，交给滚动处理

type Route = { name: 'home' } | { name: 'post'; slug: string }

function parseHash(hash: string): Route {
  const matched = /^#\/blog\/(.+)$/.exec(hash)
  return matched ? { name: 'post', slug: decodeURIComponent(matched[1]) } : { name: 'home' }
}

function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return useMemo(() => parseHash(hash), [hash])
}

/* ------------------------------------------------------------------ */
/* 通用小组件                                                          */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { href: '#about', label: '关于' },
  { href: '#projects', label: '项目' },
  { href: '#blog', label: '博客' },
]

function ThemeIcon({ theme }: { theme: Theme }) {
  return theme === 'dark' ? (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <circle cx="12" cy="12" r="4.1" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5" />
      </g>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.7 8.7 0 1 0 10.8 10.8Z" fill="currentColor" />
    </svg>
  )
}

function SectionHeading({ index, title, note }: { index: string; title: string; note?: string }) {
  return (
    <div className="section-head">
      <span className="section-index" aria-hidden="true">
        {index}
      </span>
      <h2>{title}</h2>
      {note ? <span className="section-note">{note}</span> : null}
    </div>
  )
}

function Chip({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return <li className={small ? 'chip chip-sm' : 'chip'}>{children}</li>
}

/* ------------------------------------------------------------------ */
/* 首屏                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <header className="hero">
      <img
        className="avatar"
        src={profile.avatar}
        alt={profile.avatarAlt}
        width={112}
        height={112}
        loading="eager"
      />

      <div className="hero-body">
        <p className="eyebrow">个人主页</p>
        <h1>{profile.name}</h1>
        <p className="tagline">{profile.tagline}</p>
        <p className="intro">{profile.intro}</p>

        <ul className="socials">
          {socialLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer" title={link.hint}>
                {link.label}
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                  <path
                    d="M7 17 17 7M9 7h8v8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* 各区块                                                             */
/* ------------------------------------------------------------------ */

function AboutSection() {
  return (
    <section id="about" className="section">
      <SectionHeading index="01" title="关于我" />
      <div className="prose">
        {about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <h3 className="subhead">常用技术</h3>
      <ul className="chips">
        {skills.map((skill) => (
          <Chip key={skill}>{skill}</Chip>
        ))}
      </ul>
    </section>
  )
}

function ProjectsSection() {
  return (
    <section id="projects" className="section">
      <SectionHeading index="02" title="项目" note={`${projects.length} 个`} />
      <div className="grid">
        {projects.map((project) => (
          <a
            className={project.placeholder ? 'card card-placeholder' : 'card'}
            key={project.title}
            href={project.href}
            target="_blank"
            rel="noreferrer"
          >
            <div className="card-top">
              <h3>{project.title}</h3>
              {project.lang ? (
                <span className="lang">
                  <span
                    className="lang-dot"
                    style={{ background: LANG_COLORS[project.lang] ?? '#8b93a7' }}
                  />
                  {project.lang}
                </span>
              ) : null}
            </div>

            <p className="card-desc">{project.desc}</p>

            <ul className="chips chips-tight">
              {project.tags.map((tag) => (
                <Chip key={tag} small>
                  {tag}
                </Chip>
              ))}
            </ul>
          </a>
        ))}
      </div>
    </section>
  )
}

function BlogSection() {
  return (
    <section id="blog" className="section">
      <SectionHeading index="03" title="博客" note={`${sortedPosts.length} 篇`} />
      <ul className="post-list">
        {sortedPosts.map((post) => (
          <li key={post.slug}>
            <a className="post-row" href={`#/blog/${post.slug}`}>
              <div className="post-meta">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span className="sep" aria-hidden="true">
                  ·
                </span>
                <span>{readingMinutes(post.body)} 分钟</span>
                {post.draft ? <span className="badge">示例</span> : null}
              </div>
              <h3>{post.title}</h3>
              <p className="post-summary">{post.summary}</p>
              <ul className="chips chips-tight">
                {post.tags.map((tag) => (
                  <Chip key={tag} small>
                    {tag}
                  </Chip>
                ))}
              </ul>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 文章详情                                                           */
/* ------------------------------------------------------------------ */

function PostView({ post }: { post: Post }) {
  return (
    <article className="post">
      <a className="back" href="#/blog">
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
      </a>

      <h1>{post.title}</h1>

      <div className="post-meta post-meta-lg">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <span>{readingMinutes(post.body)} 分钟阅读</span>
        {post.draft ? <span className="badge">示例文章</span> : null}
      </div>

      <div className="prose">
        {post.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <ul className="chips chips-tight">
        {post.tags.map((tag) => (
          <Chip key={tag} small>
            {tag}
          </Chip>
        ))}
      </ul>

      <a className="back back-bottom" href="#/blog">
        看其它文章 →
      </a>
    </article>
  )
}

function NotFound() {
  return (
    <div className="notfound">
      <p className="notfound-code">404</p>
      <h1>没有这篇文章</h1>
      <p className="muted">链接可能过期了，或者 slug 写错了。</p>
      <a className="back" href="#/blog">
        返回文章列表
      </a>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 页面                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const route = useRoute()
  const { theme, toggleTheme } = useTheme()

  const activePost = route.name === 'post' ? posts.find((p) => p.slug === route.slug) : undefined

  // 标题跟着路由走
  useEffect(() => {
    document.title = activePost
      ? `${activePost.title} · ${profile.name}`
      : `${profile.name} · ${profile.tagline}`
  }, [activePost])

  // 换页 / 锚点滚动
  useEffect(() => {
    if (route.name === 'post') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    // 首页锚点：浏览器的自动滚动发生在 React 渲染之前，这里补一次
    const id = window.location.hash.replace(/^#\/?/, '')
    if (!id) return
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [route, activePost])

  const isPostMissing = route.name === 'post' && !activePost

  return (
    <div className="shell">
      <div className="backdrop" aria-hidden="true" />

      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#/">
            <span className="brand-dot" aria-hidden="true" />
            {profile.name}
          </a>

          <nav className="nav" aria-label="页面导航">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </header>

      <main className="main">
        {isPostMissing ? (
          <NotFound />
        ) : activePost ? (
          <PostView post={activePost} />
        ) : (
          <>
            <Hero />
            <AboutSection />
            <ProjectsSection />
            <BlogSection />
          </>
        )}
      </main>

      <footer className="footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <span>React 19 + Vite + TypeScript</span>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <span>由 GitHub Actions 自动构建部署</span>
      </footer>
    </div>
  )
}
