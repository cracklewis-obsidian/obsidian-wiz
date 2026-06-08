interface NoteNotFoundProps {
  path: string
}

export default function NoteNotFound({ path }: NoteNotFoundProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center max-w-md">
        <div className="text-gray-300 text-6xl mb-6">🔍</div>
        <h2 className="text-xl font-semibold text-gray-600 mb-2">笔记不存在</h2>
        <p className="text-gray-400 text-sm mb-4">
          笔记「{path}」在当前仓库中未找到
        </p>
        <p className="text-gray-400 text-xs">
          它可能在仓库的其他位置，或尚未创建
        </p>
      </div>
    </div>
  )
}
