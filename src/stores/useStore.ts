import { create } from 'zustand'
import type { TreeNode } from '../lib/github'

interface AppStore {
  // Tree state
  tree: TreeNode[] | null
  treeLoading: boolean
  treeError: string | null

  // Note state
  currentPath: string | null
  noteContent: string | null
  noteLoading: boolean
  noteError: string | null

  // UI state
  searchQuery: string
  sidebarCollapsed: boolean
  expandedFolders: Set<string>

  // Actions
  setTree: (tree: TreeNode[] | null) => void
  setTreeLoading: (loading: boolean) => void
  setTreeError: (error: string | null) => void
  setCurrentPath: (path: string | null) => void
  setNoteContent: (content: string | null) => void
  setNoteLoading: (loading: boolean) => void
  setNoteError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleFolder: (path: string) => void
  expandFolder: (path: string) => void
}

export const useStore = create<AppStore>((set) => ({
  // Initial tree state
  tree: null,
  treeLoading: false,
  treeError: null,

  // Initial note state
  currentPath: null,
  noteContent: null,
  noteLoading: false,
  noteError: null,

  // Initial UI state
  searchQuery: '',
  sidebarCollapsed: false,
  expandedFolders: new Set<string>(),

  // Tree actions
  setTree: (tree) => set({ tree }),
  setTreeLoading: (treeLoading) => set({ treeLoading }),
  setTreeError: (treeError) => set({ treeError }),

  // Note actions
  setCurrentPath: (currentPath) => set({ currentPath }),
  setNoteContent: (noteContent) => set({ noteContent }),
  setNoteLoading: (noteLoading) => set({ noteLoading }),
  setNoteError: (noteError) => set({ noteError }),

  // UI actions
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  toggleFolder: (path) =>
    set((state) => {
      const next = new Set(state.expandedFolders)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return { expandedFolders: next }
    }),

  expandFolder: (path) =>
    set((state) => {
      const next = new Set(state.expandedFolders)
      next.add(path)
      return { expandedFolders: next }
    }),
}))
