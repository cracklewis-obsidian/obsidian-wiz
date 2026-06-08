import { useMemo } from 'react'
import { renderMarkdown } from '../markdown/pipeline'

interface NoteContentProps {
  content: string
}

export default function NoteContent({ content }: NoteContentProps) {
  const rendered = useMemo(() => renderMarkdown(content), [content])

  if (!rendered) {
    return (
      <div className="text-red-500 text-sm">
        笔记渲染失败，内容可能包含不支持的语法
      </div>
    )
  }

  return (
    <div className="note-content max-w-none">
      {rendered}
    </div>
  )
}
