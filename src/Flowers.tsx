import { useState } from 'react'
import { profile } from './content'
import { FlowersCanvas } from './flowers-canvas'
import { Link } from './router'
import { useTheme } from './useTheme'

/**
 * 鲜花页（/flowers）。
 *
 * 一束**纯代码画出来**的电子鲜花：没有图片、没有 SVG 资源，花茎、叶子、花瓣、
 * 包装纸全部是 Canvas 2D 每帧现算的（见 flowers-canvas.tsx）。
 *
 * 交互只有三个按钮：
 *   - 再开一次：重播一次盛开动画
 *   - 换一束  ：换一个种子，重新生成花束（朵数、颜色、朝向都会变）
 *   - 回到主页
 */
export default function FlowersPage() {
  // 种子决定花束长什么样；同一个种子每次渲染都一样，所以初始值写死
  const [seed, setSeed] = useState(20260914)
  const [resetKey, setResetKey] = useState(0)
  // 花束背景是 canvas 自己铺的，会跟着主题换色，所以这里也留一个主题开关
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="shell shell-flowers">
      <div className="flowers-bloom" aria-hidden="true" />

      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <span className="brand-dot" aria-hidden="true" />
            {profile.name}
          </Link>

          <span className="flowers-topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
                  <circle cx="12" cy="12" r="4.1" fill="currentColor" />
                  <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5" />
                  </g>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
                  <path
                    d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.7 8.7 0 1 0 10.8 10.8Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>

            <Link className="romance-back" href="/">
              回到主页
            </Link>
          </span>
        </div>
      </header>

      <main className="main main-flowers">
        <header className="flowers-head">
          <p className="flowers-eyebrow">送你一束</p>
          <h1 className="flowers-title">一束电子鲜花</h1>
          <p className="flowers-sub">
            没有一张图片，也没有用到任何绘图素材 ——
            每一片花瓣、每一根叶脉都是打开这个页面时用代码现画出来的。
          </p>
        </header>

        <div className="flowers-stage">
          {/* resetKey 变一次就重播盛开动画；seed 变一次就换一束花 */}
          <FlowersCanvas seed={seed} resetKey={resetKey} />
          <p className="flowers-caption">花会一直轻轻摇着，偶尔落下一两片花瓣</p>
        </div>

        <div className="flowers-actions">
          <button
            type="button"
            className="flowers-btn"
            onClick={() => setResetKey((key) => key + 1)}
          >
            再开一次
          </button>

          <button
            type="button"
            className="flowers-btn flowers-btn-primary"
            onClick={() => {
              // 换种子 = 换一束：朵数、配色、朝向都会重新生成
              setSeed(Math.floor(Math.random() * 1e9))
              setResetKey((key) => key + 1)
            }}
          >
            换一束
          </button>

          <Link className="flowers-btn" href="/">
            回到主页
          </Link>
        </div>
      </main>

      <footer className="footer footer-flowers">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <span>花是代码画的，心意是真的</span>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <Link className="romance-back romance-back-inline" href="/">
          返回主页
        </Link>
      </footer>
    </div>
  )
}
