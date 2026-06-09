import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { remarkWikiLink } from '../remark-wiki-link'

function process(text: string) {
  const result = unified()
    .use(remarkParse)
    .use(remarkWikiLink)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(text)
  return String(result)
}

describe('remarkWikiLink', () => {
  it('converts [[笔记名]] to a link', () => {
    const result = process('参考 [[设计草案]] 了解更多')
    expect(result).toContain(encodeURI('#/设计草案'))
    expect(result).toContain('>设计草案<')
  })

  it('converts [[路径/笔记名]] to a path link', () => {
    const result = process('详见 [[项目A/需求]]')
    expect(result).toContain(encodeURI('#/项目A/需求'))
    expect(result).toContain('>需求<')
  })

  it('handles pipe syntax [[目标|显示名]]', () => {
    const result = process('参考 [[设计草案|设计文档]]')
    expect(result).toContain(encodeURI('#/设计草案'))
    expect(result).toContain('>设计文档<')
  })

  it('converts [[附件/xxx.png]] to an image tag', () => {
    const result = process('图示：[[附件/diagram.png]]')
    expect(result).toContain('<img')
    expect(result).toContain('diagram.png')
  })

  it('prepends 附件/ to bare image filenames in wiki links', () => {
    const result = process('截图：[[Pasted image 2024.png]]')
    expect(result).toContain('<img')
    expect(result).toContain('src="%E9%99%84%E4%BB%B6/Pasted%20image%202024.png"')
  })

  it('consumes ! prefix in ![[image]] and produces no extra text', () => {
    const result = process('![[photo.png]]')
    // Should be just the image, no extra !
    expect(result).not.toContain('!<img')
    expect(result).toContain('<img')
    expect(result).toContain('src="%E9%99%84%E4%BB%B6/photo.png"')
  })

  it('handles mixed content with regular text', () => {
    const result = process('前面文字 [[链接]] 后面文字')
    expect(result).toContain('前面文字')
    expect(result).toContain('后面文字')
    expect(result).toContain(encodeURI('#/链接'))
  })

  it('strips .md extension from targets', () => {
    const result = process('参考 [[需求.md]]')
    expect(result).toContain(encodeURI('#/需求'))
  })

  it('passes through text without wiki links', () => {
    const result = process('普通文本 [外部链接](https://example.com)')
    expect(result).toContain('普通文本')
    expect(result).toContain('外部链接')
  })
})

describe('remarkWikiLink with nameIndex', () => {
  const nameIndex = new Map<string, string>([
    ['ai名词词典', 'AI/AI名词词典'],
    ['需求', '项目A/需求'],
    ['重复笔记', '项目A/重复笔记'],
    ['01-强化学习基础', 'AI/强化学习理论/01-强化学习基础'],
  ])

  function processWithIndex(text: string) {
    const result = unified()
      .use(remarkParse)
      .use(remarkWikiLink, nameIndex)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text)
    return String(result)
  }

  it('resolves [[笔记名]] using nameIndex', () => {
    const result = processWithIndex('参考 [[AI名词词典]]')
    expect(result).toContain(encodeURI('#/AI/AI名词词典'))
  })

  it('falls back to direct path when name is not in index', () => {
    const result = processWithIndex('参考 [[不存在的笔记]]')
    expect(result).toContain(encodeURI('#/不存在的笔记'))
  })

  it('resolves [[目标|显示名]] with nameIndex', () => {
    const result = processWithIndex('参考 [[AI名词词典|AI词典]]')
    expect(result).toContain(encodeURI('#/AI/AI名词词典'))
    expect(result).toContain('>AI词典<')
  })

  it('does not affect image wiki links', () => {
    const result = processWithIndex('图示 [[附件/diagram.png]]')
    expect(result).toContain('<img')
    expect(result).not.toContain(encodeURI('#/'))
  })

  it('resolves [[笔记名#标题]] with heading anchor in query param', () => {
    const result = processWithIndex('参考 [[01-强化学习基础#贝尔曼期望方程]]')
    expect(result).toContain(encodeURI('#/AI/强化学习理论/01-强化学习基础?heading='))
    expect(result).toContain('heading=%E8%B4%9D%E5%B0%94%E6%9B%BC%E6%9C%9F%E6%9C%9B%E6%96%B9%E7%A8%8B')
  })

  it('falls back for [[笔记名#标题]] when note not in index', () => {
    const result = processWithIndex('参考 [[不存在的笔记#某个标题]]')
    expect(result).toContain(encodeURI('#/不存在的笔记?heading='))
    expect(result).toContain('heading=%E6%9F%90%E4%B8%AA%E6%A0%87%E9%A2%98')
  })
})
