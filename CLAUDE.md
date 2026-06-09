# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

- `npm run dev` — Start Vite dev server (HMR, default at `http://localhost:5173/obsidian-wiz/`)
- `npm run build` — Type-check (`tsc --noEmit`) + Vite production build
- `npm run preview` — Preview production build locally
- `npm test` — Run all Vitest tests once
- `npm run test:watch` — Run tests in watch mode
- `npx vitest run src/path/to/test.ts` — Run a single test file

## Architecture

### Data Sources (src/lib/)

The SPA fetches from three origins with zero backend:
- **GitHub Tree API** (`GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1`) — directory structure, cached in localStorage for 24h
- **GitHub Raw CDN** (`raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`) — Markdown file content with automatic retry (2 retries, 15s timeout)
- **Cloudflare R2** (`obimg.cracklewis.site/附件/*`) — images/attachments, no code needed (just URL rewriting)

Configuration in `src/config.ts`: repo owner/name/branch (`master`), R2 base URL, cache TTL, timeouts.

Key data helpers:
- `buildNestedTree()` — converts flat GitHub API tree response into nested `TreeNode[]`
- `buildNameIndex()` — builds `Map<lowercaseName, fullPath>` from tree for wiki link resolution
- `fetchNoteContent()` — encodes path segments with `encodeURIComponent` before fetching
- Cache module (`src/lib/cache.ts`) — localStorage wrapper with TTL expiry, used for tree data

### Markdown Rendering Pipeline (src/markdown/)

Pipeline order in `pipeline.ts` (unified/remark/rehype):

```
remark-parse → remark-math → remark-gfm → remark-wiki-link → remark-callout
→ remark-rehype → rehype-highlight → rehype-heading-id → rehype-r2-image
→ rehype-katex → rehype-react (JSX output)
```

Custom plugins:
- `remark-wiki-link` — `[[笔记]]` → internal `<a>` navigation using `nameIndex` keyed by lowercase note name; `[[附件/*.png]]` / `![[*.png]]` → `<img>` with `附件/` prefix. Supports heading anchors via `[[note#heading]]` syntax, generating `?heading=` query param.
- `remark-callout` — `> [!type] title` → styled callout `<div>` (supports note/warning/tip/danger)
- `rehype-heading-id` — Adds `id` attribute to heading elements (heading text → `id`, used for scroll-to-heading)
- `rehype-r2-image` — Rewrites `<img src="附件/...">` to R2 URL

`renderMarkdown(content, nameIndex?)` creates a fresh pipeline per call (no singleton) — the `nameIndex` is passed from the Zustand store's `tree`.

### Wiki Link Resolution

`buildNameIndex(tree)` creates a `Map<lowercaseName, fullPathWithoutMd>` from the cached directory tree. When rendering a note, `NoteContent` builds this index from `useStore().tree` and passes it through the pipeline. `[[AI名词词典]]` resolves to `#/AI/AI名词词典` instead of `#/AI名词词典`. Unresolved names fall back to direct path. Duplicate names resolve to whichever is encountered first in DFS traversal.

### State Management (src/stores/)

Single Zustand store (`useStore`): tree data, note content (per-note fetch via `useNote` hook), UI state (search query, sidebar collapse, folder expansion). Note error handling distinguishes `'NOTE_NOT_FOUND'` (404) from generic errors.

### Component Tree

```
<App> → <Layout>
  <Sidebar>
    <SearchBar />        — Filters file tree by name (real-time)
    <FileTree>           — Recursive, auto-expands to current note
      <TreeFolder>       — Collapsible folder
      <TreeFile />       — Click triggers HashRouter navigation
  <ContentArea>          — Route-driven (`/*` splat + ?heading= query param)
    states: EmptyState | Loading | NoteNotFound | ErrorDisplay | NoteContent
```

### Routing

- HashRouter (`base: '/obsidian-wiz/'` in vite.config.ts)
- `#/` → EmptyState (select a note)
- `#/path/to/note` → renders note (`.md` appended to path for fetching)
- `#/path/to/note?heading=标题` → renders note + scrolls to heading via `rehype-heading-id` plugin and `scrollIntoView`

### Key Behaviors

- `.obsidian/` directories are filtered out of the file tree
- Sidebar collapses below 768px (responsive overlay)
- Code blocks use `rehype-highlight` with highlight.js; math uses KaTeX via `rehype-katex`

## Key Dependencies

React 18, React Router 6 (HashRouter), Zustand, unified/remark/rehype pipeline, Tailwind CSS 3, KaTeX, highlight.js, Vitest.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) on push to `main`: build → `peaceiris/actions-gh-pages` pushes `dist/` to `gh-pages` branch. Enable Pages in repo settings serving from that branch.
