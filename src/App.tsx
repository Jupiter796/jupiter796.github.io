import { lazy, Suspense, useEffect } from 'react'
import { AboutSection } from './AboutSection'
import { BRAND_ICONS } from './brand-icons'
import { Cover } from './Cover'
import { profile, projects, socialLinks, type SocialLink } from './content'
import { findPost, formatPostDate, posts } from './posts'
import { Link, parsePath, useLocationKey } from './router'
import { useTheme, type Theme } from './useTheme'

// 文章详情里带 marked 和 KaTeX，体积不小，拆成独立 chunk 按需加载
const PostView = lazy(() => import('./PostView'))
// 浪漫页、鲜花页同理：星空 / 花束的 canvas 只有访客真的点进去才需要
const RomancePage = lazy(() => import('./Romance'))
const FlowersPage = lazy(() => import('./Flowers'))

/* ------------------------------------------------------------------ */
/* 小工具                                                             */
/* ------------------------------------------------------------------ */

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
/* 图标                                                               */
/* ------------------------------------------------------------------ */

/** 品牌图标走 simple-icons 的路径；'code' 是站点自用的代码图标 */
function SocialIcon({ icon }: { icon: SocialLink['icon'] }) {
  if (icon === 'code') {
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

  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width="15"
      height="15"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d={BRAND_ICONS[icon]} />
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
  { href: '/romance', label: '浪漫' },
  { href: '/flowers', label: '鲜花' },
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

/* AboutSection 已抽到 src/AboutSection.tsx —— 首页和鲜花页共用同一份，
   所以这里不再重复定义。下面两个区块只有首页用。 */

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
              <Cover src={post.cover} alt={post.coverAlt} />

              <div className="post-row-body">
                <div className="post-meta">
                  <time dateTime={post.date}>{formatPostDate(post.date)}</time>
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
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
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
  // 订阅 location 变化以触发重渲染；当前值下面直接读 window.location
  useLocationKey()
  const { theme, toggleTheme } = useTheme()

  const pathname = window.location.pathname
  const route = parsePath(pathname)
  const activePost = route.name === 'post' ? findPost(route.slug) : undefined
  // 浪漫页 / 鲜花页自带顶栏、页脚和整套配色，各自走独立的渲染分支
  const isRomance = route.name === 'romance'
  const isFlowers = route.name === 'flowers'

  // 标题跟着路由走
  useEffect(() => {
    if (isRomance) {
      document.title = `星光收集处 · ${profile.name}`
      return
    }
    if (isFlowers) {
      document.title = `一束电子鲜花 · ${profile.name}`
      return
    }
    document.title = activePost
      ? `${activePost.title} · ${profile.name}`
      : `${profile.name} · ${profile.tagline}`
  }, [activePost, isRomance, isFlowers])

  // 只在「页面」变化时重置滚动位置。
  // 单纯改 hash（点文章目录的锚点）交给浏览器，否则点完锚点按返回键会被拉回顶部。
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
  }, [pathname])

  if (isRomance) {
    return (
      <div className="romance-theme" data-ro-theme={theme === 'light' ? 'dawn' : 'night'}>
        <Suspense fallback={<p className="loading loading-romance">正在点亮星空…</p>}>
          <RomancePage />
        </Suspense>
      </div>
    )
  }

  if (isFlowers) {
    return (
      <Suspense fallback={<p className="loading loading-romance">正在种花…</p>}>
        <FlowersPage />
      </Suspense>
    )
  }

  return (
    <div className={activePost ? 'shell shell-post' : 'shell'}>
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

      <main className={activePost ? 'main main-post' : 'main'}>
        {route.name === 'notfound' ? (
          <NotFound title="页面不存在" hint="这个地址没有对应的内容。" />
        ) : route.name === 'post' && !activePost ? (
          <NotFound title="没有这篇文章" hint="链接可能过期了，或者 slug 写错了。" />
        ) : activePost ? (
          <Suspense fallback={<p className="loading">正在加载文章…</p>}>
            <PostView post={activePost} />
          </Suspense>
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
