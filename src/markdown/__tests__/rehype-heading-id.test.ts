import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { rehypeHeadingId } from '../rehype-heading-id'

function process(text: string) {
  const result = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHeadingId)
    .use(rehypeStringify)
    .processSync(text)
  return String(result)
}

describe('rehypeHeadingId', () => {
  it('adds id to h1 based on text content', () => {
    const result = process('# 贝尔曼期望方程')
    expect(result).toContain('id="贝尔曼期望方程"')
  })

  it('adds id to h2 based on text content', () => {
    const result = process('## 强化学习基础')
    expect(result).toContain('id="强化学习基础"')
  })

  it('handles headings with inline formatting', () => {
    const result = process('## **加粗标题**')
    expect(result).toContain('id="加粗标题"')
  })

  it('handles multiple headings', () => {
    const result = process('# 标题一\n\n## 标题二\n\n### 标题三')
    expect(result).toContain('id="标题一"')
    expect(result).toContain('id="标题二"')
    expect(result).toContain('id="标题三"')
  })

  it('does not add id to non-heading elements', () => {
    const result = process('普通段落')
    expect(result).not.toContain('id="')
  })

  it('trims whitespace from heading text', () => {
    const result = process('##  带空格的标题  ')
    expect(result).toContain('id="带空格的标题"')
  })
})
