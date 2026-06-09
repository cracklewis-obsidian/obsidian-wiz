import { visit } from 'unist-util-visit'
import type { Root, Image, Paragraph, Text } from 'mdast'

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i
const WIKI_LINK_REGEX = /!?\[\[(.+?)(?:\|(.+?))?\]\]/g
const ATTACHMENT_PREFIX = '附件/'

interface LinkPart {
  type: 'text' | 'link'
  text?: string
  target?: string
  displayText?: string
}

function splitWikiLinks(text: string): LinkPart[] {
  const parts: LinkPart[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  WIKI_LINK_REGEX.lastIndex = 0

  while ((match = WIKI_LINK_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    parts.push({
      type: 'link',
      target: match[1],
      displayText: match[2],
    })

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return parts
}

function isImageLink(target: string): boolean {
  return target.startsWith(ATTACHMENT_PREFIX) || IMAGE_EXTENSIONS.test(target)
}

export function remarkWikiLink(nameIndex?: Map<string, string>) {
  return (tree: Root) => {
    visit(tree, 'paragraph', (
      node: Paragraph,
      index: number | undefined,
      parent: any
    ) => {
      if (index === undefined || !parent) return
      if (!node.children || node.children.length === 0) return

      const newChildren: any[] = []
      let modified = false

      for (const child of node.children) {
        if (child.type === 'text') {
          const text = (child as Text).value
          const parts = splitWikiLinks(text)

          for (const part of parts) {
            if (part.type === 'link') {
              modified = true
              const target = part.target || ''
              const displayText = part.displayText

              if (isImageLink(target)) {
                // Bare image filename (no directory) → assume it's in 附件/
                const imageUrl = target.startsWith(ATTACHMENT_PREFIX) || target.includes('/')
                  ? target
                  : `${ATTACHMENT_PREFIX}${target}`
                newChildren.push({
                  type: 'image',
                  url: imageUrl,
                  alt: displayText || target.split('/').pop() || target,
                } as Image)
              } else {
                const linkPath = resolveWikiLink(target, nameIndex)
                newChildren.push({
                  type: 'link',
                  url: `#/${linkPath}`,
                  children: [{ type: 'text', value: displayText || linkPath.split('/').pop() || linkPath }],
                })
              }
            } else {
              if (part.text !== undefined) {
                newChildren.push({ type: 'text', value: part.text })
              }
            }
          }
        } else {
          newChildren.push(child)
        }
      }

      if (modified) {
        parent.children[index] = {
          ...node,
          children: newChildren,
        }
      }
    })
  }
}

function resolveWikiLink(target: string, nameIndex?: Map<string, string>): string {
  // Split off any heading anchor (e.g., "笔记名#标题" → "笔记名" + "#标题")
  const hashIndex = target.indexOf('#')
  const baseTarget = hashIndex >= 0 ? target.slice(0, hashIndex) : target
  const headingAnchor = hashIndex >= 0 ? target.slice(hashIndex) : ''

  if (!nameIndex) return baseTarget.replace(/\.md$/i, '') + headingAnchor

  const lookup = baseTarget.toLowerCase().replace(/\.md$/i, '')
  const resolved = nameIndex.get(lookup)
  if (resolved) return resolved + headingAnchor

  // Fall back to direct path
  return baseTarget.replace(/\.md$/i, '') + headingAnchor
}
