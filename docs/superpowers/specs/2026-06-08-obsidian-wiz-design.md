# obsidian-wiz: Obsidian 仓库 Web 预览系统

> 设计文档 · 2026-06-08
> 状态: ✅ 已审批，待实现

## 1. 概述

一个纯客户端的 Obsidian 仓库预览 SPA，部署在 GitHub Pages 上。通过 GitHub API 获取目录结构，通过 Raw CDN 加载 Markdown 并在浏览器中实时渲染为 HTML，支持 Obsidian 特有的 Wiki 链接和 Callout 语法，图片/附件自动重写为 Cloudflare R2 地址。

### 核心定位

- 静态 SPA，无后端依赖
- 支持 Obsidian 仓库内容的只读浏览和导航
- 适配 GitHub Pages 部署（HashRouter）

## 2. 技术选型

| 层面 | 选择 | 理由 |
|------|------|------|
| 前端框架 | React 18+ | 生态成熟，组件化清晰 |
| 构建工具 | Vite | 快速 HMR，SPA 部署友好 |
| 路由 | React Router (HashRouter) | GH Pages 原生支持，无需服务端配置 |
| 状态管理 | Zustand | 轻量，TypeScript 支持好 |
| 样式 | Tailwind CSS | 快速搭建 gitbook 风格布局 |
| Markdown 管线 | unified + remark + rehype | 插件化 AST 处理，覆盖所有语法需求 |
| 测试 | Vitest | Vite 生态一致 |

## 3. 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Pages (SPA)                       │
│                                                                 │
│  ┌──────────┐   ┌──────────────────┐   ┌──────────────────┐    │
│  │  Sidebar  │   │  Content Area    │   │  Search Bar      │    │
│  │ ┌──────┐  │   │ ┌──────────────┐ │   │ ┌──────────────┐ │    │
│  │ │ Tree │  │   │ │ Markdown     │ │   │ │ 过滤输入框    │ │    │
│  │ │ Node │─│──┼─┼▶│ Content      │ │   │ └──────────────┘ │    │
│  │ │ ...  │  │   │ │ (实时渲染)    │ │   │                  │    │
│  │ └──────┘  │   │ └──────────────┘ │   │                  │    │
│  └──────────┘   └──────────────────┘   └──────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Markdown 处理管线 (Pipeline)               │    │
│  │                                                        │    │
│  │   Raw MD → remark-parse → remark-gfm → WikiLink →     │    │
│  │   Callout → R2 URL Rewrite → rehype-react → React     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
           │                    │                        │
           ▼                    ▼                        ▼
   GitHub Tree API       Raw CDN (MD)           Cloudflare R2
   (目录结构)              (文件内容)              (附件/图片)
```

### 数据流

1. 用户访问 SPA → HashRouter 加载
2. 检查 localStorage 中的目录树缓存（24h TTL）
   - 有缓存 → 直接使用
   - 无缓存/过期 → `GET /repos/CrackLewis/obsidian/git/trees/HEAD?recursive=1` 获取
3. 用户点击笔记或通过 Wiki 链接导航
4. 从 `raw.githubusercontent.com/CrackLewis/obsidian/main/{path}` 获取 .md 内容
5. 通过 Markdown 管线渲染为 React 组件
6. 图片/附件 URL 自动重写为 R2 地址

## 4. Markdown 渲染管线

### 处理步骤（有序）

| 步骤 | 插件 | 作用 |
|------|------|------|
| ① | `remark-parse` | 原始文本 → mdast (AST) |
| ② | `remark-gfm` | GFM 语法支持（表格、任务列表等） |
| ③ | `remark-wiki-link`（自定义） | `[[笔记]]` / `[[附件/xxx.png]]` 解析 |
| ④ | `remark-callout`（自定义） | `> [!note]` 块转换为 callout 容器 |
| ⑤ | `remark-rehype` | mdast → hast (HTML AST) |
| ⑥ | `rehype-r2-image`（自定义） | 相对路径图片重写为 R2 URL |
| ⑦ | `rehype-react` | hast → React 组件树 |

### remark-wiki-link 插件

| 语法 | 输出 |
|------|------|
| `[[笔记名]]` | `<a href="#/笔记名">笔记名</a>` |
| `[[笔记名\|显示名]]` | `<a href="#/笔记名">显示名</a>` |
| `[[附件/xxx.png]]` | `<img>` 节点（交给 rehype-r2-image） |
| `[[附件/子目录/图片.png\|alt]]` | `<img alt="alt">` 节点 |

判断逻辑：路径以 `附件/` 开头或扩展名为图片格式（png/jpg/gif/svg/webp）→ 资源链接；否则 → 笔记链接。

### remark-callout 插件

转换 `> [!type] 标题\n> 内容` 为带样式的容器：

| Callout 类型 | 颜色 |
|-------------|------|
| `note` | 蓝色 |
| `warning` | 橙色 |
| `tip` / `hint` | 绿色 |
| `danger` / `error` | 红色 |
| 其他/未识别 | 灰色 |

实现：解析 blockquote 首行 → 匹配 `^>\s*\[!(.+)\]\s*(.*)$` → 提取类型和标题 → 移除该行 → 剩余内容包裹在 `<div class="callout callout-{type}">` 中。

### rehype-r2-image 插件

扫描全部 `<img src>`，匹配以 `附件/` 或 `./附件/` 开头的 src 值，替换为 `https://obimg.cracklewis.site/` + 剩余路径。

## 5. 数据层

### 目录树

- **来源**: GitHub Tree API `GET /git/trees/HEAD?recursive=1`
- **缓存**: localStorage, key `obsidian-wiz:tree`, TTL 24h
- **结构**: 扁平响应 → 前端转换为嵌套树（递归构建）

```typescript
interface TreeNode {
  name: string
  path: string
  type: 'blob' | 'tree'
  children?: TreeNode[]
}
```

### 笔记内容

- **来源**: `https://raw.githubusercontent.com/CrackLewis/obsidian/main/{path}`
- **状态**: IDLE → LOADING → SUCCESS / ERROR（每笔独立跟踪）
- **错误处理**: 15s 超时, 最多 2 次自动重试, 间隔 1s

### 图片/附件

- **来源**: `https://obimg.cracklewis.site/附件/{path}`
- **缓存**: 浏览器自带 HTTP 缓存

## 6. 组件结构

```
<App>
  └── <HashRouter>
      └── <Layout>
          ├── <Sidebar>
          │   ├── <SearchBar />
          │   └── <FileTree>
          │       ├── <TreeFolder> (递归)
          │       └── <TreeFile />
          └── <ContentArea>
              ├── <Loading />           — 骨架屏/加载指示器
              ├── <Error />             — 错误信息 + 重试
              ├── <EmptyState />        — 未选择笔记
              ├── <NoteNotFound />      — 笔记不存在
              └── <NoteContent>         — Markdown 管线输出
```

### 组件职责

| 组件 | 职责 |
|------|------|
| Layout | 左右双栏布局，响应式切换 |
| Sidebar | 固定宽度 280-320px，小屏可折叠滑出 |
| SearchBar | 实时过滤文件树（文件名/路径匹配） |
| FileTree | 递归渲染目录树，展开/折叠，高亮当前 |
| ContentArea | 内容容器，max-width 800px 居中 |
| NoteContent | 接收管线输出的 React 组件树 |

## 7. 路由设计

```
#/                       → EmptyState
#/:path+                 → NoteContent (笔记渲染)
```

- 笔记路径对应于树 `path` 字段，去掉 `.md` 后缀
- 未匹配笔记显示 `<NoteNotFound />` 并提供返回链接
- Wiki 链接导航通过 React Router 的 `useNavigate` 实现

## 8. Zustand Store

```typescript
interface AppStore {
  tree: TreeNode[] | null
  treeLoading: boolean
  treeError: string | null
  currentPath: string | null
  noteContent: string | null
  noteLoading: boolean
  noteError: string | null
  searchQuery: string
  sidebarCollapsed: boolean
  expandedFolders: Set<string>

  fetchTree(): Promise<void>
  fetchNote(path: string): Promise<void>
  refreshTree(): Promise<void>
  setSearchQuery(q: string): void
  toggleSidebar(): void
  toggleFolder(path: string): void
}
```

## 9. UI 与样式

### 布局

- 双栏布局（CSS Grid 或 Flexbox）
- 左侧 sidebar `w-72`, `bg-gray-50`, `border-r`, `overflow-y-auto`
- 右侧 content `flex-1`, 内边距 `p-6 md:p-10`, 最大宽度 `max-w-4xl`, 居中

### 断点响应

| 宽度 | 行为 |
|------|------|
| < 768px | 单栏，侧边栏滑出式覆盖 + 遮罩层 |
| 768-1024px | 侧边栏可折叠 |
| > 1024px | 固定双栏 |

### Callout 样式

```css
.callout        { @apply border-l-4 rounded-r-lg p-4 my-4; }
.callout-note   { @apply border-l-blue-500 bg-blue-50; }
.callout-warning{ @apply border-l-orange-500 bg-orange-50; }
.callout-tip    { @apply border-l-green-500 bg-green-50; }
.callout-danger { @apply border-l-red-500 bg-red-50; }
```

## 10. 项目结构

```
obsidian-wiz/
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css                    # Tailwind 入口 + 自定义样式
│   ├── config.ts                    # 集中配置
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FileTree.tsx
│   │   ├── TreeFolder.tsx
│   │   ├── TreeFile.tsx
│   │   ├── ContentArea.tsx
│   │   ├── Loading.tsx
│   │   ├── Error.tsx
│   │   ├── EmptyState.tsx
│   │   ├── NoteNotFound.tsx
│   │   └── NoteContent.tsx
│   ├── markdown/
│   │   ├── pipeline.ts
│   │   ├── remark-wiki-link.ts
│   │   ├── remark-callout.ts
│   │   └── rehype-r2-image.ts
│   ├── stores/
│   │   └── useStore.ts
│   ├── hooks/
│   │   ├── useTree.ts
│   │   ├── useNote.ts
│   │   └── useSearch.ts
│   └── lib/
│       ├── github.ts
│       └── cache.ts
├── .github/workflows/deploy.yml
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 11. 配置

```typescript
export const CONFIG = {
  repoOwner: 'CrackLewis',
  repoName: 'obsidian',
  repoBranch: 'main',
  r2BaseUrl: 'https://obimg.cracklewis.site/',
  treeCacheTTL: 24 * 60 * 60 * 1000,   // 24 小时
  apiTimeout: 15000,                     // 15 秒
  maxRetries: 2,
}
```

## 12. 部署

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 13. 测试

- **单元测试（Vitest）**: 三个 Remark/Rehype 插件的输入输出验证、缓存逻辑测试、目录树构建逻辑测试
- **组件测试**: TreeFolder 展开/折叠状态、SearchBar 过滤、ContentArea 三态（Loading/Error/Empty）

## 14. 未选入范围

| 功能 | 状态 |
|------|------|
| Dataview 查询 | 明确排除 |
| 嵌入笔记 `![[note]]` | 后续迭代 |
| 全文搜索 | 后续迭代 |
| 暗色模式 | 后续迭代（Tailwind dark mode 可轻松添加） |
| 标签索引/聚合页 | 后续迭代 |
| 笔记的悬浮预览 | 后续迭代 |

## 15. 配置设置（非代码类）

- GitHub 仓库无需额外 Token（Tree API 对公开仓库未认证可用，60次/h 足够单用户使用）
- R2 存储桶需配置 CORS 规则允许来自 GitHub Pages 域的跨域请求
- GitHub Actions 的 GITHUB_TOKEN 自动可用
- 若需更高 API 速率限制，可在 config.ts 中配置个人 Token
