import { visit } from 'unist-util-visit'
import type { Root, Element, Text } from 'hast'

export function rehypeHeadingId() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (!/^h[1-6]$/i.test(node.tagName)) return

      const text = extractText(node)
      if (text) {
        node.properties = node.properties || {}
        node.properties.id = text
      }
    })
  }
}

function extractText(node: Element): string {
  let result = ''
  for (const child of node.children) {
    if (child.type === 'text') {
      result += (child as Text).value
    } else if (child.type === 'element') {
      result += extractText(child as Element)
    }
  }
  return result.trim()
}
