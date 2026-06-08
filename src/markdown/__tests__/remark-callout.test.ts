import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { remarkCallout } from '../remark-callout'

function process(text: string) {
  const result = unified()
    .use(remarkParse)
    .use(remarkCallout)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(text)
  return String(result)
}

describe('remarkCallout', () => {
  it('converts > [!note] to a callout div', () => {
    const result = process('> [!note]\n> 这是一个提示')
    expect(result).toContain('class="callout callout-note"')
    expect(result).toContain('这是一个提示')
  })

  it('converts > [!warning] with title', () => {
    const result = process('> [!warning] 注意\n> 请小心操作')
    expect(result).toContain('class="callout callout-warning"')
    expect(result).toContain('注意')
    expect(result).toContain('请小心操作')
  })

  it('handles [!tip] and [!hint]', () => {
    const tip = process('> [!tip]\n> 小技巧')
    const hint = process('> [!hint]\n> 小提示')
    expect(tip).toContain('callout-tip')
    expect(hint).toContain('callout-hint')
  })

  it('handles [!danger] and [!error]', () => {
    const danger = process('> [!danger]\n> 危险')
    const error = process('> [!error]\n> 错误')
    expect(danger).toContain('callout-danger')
    expect(error).toContain('callout-error')
  })

  it('handles multi-line callout content', () => {
    const result = process('> [!note] 笔记\n> 第一行\n> 第二行\n> 第三行')
    expect(result).toContain('第一行')
    expect(result).toContain('第二行')
    expect(result).toContain('第三行')
  })

  it('ignores regular blockquotes', () => {
    const result = process('> 普通引用\n> 继续引用')
    expect(result).toContain('<blockquote>')
    expect(result).not.toContain('callout')
  })
})
