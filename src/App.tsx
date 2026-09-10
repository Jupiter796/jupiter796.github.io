import { useState } from 'react'

type Link = { label: string; href: string }
type Project = { title: string; desc: string; href: string }

const links: Link[] = [
  { label: 'GitHub', href: 'https://github.com/Jupiter796' },
  { label: '本站源码', href: 'https://github.com/Jupiter796/jupiter796.github.io' },
]

const projects: Project[] = [
  {
    title: '项目一',
    desc: '一句话说明它在解决什么问题。',
    href: 'https://github.com/Jupiter796',
  },
  {
    title: '项目二',
    desc: '一句话说明技术栈和你负责的部分。',
    href: 'https://github.com/Jupiter796',
  },
]

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="page">
      <header className="hero">
        <h1>Jupiter796</h1>
        <p className="subtitle">把这里换成你的一句话介绍。</p>
        <nav className="links">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="section">
        <h2>项目</h2>
        <div className="grid">
          {projects.map((p) => (
            <a className="card" key={p.title} href={p.href} target="_blank" rel="noreferrer">
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>状态演示</h2>
        <p>
          这个按钮只用来证明 React 的交互在静态托管下是正常工作的（纯前端，无需后端）：
        </p>
        <button type="button" onClick={() => setCount((c) => c + 1)}>
          点我 +1（当前 {count}）
        </button>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Jupiter796</span>
        <span>由 GitHub Actions 自动构建并部署到 GitHub Pages</span>
      </footer>
    </div>
  )
}
