# CLAUDE.md

This file provides guidance for Claude Code when working with this project.

## Overview

**my-cookbook** is a personal knowledge base blog built with Astro and Starlight theme. It contains technical articles covering programming languages (C++, Go, Java, JavaScript, Python), databases, big data, and various development tips.

- **Site URL**: https://www.wuliang142857.me/
- **Language**: Chinese (zh-CN)
- **Framework**: Astro 5.x + Starlight 0.37.x
- **Deployment**: Cloudflare Pages via GitHub Actions

## Project Structure

```
my-cookbook/
├── astro.config.mjs          # Astro + Starlight configuration
├── package.json              # Dependencies (astro, starlight, rss, sharp)
├── tsconfig.json             # TypeScript strict mode
├── src/
│   ├── content/
│   │   └── docs/             # Markdown documentation (49 Markdown pages)
│   │       ├── bigdata/      # Hadoop, Greenplum, Elasticsearch
│   │       ├── cpp/          # Cross-compile, CMake, cJSON
│   │       ├── database/     # PostgreSQL, distributed DB
│   │       ├── editor/       # IDE configuration, LSP
│   │       ├── go/           # CGO cross-compile
│   │       ├── java/         # Maven tips
│   │       ├── javascript/   # npm, webpack, node-gyp
│   │       ├── map/          # GeoServer, POI, OSM
│   │       ├── python/       # pip, pybind11, pyftpdlib
│   │       ├── toy/          # Linux/macOS tips, tools
│   │       └── version-control/ # Git configuration
│   ├── pages/
│   │   └── rss.xml.js        # RSS feed generator
│   └── styles/
│       └── custom.css        # Emacs-style light theme
├── public/
│   ├── _worker.js            # Exact 200 responses for selected verification files
│   ├── robots.txt            # SEO + AI crawler rules
│   ├── llms.txt              # AI-friendly site summary
│   ├── favicon.ico           # Site favicon
│   ├── site.webmanifest      # Install/icon metadata
│   └── logo.svg              # Site logo
└── .github/
    └── workflows/
        └── github-actions-publish.yml  # Auto-deploy to Cloudflare
```

## Setup & Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Regenerate SEO discovery assets only
npm run seo:generate

# Preview production build
npm run preview
```

## Content Guidelines

### Adding New Articles

1. Create a new `.md` file in the appropriate category under `src/content/docs/`
2. Add frontmatter with `title` and `description`:
   ```yaml
   ---
   title: Article Title Here
   description: One concise search/result summary.
   ---
   ```
3. Write content in Markdown format
4. The sidebar auto-generates from the directory structure

### Article Categories

| Directory | Label | Description |
|-----------|-------|-------------|
| `bigdata/` | 大数据 | Hadoop, Spark, Elasticsearch |
| `cpp/` | C++ | Compilation, cross-compile, CMake |
| `database/` | 数据库 | PostgreSQL, distributed databases |
| `editor/` | 编辑器 | IDE setup, LSP, fonts |
| `go/` | Go | CGO, cross-compilation |
| `java/` | Java | Maven, build tools |
| `javascript/` | JavaScript | npm, webpack, Node.js |
| `map/` | 地图 | GeoServer, OSM, POI |
| `python/` | Python | pip, pybind11 |
| `toy/` | 瞎折腾 | Linux/macOS tips, tools |
| `version-control/` | 版本控制 | Git configuration |

## Architecture

### Key Configuration Files

- **`astro.config.mjs`**: Starlight theme config, sidebar categories, SEO meta tags, RSS/sitemap/llms discovery links, JSON-LD structured data
- **`src/styles/custom.css`**: Emacs-style light theme with Inter + Noto Sans SC fonts, code blocks using JetBrains Mono
- **`src/pages/rss.xml.js`**: RSS 2.0 feed generator using @astrojs/rss
- **`scripts/generate-seo-assets.mjs`**: Generates `public/llms.txt`, `public/robots.txt`, and compatibility `public/sitemap.xml` before production builds
- **`public/_worker.js`**: Cloudflare Pages worker that serves selected webmaster verification files with direct `200 OK` responses instead of clean-URL redirects

### Features

- **Search**: Pagefind (built into Starlight, auto-indexed on build)
- **SEO**: generated robots.txt, generated llms.txt, sitemap index, compatibility sitemap, meta tags, Open Graph, Twitter Cards, JSON-LD
- **Search submission**: IndexNow publish hook plus Google, Bing, Baidu, and ByteDance verification assets
- **AI Crawlers**: Explicitly allowed (GPTBot, ClaudeBot, etc.)
- **Theme**: Custom Emacs-style light theme with warm paper surfaces and muted wine/sepia accents

## Deployment

Deployment is automatic via GitHub Actions:

1. Push to `main` branch triggers workflow
2. Workflow runs `npm ci` and `npm run build`; build first runs `npm run seo:generate`
3. Built `dist/` folder is deployed to Cloudflare Pages
4. Workflow runs non-blocking IndexNow submission after deployment

**Required Secrets**:
- `CF_API_TOKEN`: Cloudflare API token
- `CF_ACCOUNT_ID`: Cloudflare account ID

## Common Tasks

### Modify Theme Colors
Edit `src/styles/custom.css` CSS variables in `:root` section.

### Add New Category
1. Create directory under `src/content/docs/`
2. Add category to `sidebar` array in `astro.config.mjs`

### Update SEO Metadata
Edit the `head` array in `astro.config.mjs` for meta tags and structured data.
