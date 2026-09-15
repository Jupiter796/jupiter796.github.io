import { useState } from 'react'

/**
 * 文章封面图。列表缩略图和文章页大图共用这一个组件。
 *
 * 三种情况都有兜底，不会出现破图或塌掉的空间：
 *   - 没写 cover（cover 为 undefined）：整个外壳带 is-empty，由 CSS 隐藏
 *   - 有 cover、图能加载：正常显示，加载完之前是渐变占位
 *   - 有 cover、但图挂了（404 / 外链失效）：退到渐变占位，不留 alt 文本的空白框
 *
 * 调用方负责决定尺寸：宽高比由外层 wrapper 定（object-fit: cover 裁切），
 * 组件自己不管布局。
 */
export function Cover({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  // src 变了（比如换了一篇文章）就清掉上一次的失败状态，重新给一次机会
  const [seen, setSeen] = useState(src)
  if (seen !== src) {
    setSeen(src)
    setFailed(false)
  }

  // 没写 cover，或者图挂了：交给 CSS 归零宽度，列表就退化成纯文字排版
  if (!src || failed) return <span className="cover is-empty" aria-hidden="true" />

  return (
    <span className="cover">
      <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </span>
  )
}
