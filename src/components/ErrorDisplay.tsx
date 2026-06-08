interface ErrorDisplayProps {
  message: string
  onRetry?: () => void
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-4xl mb-4">⚠</div>
        <p className="text-gray-700 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        )}
      </div>
    </div>
  )
}
