# Note Outline View: 笔记大纲视图

> 设计文档 · 2026-06-09
> 状态: ✅ 已审批，待实现
> 设计基于 [obsidian-wiz 基础架构](2026-06-08-obsidian-wiz-design.md)

## 1. 概述

在内容区右侧增加一个可折叠的大纲面板，展示当前笔记的标题层级结构。用户可快速浏览笔记结构、跳转到指定章节，并通过滚动追踪了解当前阅读位置。

### 核心定位

- 只读的笔记结构导航工具
- 与左侧文件浏览器的视觉风格一致
- 纯客户端实现，不依赖后端

## 2. 设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 布局 | 可折叠右侧面板 | 兼顾宽屏与窄屏，与左侧边栏对称 |
| 标题提取方式 | DOM 提取 | 零改动现有 Markdown 管线，利用已有的 `rehype-heading-id` |
| 标题层级 | H1~H6 全部显示 | 嵌套树缩进 + 折叠功能管理深度 |
| 显示风格 | 纯间距缩进（无连接线） | 简洁清晰，与左侧文件浏览器一致 |
| 面板触发 | 自动 + 手动混合 | 有标题自动展开，无标题自动收起；按钮手动切换 |
| 滚动追踪 | IntersectionObserver 高亮当前标题 | 实时反馈阅读位置 |
| 移动端适配 | Overlay 弹出层（同左 sidebar） | <768px 时大纲面板变为遮罩弹出 |
| 状态持久化 | localStorage | 页面刷新后保持折叠/展开状态 |
| 切换按钮图标 | SVG 图标 | 列表图标，精致外观 |
| 键盘快捷键 | 预留接口，暂不实现 | `Ctrl+Shift+O` 接口为后续扩展保留 |
| 折叠动效 | CSS transition `width 200ms ease` | 无额外依赖，性能好 |

## 3. 新增文件

| 文件 | 职责 |
|------|------|
| `src/hooks/useOutline.ts` | DOM 提取标题 + IntersectionObserver 追踪 |
| `src/components/OutlinePanel.tsx` | 右侧大纲面板容器（折叠/展开逻辑） |
| `src/components/OutlineTree.tsx` | 递归渲染标题树 + 折叠/展开/高亮 |
| `src/components/OutlineToggle.tsx` | 内容区顶部切换按钮（SVG 图标） |

## 4. 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/ContentArea.tsx` | 引入 OutlinePanel，布局改为三列弹性布局 |
| `src/components/NoteContent.tsx` | 添加 `ref` 或 `data-heading-id` wrapper（极小改动） |
| `src/stores/useStore.ts` | 新增 `outlineCollapsed` 状态、`toggleOutline` 等 actions |

**不改动的文件：** `pipeline.ts`、所有 remark/rehype 插件、`Sidebar.tsx`、`TreeFile.tsx`、`TreeFolder.tsx`

## 5. 数据结构

```typescript
// useOutline hook 的返回类型
interface HeadingItem {
  id: string         // 来自 rehype-heading-id 生成的 id
  text: string       // 标题文本
  level: number      // 1-6
  children: HeadingItem[]
}

interface UseOutlineResult {
  headings: HeadingItem[]       // 嵌套树结构（空数组 = 无标题）
  activeId: string | null       // 当前视口中可见的标题 id
  contentRef: RefObject<HTMLDivElement>  // 挂载在内容容器上的 ref
}
```

## 6. useOutline Hook 设计

### 工作流程

```
笔记切换 → NoteContent 渲染完成
    ↓
querySelectorAll('.note-content h1, h2, h3, h4, h5, h6')
    ↓
提取 { id, textContent, tagName } → tagName 映射为 level (H1=1...H6=6)
    ↓
构建嵌套树（相邻标题的层级关系）:
  - 如果当前 level > 上一个 level → 成为上一个的子节点
  - 如果当前 level <= 上一个 level → 回溯到对应层级的兄弟节点
    ↓
注册 IntersectionObserver（rootMargin: '-80px 0px -60% 0px'）
    ↓
返回 headings + activeId 给 OutlinePanel
```

### 关键行为

- **空状态**: headings 为空数组 → OutlinePanel 保持折叠
- **内容切换**: 清除旧 Observer，重新提取
- **错误处理**: DOM 查询异常 → 捕获错误并静默降级（面板保持折叠，不抛错）
- **过滤规则**: 标题文本为空（如 `## `）→ 跳过；标题文字前后 trim
- **清理**: useEffect 返回的 cleanup 函数断开所有 observer 连接
- **id fallback**: 理论上所有标题都有 `rehype-heading-id` 生成的 id，如果不存在则用 `heading-${index}` 作为降级

### 嵌套树构建算法

```typescript
function buildHeadingTree(headings: RawHeading[]): HeadingItem[] {
  const root: HeadingItem[] = []
  const stack: HeadingItem[] = [] // 用于追踪父子层级

  for (const h of headings) {
    const node: HeadingItem = { id: h.id, text: h.text, level: h.level, children: [] }

    // 弹出栈中所有 level >= 当前 level 的节点（回溯到父级或同级）
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop()
    }

    if (stack.length > 0) {
      // 当前节点是栈顶的子节点
      stack[stack.length - 1].children.push(node)
    } else {
      // 当前节点是顶层节点
      root.push(node)
    }

    stack.push(node)
  }

  return root
}
```

## 7. 组件设计

### OutlineToggle（切换按钮）

```
位置：内容区顶部栏右侧
展示条件：笔记有标题（headings.length > 0）
功能：点击切换 outlineCollapsed 状态
图标：SVG 列表图标（类似 ≡ 风格，带小圆点表示层级）
样式：与顶部栏融合，hover 时背景变色
```

```tsx
interface OutlineToggleProps {
  onClick: () => void
  visible: boolean  // 由 useOutline 返回的 headings.length > 0 决定
}
```

### OutlinePanel（右侧面板容器）

```
展示条件：
  - headings.length === 0 ∧ collapsed → 完全隐藏（不占 DOM）
  - collapsed → w-0 overflow-hidden（CSS transition 收起）
  - !collapsed → w-56（固定宽度）
```

```tsx
function OutlinePanel({ headings, activeId, contentRef }: {
  headings: HeadingItem[]
  activeId: string | null
  contentRef: RefObject<HTMLDivElement>
}) {
  const collapsed = useStore(s => s.outlineCollapsed)

  // 无标题且折叠 → 完全不渲染
  if (headings.length === 0 && collapsed) return null

  return (
    <aside className={clsx(
      'flex-shrink-0 border-l border-gray-200 overflow-hidden transition-all duration-200',
      collapsed ? 'w-0' : 'w-56'
    )}>
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">大纲</span>
        <button onClick={toggleOutline}>✕</button>
      </div>
      <OutlineTree items={headings} activeId={activeId} />
    </aside>
  )
}
```

### OutlineTree（递归标题树）

```
递归渲染 HeadingItem[]，每个节点：
  - paddingLeft = (level - 1) * 16px（H1=0px, H2=16px, H3=32px...）
  - 有子节点时显示 ▸/▾ 折叠三角
  - activeId 匹配时高亮（蓝色背景 + 蓝色文字）
  - 点击标题 → scrollIntoView({ behavior: 'smooth' })
  - 标题文字过长 → truncate
  - 递归深度上限 6 层
```

```tsx
interface OutlineTreeProps {
  items: HeadingItem[]
  activeId: string | null
  depth?: number
}
```

标题级折叠状态用 `useState<Set<string>>` 管理，切换笔记时自动重置。

### 移动端适配（<768px）

与左 sidebar 相同的 overlay 模式：
1. 大纲按钮依然显示在内容区顶部
2. 点击后大纲面板以 overlay 形式从右侧滑入（position: fixed, z-index overlay）
3. 背景半透明遮罩层，点击遮罩或 ✕ 关闭
4. 宽度为屏幕宽度的 80%，最大 320px

## 8. 状态管理（Zustand 新增）

```typescript
// 新增状态
outlineCollapsed: boolean        // 面板折叠状态
_outlineAutoCollapsed: boolean   // 内部标记：是否因"无标题"自动折叠（区别于用户手动）

// 新增 actions
toggleOutline: () => void        // 切换折叠
setOutlineCollapsed: (collapsed: boolean, isAuto?: boolean) => void
```

**自动折叠逻辑**（在 ContentArea 或 useOutline 中处理）：

```typescript
// 当 headings 变化时：
if (headings.length === 0) {
  setOutlineCollapsed(true, true)    // 自动折叠，标记 auto
} else if (isAutoCollapsed) {
  setOutlineCollapsed(false, false)  // 之前是 auto 折叠 → 自动展开
}
// 如果用户手动折叠过，isAutoCollapsed = false，即使有标题也不自动展开
```

**localStorage 持久化：**

```typescript
// store 初始化时：
outlineCollapsed: JSON.parse(localStorage.getItem('ow-outline-collapsed') ?? 'false'),

// toggleOutline action 内：
toggleOutline: () => set(state => {
  const next = !state.outlineCollapsed
  localStorage.setItem('ow-outline-collapsed', JSON.stringify(next))
  return { outlineCollapsed: next, _outlineAutoCollapsed: false }
}),
```

## 9. 布局变更

### Before
```
┌─ Layout ─────────────────────────────────────────────┐
│ ┌─ Sidebar ────┐ ┌─ ContentArea ───────────────────┐ │
│ │              │ │  (max-w-4xl mx-auto, centered)   │ │
│ │   w-64       │ │                                  │ │
│ └──────────────┘ └──────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

### After — 折叠态
```
┌─ Layout ─────────────────────────────────────────────┐
│ ┌─ Sidebar ────┐ ┌─ ContentArea ───────────────────┐ │
│ │              │ │  (flex-1, 内容区内 max-w-4xl)   │ │
│ │   w-64       │ │                                  │ │
│ └──────────────┘ └──────────────────────────────────┘ │
```

### After — 展开态
```
┌─ Layout ───────────────────────────────────────────────────┐
│ ┌─ Sidebar ────┐ ┌─ ContentArea ───────┐ ┌─ Outline ────┐ │
│ │              │ │  (flex-1)            │ │             │ │
│ │   w-64       │ │                     │ │   w-56      │ │
│ └──────────────┘ └──────────────────────┘ └──────────────┘ │
└────────────────────────────────────────────────────────────┘
```

ContentArea 的外层容器改为 `flex flex-1`，内部内容区使用 `flex-1 max-w-4xl mx-auto` 保持现有宽度约束不变。

## 10. 边界情况与状态矩阵

| 场景 | 按钮显示 | 面板显示 | 大纲内容 |
|------|---------|---------|---------|
| 笔记无标题（空 / 纯文本） | 隐藏 | 折叠 | — |
| 笔记有标题，面板折叠 | 显示 | 折叠（w-0） | — |
| 笔记有标题，面板展开 | 显示 | 展开（w-56） | 标题树 |
| 笔记加载中 | 隐藏 | 折叠 | — |
| 笔记加载失败 | 隐藏 | 折叠 | — |
| DOM 查询异常（罕见） | 隐藏 | 折叠 | 静默降级 |
| 标题深度 ≥6 | 显示 | 展开 | 截断至 6 层 |
| 标题文字过长 | 显示 | 展开 | CSS truncate |
| 多笔记切换 | 按需 | 自动折叠/展开 | 重置标题树 |

## 11. 不包含（YAGNI）

- 拖拽调整面板宽度 — 固定宽度 w-56 足够
- 大纲搜索/过滤 — 标题数量有限，无需搜索
- 拖拽排序 — 只读工具，不需要排序
- 自定义标题图标 — 统一纯文本缩进
- 编辑模式 — 本 SPA 是只读预览，无编辑功能

## 12. 测试策略

### useOutline Hook
- `renderHook` 在 JSDOM 中测试
- 设置包含各种标题层次结构的 DOM
- 验证 headings 嵌套树结构正确
- 验证空内容返回空数组
- 验证 cleanup 断开 observer

### OutlineTree 组件
- 渲染测试：传入 mock headings
- 验证缩进层级正确（paddingLeft）
- 验证 activeId 高亮样式
- 验证 ▸/▾ 折叠展开交互
- 验证点击标题触发 scrollIntoView

### OutlinePanel 组件
- 无标题时折叠（不渲染 DOM）
- 有标题时展开
- 点击按钮切换折叠/展开
- 移动端 overlay 模式

## 13. 实现顺序

1. 新增 Zustand state（outlineCollapsed + actions + localStorage）
2. 实现 `useOutline` hook（DOM 提取 + 树构建 + IntersectionObserver）
3. 实现 `OutlineTree` 组件（递归渲染 + 折叠展开 + 高亮）
4. 实现 `OutlineToggle` 组件（SVG 图标 + 按钮）
5. 实现 `OutlinePanel` 组件（容器 + 折叠动画 + 移动端 overlay）
6. 修改 `ContentArea` 布局（三列 flex + 集成 OutlinePanel）
7. 修改 `NoteContent`（添加 ref wrapper）
8. 测试覆盖
