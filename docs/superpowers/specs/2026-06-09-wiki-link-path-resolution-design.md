# Wiki 链接路径解析修复

> 设计文档 · 2026-06-09
> 状态: ✅ 已审批

## 1. 问题描述

当前 `[[笔记名]]` Wiki 链接总是生成 `#/笔记名` 的根路径链接。当笔记位于仓库子目录中时（如 `AI/AI名词词典.md`），该链接无法正确导航到目标笔记，因为实际路径应为 `#/AI/AI名词词典`。

**示例:**

| Wiki 语法 | 当前输出（错误） | 正确输出 |
|-----------|-----------------|---------|
| `[[AI名词词典]]` | `#/AI名词词典` | `#/AI/AI名词词典` |
| `[[设计草案]]` | `#/设计草案` | `#/项目A/设计草案` |

## 2. 设计方案

### 整体思路

新增「笔记名 → 完整路径」索引表（`nameIndex`），从 Zustand store 中的目录树递归构建，注入到 `remark-wiki-link` 插件中。插件在解析 `[[笔记名]]` 时查表获取实际路径，未找到时回退到当前行为。

### 2.1 nameIndex 构建

**位置**: `src/lib/github.ts`（新增 `buildNameIndex` 函数）

```
输入: TreeNode[] (目录树)
输出: Map<string, string>   (小写笔记名 → 不含.md的完整路径)
```

规则:
- 遍历所有 `.md` 文件节点
- 笔记名小写化，大小写不敏感匹配
- 同名冲突时保留第一个（GitHub Tree API 返回顺序优先）
- 路径不包含 `.md` 后缀（链接目标也不需要）

### 2.2 remark-wiki-link 插件改造

**位置**: `src/markdown/remark-wiki-link.ts`

- 插件函数接收 `nameIndex: Map<string, string>` 参数
- 解析 `[[笔记名]]` 时，先小写化查表
- 找到 → 使用索引中的完整路径生成 `#/完整路径`
- 未找到 → 回退到当前行为，直接使用 `#/笔记名`

### 2.3 Pipeline 层调整

**位置**: `src/markdown/pipeline.ts`

- `renderMarkdown` 新增可选参数 `nameIndex?: Map<string, string>`
- 每次渲染时创建新的 processor 实例（因为 `nameIndex` 可能变化，且 unified processor 创建成本极低）
- 将 `nameIndex` 传递给 `remarkWikiLink` 插件

### 2.4 NoteContent 连接 Store → Pipeline

**位置**: `src/components/NoteContent.tsx`

- 从 Zustand store 获取 `tree`
- `useMemo` 缓存 `nameIndex`，仅 `tree` 变化时重建
- `useMemo` 缓存渲染结果，仅 `content` 或 `nameIndex` 变化时重新渲染
- `tree` 未加载时（首次访问），`nameIndex` 为空 Map，wiki 链接回退到当前行为

## 3. 涉及文件及改动量

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `src/lib/github.ts` | 新增函数 | 添加 `buildNameIndex()` |
| `src/markdown/remark-wiki-link.ts` | 修改 | 接收 `nameIndex` 参数，查表解析 |
| `src/markdown/pipeline.ts` | 修改 | `renderMarkdown` 接收并传递 `nameIndex` |
| `src/components/NoteContent.tsx` | 修改 | 从 store 获取 tree，构建 index 传参 |

## 4. 边界情况处理

| 场景 | 行为 |
|------|------|
| 笔记不存在于仓库中 | 回退到当前行为，生成 `#/笔记名` |
| tree 尚未加载 | nameIndex 为空 Map，所有链接回退 |
| 同名笔记冲突 | 保留第一个遇到的路径 |
| 图片/附件链接 `[[附件/*.png]]` | 不受影响，走原有图片分支 |
| 带管道符 `[[目标\|显示名]]` | 查表用目标名，显示名逻辑不变 |

## 5. 测试场景

现有 wiki-link 测试无需修改（测试不涉及路径解析）。建议新增:

- 传入包含子目录笔记的 nameIndex，验证 `[[AI名词词典]]` → `#/AI/AI名词词典`
- 传入空 nameIndex，验证回退行为 → `#/AI名词词典`
- 同名冲突场景，验证优先取第一个

## 6. 未纳入范围

- 跨仓库 wiki 链接（不支持）
- wiki 链接的模糊匹配或自动补全（后续迭代）
- 相对路径 wiki 链接 `[[../笔记]]`（后续如有需要可扩展）
