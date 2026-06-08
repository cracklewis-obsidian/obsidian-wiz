import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeReact from 'rehype-react'
import { Fragment, type ReactElement } from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { remarkWikiLink } from './remark-wiki-link'
import { remarkCallout } from './remark-callout'
import { rehypeR2Image } from './rehype-r2-image'

let processor: ReturnType<typeof createProcessor> | null = null

function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkGfm)
    .use(remarkWikiLink)
    .use(remarkCallout)
    .use(remarkRehype)
    .use(rehypeR2Image)
    .use(rehypeKatex)
    .use(rehypeReact, {
      Fragment,
      jsx: jsxRuntime.jsx,
      jsxs: jsxRuntime.jsxs,
    })
}

export function renderMarkdown(content: string): ReactElement | null {
  try {
    if (!processor) {
      processor = createProcessor()
    }
    const result = processor.processSync(content)
    return result.result as ReactElement
  } catch (err) {
    console.error('Markdown rendering failed:', err)
    return null
  }
}
