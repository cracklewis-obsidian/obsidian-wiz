import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { rehypeR2Image } from '../rehype-r2-image'
import { CONFIG } from '../../config'

function process(text: string) {
  const result = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeR2Image)
    .use(rehypeStringify)
    .processSync(text)
  return String(result)
}

describe('rehypeR2Image', () => {
  it('rewrites 附件/ paths to R2 URL', () => {
    const result = process('![alt](附件/xxx.png)')
    // rehype-stringify URL-encodes Chinese characters
    expect(result).toContain(CONFIG.r2BaseUrl)
    expect(result).toContain('xxx.png')
    expect(result).not.toContain('src="附件/')
  })

  it('rewrites ./附件/ paths to R2 URL', () => {
    const result = process('![alt](./附件/xxx.png)')
    expect(result).toContain(CONFIG.r2BaseUrl)
    expect(result).toContain('xxx.png')
    expect(result).not.toContain('src="./')
  })

  it('does not rewrite absolute URLs', () => {
    const result = process('![alt](https://example.com/img.png)')
    expect(result).toContain('src="https://example.com/img.png"')
    expect(result).not.toContain(CONFIG.r2BaseUrl)
  })

  it('does not rewrite non-attachment relative paths', () => {
    const result = process('![alt](./images/xxx.png)')
    expect(result).toContain('src="./images/xxx.png"')
  })
})
