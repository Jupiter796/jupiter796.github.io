import { useSyncExternalStore } from 'react'

/**
 * 极简前端路由（History API，路径里不带 #）。
 *
 *   /                首页
 *   /blog/<slug>     文章详情
 *   其它             404
 *
 * 单独成文件是因为文章详情是懒加载的独立 chunk，它和 App 都要用 Link。
 */

export type Route = { name: 'home' } | { name: 'post'; slug: string } | { name: 'notfound' }

export function parsePath(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, '') || '/'
  if (clean === '/' || clean === '/blog') return { name: 'home' }

  const matched = /^\/blog\/(.+)$/.exec(clean)
  if (matched) return { name: 'post', slug: decodeURIComponent(matched[1]) }

  return { name: 'notfound' }
}

/* pushState 不会触发 popstate，所以自己通知订阅者 */
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

export function navigate(href: string) {
  if (href === getLocationKey()) return
  window.history.pushState(null, '', href)
  emitLocationChange()
}

export function useLocationKey() {
  return useSyncExternalStore(subscribeLocation, getLocationKey, getLocationKey)
}

/** 站内链接：左键点击走前端路由，其余情况交给浏览器 */
export function Link({
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
