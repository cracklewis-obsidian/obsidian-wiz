import { visit } from 'unist-util-visit'
import type { Root, Blockquote, Paragraph, Text } from 'mdast'

const CALLOUT_PATTERN = /^\[!(.+?)\]\s*(.*)$/im

export function remarkCallout() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (
      node: Blockquote,
      index: number | undefined,
      parent: any
    ) => {
      if (index === undefined || !parent) return
      if (!node.children || node.children.length === 0) return

      const firstChild = node.children[0]
      if (firstChild?.type !== 'paragraph') return

      const firstText = ((firstChild as Paragraph).children[0] as Text | undefined)?.value
      if (!firstText) return

      const match = firstText.match(CALLOUT_PATTERN)
      if (!match) return

      const calloutType = match[1].toLowerCase()
      const calloutTitle = match[2]

      // Remove the [!type] marker text from the first child
      const markerText = match[0]
      const restOfText = firstText.slice(markerText.length).trim()

      if (restOfText) {
        ((firstChild as Paragraph).children[0] as Text).value = restOfText
      } else {
        // Remove the first paragraph if it only contained the [!type] line
        node.children.shift()
      }

      // Build callout children with optional title
      const calloutChildren: any[] = []

      if (calloutTitle) {
        calloutChildren.push({
          type: 'paragraph',
          data: {
            hProperties: { className: 'callout-title font-bold mb-2' },
          },
          children: [{ type: 'text', value: calloutTitle }],
        })
      }

      // Add remaining blockquote content
      calloutChildren.push(...node.children)

      // Replace blockquote with callout div
      parent.children[index] = {
        type: 'blockquote',
        data: {
          hName: 'div',
          hProperties: {
            className: `callout callout-${calloutType}`,
          },
        },
        children: calloutChildren,
      }
    })
  }
}
