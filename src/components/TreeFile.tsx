import { useNavigate, useParams } from 'react-router-dom'
import type { TreeNode } from '../lib/github'

interface TreeFileProps {
  node: TreeNode
}

export default function TreeFile({ node }: TreeFileProps) {
  const navigate = useNavigate()
  const { '*': currentPath } = useParams()

  const linkPath = node.path.replace(/\.md$/i, '')
  const isActive = currentPath === linkPath

  const handleClick = () => {
    navigate(`/${linkPath}`)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700 font-medium'
          : 'text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span className="mr-2">
        {node.name.endsWith('.md') ? '📄' : '📎'}
      </span>
      {node.name.replace(/\.md$/i, '')}
    </button>
  )
}
