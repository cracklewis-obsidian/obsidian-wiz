import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'
import { CONFIG } from '../config'

const ATTACHMENT_PREFIX = '附件/'

export function rehypeR2Image() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return

      const src = node.properties?.src as string | undefined
      if (!src) return

      // Decode URL encoding (e.g. 附件 -> %E9%99%84%E4%BB%B6)
      const decoded = decodeURIComponent(src)
      // Handle both 附件/xxx.png and ./附件/xxx.png
      const normalized = decoded.replace(/^\.\//, '')
      if (normalized.startsWith(ATTACHMENT_PREFIX)) {
        node.properties!.src = `${CONFIG.r2BaseUrl}${normalized}`
      }
    })
  }
}
