import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeReact from 'rehype-react'
import { Fragment, type ReactElement } from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { remarkWikiLink } from './remark-wiki-link'
import { remarkCallout } from './remark-callout'
import { rehypeR2Image } from './rehype-r2-image'

export function renderMarkdown(
  content: string,
  nameIndex?: Map<string, string>
): ReactElement | null {
  try {
    const result = unified()
      .use(remarkParse)
      .use(remarkMath)
      .use(remarkGfm)
      .use(remarkWikiLink, nameIndex)
      .use(remarkCallout)
      .use(remarkRehype)
      .use(rehypeHighlight)
      .use(rehypeR2Image)
      .use(rehypeKatex)
      .use(rehypeReact, {
        Fragment,
        jsx: jsxRuntime.jsx,
        jsxs: jsxRuntime.jsxs,
      })
      .processSync(content)

    return result.result as ReactElement
  } catch (err) {
    console.error('Markdown rendering failed:', err)
    return null
  }
}
