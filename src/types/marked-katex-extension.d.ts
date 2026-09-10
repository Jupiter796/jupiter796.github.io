/**
 * marked-katex-extension 把自己的 types 字段指向了**未编译的源码** src/index.ts，
 * 于是 tsc 会连带去检查它自己的实现，并撞上本项目的 noUnusedParameters
 * （它内部的 blockKatex 有个没用的形参）。skipLibCheck 对 .ts 源码不生效。
 *
 * 这里用一份等价声明顶替它的类型入口（见 tsconfig.json 的 paths）。
 * 上游如果哪天补了真正的 .d.ts，这个文件和那条 paths 就可以删掉。
 */
import type { KatexOptions } from 'katex'
import type { MarkedExtension } from 'marked'

export interface MarkedKatexOptions extends KatexOptions {
  /** 允许 `$` 前后不带空格 —— 中文排版里「公式$E=mc^2$」这种写法才不会被漏掉 */
  nonStandard?: boolean
}

export default function markedKatex(options?: MarkedKatexOptions): MarkedExtension
