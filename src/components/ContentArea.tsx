import { useParams } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import { useNote } from '../hooks/useNote'
import { useEffect } from 'react'
import NoteContent from './NoteContent'
import Loading from './Loading'
import ErrorDisplay from './ErrorDisplay'
import EmptyState from './EmptyState'
import NoteNotFound from './NoteNotFound'

export default function ContentArea() {
  const { '*': path } = useParams()
  const resolvedPath = path || null

  const notePath = resolvedPath
    ? resolvedPath.endsWith('.md')
      ? resolvedPath
      : `${resolvedPath}.md`
    : null

  const { content, loading, error } = useNote(notePath)
  const setCurrentPath = useStore((s) => s.setCurrentPath)

  useEffect(() => {
    setCurrentPath(resolvedPath)
  }, [resolvedPath, setCurrentPath])

  // No path selected
  if (!resolvedPath) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <EmptyState />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <Loading message="加载笔记..." />
      </div>
    )
  }

  // Note not found
  if (error === 'NOTE_NOT_FOUND') {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <NoteNotFound path={resolvedPath} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <ErrorDisplay message={error} />
      </div>
    )
  }

  // Success — render note
  return (
    <article className="max-w-4xl mx-auto p-6 md:p-10">
      <NoteContent content={content || ''} />
    </article>
  )
}
