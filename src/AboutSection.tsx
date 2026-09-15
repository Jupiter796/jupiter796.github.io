import { about, skills } from './content'
import { Link } from './router'

/**
 * 「关于我」区块。首页在用它，鲜花页也在用它（两边内容完全一致），
 * 所以抽成组件而不是复制两份 —— 文案改了只改 src/content.ts，两处同时生效。
 *
 * 里面有两个"个人页面入口"：浪漫页 /romance 和鲜花页 /flowers。
 * 入口样式刻意做了区分：一张玻璃质感的卡片，加一条带微光下划线的文字链接。
 */

export function SectionHeading({
  index,
  title,
  note,
}: {
  index: string
  title: string
  note?: string
}) {
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

/** 花苞图标：鲜花页入口用 */
function BudIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M12 13c0-3.4 1.6-6.4 4.3-8.2C17.6 3.5 18 2.6 18 2c-3.6.5-6.2 2.2-7.8 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 13c0-3-1.3-5.6-3.6-7.6C7.1 4.2 6.5 3.4 6.3 3c-2.3 3-2.8 5.9-1.5 8.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 22V12.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M12 20.5c2.7 0 4.7-1.5 5.7-4.1-2.9-.9-5.1-.2-6.6 1.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AboutSection() {
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

      {/* 去鲜花页的入口。整张卡片就是链接，所以里面不再嵌 <a>（嵌套链接是非法 HTML），
          "推门进去" 只是视觉上的按钮徽标 */}
      <Link className="romance-cta romance-cta-flower" href="/flowers">
        <span className="romance-cta-icon" aria-hidden="true">
          <BudIcon />
        </span>

        <span className="romance-cta-body">
          <span className="romance-cta-title">
            收下一束电子鲜花
            <span className="romance-cta-arrow" aria-hidden="true">
              →
            </span>
          </span>
          <span className="romance-cta-desc">没有一张图片，每一片花瓣都是代码画出来的</span>
        </span>

        <span className="romance-cta-btn">去看看</span>
      </Link>

      {/* 去浪漫页的入口 */}
      <Link className="romance-cta" href="/romance">
        <span className="romance-cta-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path
              d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.7 8.7 0 1 0 10.8 10.8Z"
              fill="currentColor"
            />
            <path
              d="M5.6 6.2l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6L3.4 8.4l1.6-.6z"
              fill="currentColor"
              opacity="0.85"
            />
          </svg>
        </span>

        <span className="romance-cta-body">
          <span className="romance-cta-title">
            去「星光收集处」看看
            <span className="romance-cta-arrow" aria-hidden="true">
              →
            </span>
          </span>
          <span className="romance-cta-desc">星空、落花和几句写了很久的话</span>
        </span>

        <span className="romance-cta-btn">推门进去</span>
      </Link>

      <p className="about-romance-line">
        与技术无关的两个角落：
        <Link className="link-shine" href="/flowers">
          电子鲜花
        </Link>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <Link className="link-shine" href="/romance">
          星光收集处
        </Link>
      </p>
    </section>
  )
}
