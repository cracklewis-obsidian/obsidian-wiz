import { useEffect } from 'react'
import { useStore } from '../stores/useStore'
import { useTree } from '../hooks/useTree'
import { useSearch } from '../hooks/useSearch'
import SearchBar from './SearchBar'
import FileTree from './FileTree'
import Loading from './Loading'
import ErrorDisplay from './ErrorDisplay'

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useStore()
  const { tree, loading, error, refreshTree } = useTree()
  const { filteredTree } = useSearch()

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarCollapsed])

  if (sidebarCollapsed) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border"
        aria-label="打开侧边栏"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-30 md:hidden"
        onClick={toggleSidebar}
      />

      <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full z-40 md:relative fixed">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-800">Obsidian Wiz</h1>
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="关闭侧边栏"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <SearchBar />
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto">
          {loading && <Loading message="加载目录树..." />}
          {error && <ErrorDisplay message={error} onRetry={refreshTree} />}
          {tree && <FileTree nodes={filteredTree || tree} />}
        </div>
      </aside>
    </>
  )
}
