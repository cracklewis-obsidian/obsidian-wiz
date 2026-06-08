export default function EmptyState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center max-w-md">
        <div className="text-gray-300 text-6xl mb-6">📖</div>
        <h2 className="text-xl font-semibold text-gray-600 mb-2">选择一篇笔记开始阅读</h2>
        <p className="text-gray-400 text-sm">
          从左侧的目录树中选择一篇笔记，内容将在这里显示
        </p>
      </div>
    </div>
  )
}
