# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

- `npm run dev` — Start Vite dev server (HMR at `http://localhost:5173/obsidian-wiz/`)
- `npm run build` — Type-check (`tsc --noEmit`) + Vite production build
- `npm run preview` — Preview production build locally
- `npm test` — Run all Vitest tests once
- `npm run test:watch` — Run tests in watch mode
- `npx vitest run src/path/to/test.ts` — Run a single test file

## Architecture

### Data Sources (src/lib/)

The SPA fetches from three origins with zero backend:
- **GitHub Tree API** (`GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1`) — directory structure, cached in localStorage for 24h
- **GitHub Raw CDN** (`raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`) — Markdown file content with automatic retry
- **Cloudflare R2** (`obimg.cracklewis.site/附件/*`) — images/attachments, no code needed (just URL rewriting)

Configuration in `src/config.ts`: repo owner/name/branch, R2 base URL, cache TTL, timeouts.

### Markdown Rendering Pipeline (src/markdown/)

Pipeline order in `pipeline.ts` (unified/remark/rehype):

```
remark-parse → remark-math → remark-gfm → remark-wiki-link → remark-callout
→ remark-rehype → rehype-r2-image → rehype-katex → rehype-react (JSX output)
```

Custom plugins:
- `remark-wiki-link` — `[[笔记]]` → internal `<a>` navigation; `[[附件/*.png]]` / `![[*.png]]` → `<img>` with `附件/` prefix
- `remark-callout` — `> [!type] title` → styled callout `<div>` (supports note/warning/tip/danger)
- `rehype-r2-image` — Rewrites `<img src="附件/...">` to R2 URL

### State Management (src/stores/)

Single Zustand store (`useStore`): tree data, note content, UI state (search query, sidebar, folder expansion).

### Component Tree

```
<App> → <Layout>
  <Sidebar>
    <SearchBar />        — Filters file tree by name (real-time)
    <FileTree>           — Recursive, auto-expands to current note
      <TreeFolder>       — Collapsible folder
      <TreeFile />        — Click triggers HashRouter navigation
  <ContentArea>          — Route-driven (`/*` splat)
    states: EmptyState | Loading | NoteNotFound | ErrorDisplay | NoteContent
```

### Routing

- HashRouter (`base: '/obsidian-wiz/'` in vite.config.ts)
- `#/` → EmptyState (select a note)
- `#/path/to/note` → renders note (`.md` appended to path for fetching)

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) on push to `main`: build → `peaceiris/actions-gh-pages` pushes `dist/` to `gh-pages` branch. Enable Pages in repo settings serving from that branch.

## Key Dependencies

React 18, React Router 6 (HashRouter), Zustand, unified/remark/rehype pipeline, Tailwind CSS 3, KaTeX (math rendering), Vitest.
