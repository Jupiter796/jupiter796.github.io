import { useEffect, useSyncExternalStore } from 'react'
import {
  about,
  profile,
  projects,
  skills,
  socialLinks,
  type SocialLink,
} from './content'
import { findPost, posts, type Post } from './posts'
import { useTheme, type Theme } from './useTheme'

/* ------------------------------------------------------------------ */
/* 小工具                                                             */
/* ------------------------------------------------------------------ */

/** '2026-09-10' -> '2026 年 9 月 10 日'；日期缺失时返回空串 */
function formatDate(iso: string): string {
  const parts = iso.split('-')
  if (parts.length !== 3) return ''
  const [year, month, day] = parts
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
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

/* ------------------------------------------------------------------ */
/* 路由（History API，路径里不带 #）                                   */
/* ------------------------------------------------------------------ */
// /                 首页
// /blog/<slug>      文章详情
// 其它              404

type Route = { name: 'home' } | { name: 'post'; slug: string } | { name: 'notfound' }

function parsePath(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, '') || '/'
  if (clean === '/' || clean === '/blog') return { name: 'home' }

  const matched = /^\/blog\/(.+)$/.exec(clean)
  if (matched) return { name: 'post', slug: decodeURIComponent(matched[1]) }

  return { name: 'notfound' }
}

/* 极简外部 store：pushState 不会触发 popstate，所以自己通知订阅者 */
const locationListeners = new Set<() => void>()

function emitLocationChange() {
  for (const listener of locationListeners) listener()
}

function subscribeLocation(listener: () => void) {
  locationListeners.add(listener)
  window.addEventListener('popstate', listener)
  return () => {
    locationListeners.delete(listener)
    window.removeEventListener('popstate', listener)
  }
}

function getLocationKey() {
  return window.location.pathname + window.location.hash
}

function navigate(href: string) {
  if (href === getLocationKey()) return
  window.history.pushState(null, '', href)
  emitLocationChange()
}

function useLocationKey() {
  return useSyncExternalStore(subscribeLocation, getLocationKey, getLocationKey)
}

/** 站内链接：左键点击走前端路由，其余情况交给浏览器 */
function Link({
  href,
  className,
  children,
  external,
  title,
}: {
  href: string
  className?: string
  children: React.ReactNode
  external?: boolean
  title?: string
}) {
  if (external) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer" title={title}>
        {children}
      </a>
    )
  }

  return (
    <a
      className={className}
      href={href}
      title={title}
      onClick={(event) => {
        // 让浏览器处理新标签页、下载、右键菜单等情况
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        event.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </a>
  )
}

/* ------------------------------------------------------------------ */
/* 图标                                                               */
/* ------------------------------------------------------------------ */

function SocialIcon({ icon }: { icon: SocialLink['icon'] }) {
  if (icon === 'github') {
    return (
      <svg className="icon" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    )
  }

  if (icon === 'x') {
    return (
      <svg className="icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
      </svg>
    )
  }

  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width="15"
      height="15"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9.6 16.6-4.6-4.6 4.6-4.6M14.4 7.4l4.6 4.6-4.6 4.6" />
    </svg>
  )
}

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

/* ------------------------------------------------------------------ */
/* 通用小组件                                                          */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { href: '/#about', label: '关于' },
  { href: '/#projects', label: '项目' },
  { href: '/#blog', label: '博客' },
]

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
              <Link href={link.href} external title={link.hint}>
                <SocialIcon icon={link.icon} />
                {link.label}
              </Link>
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
          <Link
            className={project.placeholder ? 'card card-placeholder' : 'card'}
            key={project.title}
            href={project.href}
            external
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
          </Link>
        ))}
      </div>
    </section>
  )
}

function BlogSection() {
  return (
    <section id="blog" className="section">
      <SectionHeading index="03" title="博客" note={`${posts.length} 篇`} />
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link className="post-row" href={`/blog/${post.slug}`}>
              <div className="post-meta">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span className="sep" aria-hidden="true">
                  ·
                </span>
                <span>{post.minutes} 分钟</span>
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
            </Link>
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
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <span>{post.minutes} 分钟阅读</span>
        {post.draft ? <span className="badge">示例文章</span> : null}
      </div>

      {/* 正文来自本仓库的 blogs/*.md，是可信内容 */}
      <div className="prose prose-md" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />

      <ul className="chips chips-tight">
        {post.tags.map((tag) => (
          <Chip key={tag} small>
            {tag}
          </Chip>
        ))}
      </ul>

      <Link className="back back-bottom" href="/#blog">
        看其它文章 →
      </Link>
    </article>
  )
}

function NotFound({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="notfound">
      <p className="notfound-code">404</p>
      <h1>{title}</h1>
      <p className="muted">{hint}</p>
      <Link className="back" href="/#blog">
        返回文章列表
      </Link>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 页面                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const locationKey = useLocationKey()
  const { theme, toggleTheme } = useTheme()

  const route = parsePath(window.location.pathname)
  const activePost = route.name === 'post' ? findPost(route.slug) : undefined

  // 标题跟着路由走
  useEffect(() => {
    document.title = activePost
      ? `${activePost.title} · ${profile.name}`
      : `${profile.name} · ${profile.tagline}`
  }, [activePost])

  // 换页后：有锚点就滚到锚点，否则回到顶部
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [locationKey])

  return (
    <div className="shell">
      <div className="backdrop" aria-hidden="true" />

      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <span className="brand-dot" aria-hidden="true" />
            {profile.name}
          </Link>

          <nav className="nav" aria-label="页面导航">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
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
        {route.name === 'notfound' ? (
          <NotFound title="页面不存在" hint="这个地址没有对应的内容。" />
        ) : route.name === 'post' && !activePost ? (
          <NotFound title="没有这篇文章" hint="链接可能过期了，或者 slug 写错了。" />
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
