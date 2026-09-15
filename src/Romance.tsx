import { ParticleCanvas } from './romance-canvas'
import { Link } from './router'
import { profile } from './content'

/**
 * 浪漫页（/romance）。
 *
 * 整页是一块独立的「夜空画布」：底色由 .shell-romance 上的 CSS 渐变给出，
 * 星星是 Canvas 实时画的（见 romance-canvas.tsx），花瓣和光晕是纯 CSS 的静态层。
 *
 * 配色刻意**不走**站点的 --accent 主题变量，而是在 .shell-romance 里另起一套
 * --ro-* 变量（见 index.css）：这个页面要的是「夜空蓝紫 → 粉白 + 金」，而首页
 * 的蓝紫在浅色主题下会显得很寡淡。顶栏和页脚仍然是常规样式，界面不会割裂。
 */

type Icon = 'moon' | 'star' | 'feather' | 'heart'

type Card = {
  icon: Icon
  /** 卡片上方的小字标签 */
  label: string
  /** 有诗句时用：引文正文 */
  verse?: string
  /** 诗句出处 */
  cite?: string
  /** 无诗句时的正文段落 */
  body?: string
  /** 收尾的一句短评 */
  note?: string
  /** 首张卡片在宽屏上占两列，作为视觉重点 */
  featured?: boolean
}

const CARDS: Card[] = [
  {
    icon: 'star',
    label: '喜欢的诗句',
    verse: '愿我如星君如月，夜夜流光相皎洁。',
    cite: '范成大《车遥遥篇》',
    note: '写代码的人大概都喜欢这句里的「流光」——愿它年年岁岁，皎洁如初。',
    featured: true,
  },
  {
    icon: 'moon',
    label: '浪漫记忆',
    body:
      '印象最深的不是一个具体的日子，而是很多个相似的深夜：屏幕的冷光、杯子里的热气，' +
      '窗外安静得像被谁按下了暂停键。那时候写下的东西现在看着很笨，但每一个字都是真的。',
  },
  {
    icon: 'feather',
    label: '个人感悟',
    body:
      '浪漫不是玫瑰和烛光，而是有人愿意把你随口说过的一句话记很久。' +
      '写程序也一样——把一段复杂的逻辑整理得干净、可读、几年后自己还看得懂，本身就是一种温柔。',
  },
  {
    icon: 'heart',
    label: '兴趣爱好',
    body:
      '读一点诗，听一点钢琴曲，偶尔拍天上的云和月亮；喜欢整理笔记，也喜欢把零散的想法' +
      '收进这个站点。慢下来的事情，多半是值得的。',
    note: 'Dum spiro, spero. —— 只要还在呼吸，就还抱有希望。',
  },
]

const ICON_PATHS: Record<Icon, string> = {
  star: 'M12 3.2l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.6l6-.8z',
  moon: 'M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.7 8.7 0 1 0 10.8 10.8Z',
  feather: 'M19 5c-6 0-9 3.6-9 8.4V19M19 5c0 6-3.4 9.4-8.6 10.4M19 5 8 16',
  heart: 'M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 7.8a4.2 4.2 0 0 1 7 2.9C19 15.6 12 20 12 20Z',
}

function CardIcon({ icon }: { icon: Icon }) {
  return (
    <span className="romance-card-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
        <path
          d={ICON_PATHS[icon]}
          fill={icon === 'star' || icon === 'moon' || icon === 'heart' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export default function RomancePage() {
  return (
    <div className="shell shell-romance">
      {/* 三层背景，从下往上：夜空渐变 → 星星（canvas）→ 花瓣与光晕（纯 CSS） */}
      <div className="romance-sky" aria-hidden="true" />
      <ParticleCanvas />
      <div className="romance-veil" aria-hidden="true" />
      <div className="romance-petals" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className={`petal petal-${(i % 7) + 1}`} />
        ))}
      </div>

      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <span className="brand-dot" aria-hidden="true" />
            {profile.name}
          </Link>

          <Link className="romance-back" href="/">
            回到主页
          </Link>
        </div>
      </header>

      <main className="main main-romance">
        <section className="romance-hero">
          <p className="romance-eyebrow">星光收集处</p>

          <h1 className="romance-title">
            愿我如星君如月
            <br />
            夜夜流光相皎洁
          </h1>

          <p className="romance-sub">
            把想说却没说出口的话，都放在这里。这一页不属于任何技术栈，
            <br className="romance-br" />
            只属于一些安静的深夜和一闪一闪的念头。
          </p>

          <div className="romance-underline" aria-hidden="true" />
          <p className="romance-hint">向下滚动，拾起散落的星子 ✧</p>
        </section>

        <section className="romance-cards" aria-label="浪漫记忆与心情">
          {CARDS.map((card) => (
            <article
              className={card.featured ? 'romance-card is-featured' : 'romance-card'}
              key={card.label}
            >
              <CardIcon icon={card.icon} />
              <p className="romance-card-label">{card.label}</p>

              {card.verse ? (
                <blockquote className="romance-verse">
                  <p>{card.verse}</p>
                  <cite>{card.cite}</cite>
                </blockquote>
              ) : (
                <p className="romance-body">{card.body}</p>
              )}

              {card.note ? <p className="romance-note">{card.note}</p> : null}
            </article>
          ))}
        </section>

        <p className="romance-signature">
          <span aria-hidden="true">❀</span>
          {profile.tagline}
          <span aria-hidden="true">❀</span>
        </p>
      </main>

      <footer className="footer footer-romance">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <span>愿每一次相遇都恰逢其时</span>
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
