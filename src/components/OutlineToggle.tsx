interface OutlineToggleProps {
  visible: boolean
  onClick: () => void
}

export default function OutlineToggle({ visible, onClick }: OutlineToggleProps) {
  if (!visible) return null

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
                 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
      aria-label="切换大纲面板"
      title="大纲"
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
      <span>大纲</span>
    </button>
  )
}
