import { useEffect, useMemo, forwardRef, type ForwardedRef } from 'react'
import { useStore } from '../stores/useStore'
import { renderMarkdown } from '../markdown/pipeline'
import { buildNameIndex } from '../lib/github'

interface NoteContentProps {
  content: string
  headingAnchor?: string | null
}

const NoteContent = forwardRef<HTMLDivElement, NoteContentProps>(
  function NoteContent({ content, headingAnchor }, ref: ForwardedRef<HTMLDivElement>) {
    const tree = useStore((s) => s.tree)

    const nameIndex = useMemo(() => {
      return tree ? buildNameIndex(tree) : new Map<string, string>()
    }, [tree])

    const rendered = useMemo(
      () => renderMarkdown(content, nameIndex),
      [content, nameIndex]
    )

    // Scroll to heading anchor after render
    useEffect(() => {
      if (headingAnchor) {
        requestAnimationFrame(() => {
          document.getElementById(headingAnchor)?.scrollIntoView({ behavior: 'smooth' })
        })
      }
    }, [headingAnchor])

    if (!rendered) {
      return (
        <div className="text-red-500 text-sm">
          笔记渲染失败，内容可能包含不支持的语法
        </div>
      )
    }

    return (
      <div ref={ref} className="note-content max-w-none">
        {rendered}
      </div>
    )
  }
)

export default NoteContent
