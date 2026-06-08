interface LoadingProps {
  message?: string
}

export default function Loading({ message = '加载中...' }: LoadingProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  )
}
