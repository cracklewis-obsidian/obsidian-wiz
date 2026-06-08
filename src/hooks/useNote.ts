import { useEffect, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { fetchNoteContent } from '../lib/github'

export function useNote(path: string | null) {
  const {
    noteContent,
    noteLoading,
    noteError,
    setNoteContent,
    setNoteLoading,
    setNoteError,
  } = useStore()

  const loadNote = useCallback(
    async (notePath: string) => {
      setNoteLoading(true)
      setNoteError(null)
      setNoteContent(null)
      try {
        const content = await fetchNoteContent(notePath)
        setNoteContent(content)
      } catch (err) {
        setNoteError(
          err instanceof Error && err.message === 'Note not found'
            ? 'NOTE_NOT_FOUND'
            : err instanceof Error
              ? err.message
              : 'Failed to load note'
        )
      } finally {
        setNoteLoading(false)
      }
    },
    [setNoteContent, setNoteLoading, setNoteError]
  )

  useEffect(() => {
    if (path) {
      loadNote(path)
    } else {
      setNoteContent(null)
      setNoteError(null)
      setNoteLoading(false)
    }
  }, [path, loadNote, setNoteContent, setNoteError, setNoteLoading])

  return { content: noteContent, loading: noteLoading, error: noteError }
}
