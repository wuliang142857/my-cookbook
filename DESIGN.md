# My Cookbook Design Reference

> Light Emacs Knowledge Console: a calm, readable, search-first interface for a
> Chinese technical knowledge base.

This document is the current design source of truth. It replaces both the older
paper-index direction and the later dark "Night Ops" command-center direction.
The site should remain a technical blog, not a dark app dashboard or a marketing
landing page.

## Design Intent

`my-cookbook` is a personal retrieval system for practical technical notes:
build paths, environment setup, command snippets, data systems, map services,
version-control fixes, and debugging context.

The interface should feel like a refined Emacs-adjacent technical notebook:
plain enough for long reading, precise enough for commands, and distinctive
enough that the homepage does not look like a stock documentation template.

## Current Direction

- Theme: light, warm, quiet.
- Mood: Emacs, Info/Org-mode, terminal notes, technical marginalia.
- Primary surface: search and route discovery.
- Article priority: readability and full-width use of available space.
- Visual density: compact, not decorative.
- Color attitude: muted wine, sepia, rust, and ink on warm paper.

Avoid:

- Dark themes as the default.
- Green/blue-dominant palettes.
- Purple SaaS gradients.
- Paper-index scrapbook styling.
- Marketing hero layouts.
- Decorative blobs, bokeh, or generic illustrations.

## Color System

The implemented theme uses these tokens in `src/styles/custom.css`:

| Token | Value | Role |
| --- | --- | --- |
| `--void` | `#f7f5ee` | Page background. |
| `--panel` | `#fffdf8` | Primary reading and navigation surface. |
| `--panel-2` | `#f0ede2` | Secondary controls and side surfaces. |
| `--panel-3` | `#e8e2d3` | Inputs, selected rows, compact panels. |
| `--line` | `#ddd6c4` | Default borders and dividers. |
| `--line-strong` | `#b8ad95` | Focused borders and stronger separators. |
| `--text` | `#202018` | Primary text. |
| `--text-soft` | `#4c493d` | Body copy and secondary headings. |
| `--text-muted` | `#777062` | Metadata and helper text. |
| `--mint` | `#8a3b3f` | Primary accent, despite legacy token name. |
| `--lime` | `#8a6424` | Sepia command labels and route markers. |
| `--coral` | `#b45a3c` | Warm highlights and warnings. |
| `--amber` | `#9a6a20` | Caution and tip accents. |
| `--cyan` | `#6d5275` | Links and quiet secondary accent. |

Color rules:

- Keep the page light and warm.
- Use wine/sepia accents sparingly for search, active states, links, and code
  metadata.
- Do not reintroduce green or blue as dominant colors.
- Avoid high-saturation fills; prefer borders, text accents, and small chips.
- Keep contrast high enough for long Chinese technical reading.

## Typography

| Role | Font Stack | Usage |
| --- | --- | --- |
| UI/body | `Inter`, `Geist`, `Noto Sans SC`, `PingFang SC`, `Microsoft YaHei`, `system-ui`, `sans-serif` | Navigation, articles, controls. |
| Mono | `JetBrains Mono`, `Berkeley Mono`, `SF Mono`, `Monaco`, `Consolas`, `monospace` | Commands, code, counters, shortcuts, paths. |

Rules:

- Use fixed font sizes and breakpoints; do not scale type with viewport width.
- Keep letter spacing at `0`.
- Use mono text only for real technical affordances.
- Article body text should stay relaxed; homepage labels can be denser.

## Layout

### Global Shell

- Use a sticky translucent light top bar.
- Sidebar stays compact and app-like.
- The right table-of-contents column is hidden so article content can use the
  full available width.
- Cards and controls use an `8px` radius or less.
- Avoid cards inside cards.

### Homepage

The homepage first screen should behave like a search console for the knowledge
base, not a landing page.

Required parts:

- Clear title: `技术笔记索引`.
- Short description focused on reusable technical notes.
- Search/command-palette preview or real search affordance.
- Quick route chips for common tasks such as `build`, `debug`, `map`, `git`.
- Topic sections that route to real categories and articles.

The first viewport should communicate the product of the site immediately:
technical notes, searchable routes, and practical command memory.

### Articles

Article pages should be calm and spacious:

- Full-width content area.
- No large empty right column.
- Code blocks must have visible syntax highlighting.
- Inline code should be readable and not visually noisy.
- Tables should behave like light data grids.
- Asides should look like technical notes, not marketing callouts.

## Components

### Search

- Search should feel like a command launcher.
- Use a visible keyboard hint where supported.
- Results should emphasize title, category, route/path, and short context.

### Code Blocks

- Code blocks should use a warm light Expressive Code theme.
- Keep code backgrounds close to `--panel`.
- Maintain strong enough contrast for shell commands and config snippets.

### Verification And SEO Assets

Search-engine verification files live in `public/`.

`public/_worker.js` exists because Cloudflare Pages clean URLs can redirect
`*.html` verification files to extensionless paths. Platforms that require an
exact `*.html` URL need direct `200 OK` responses.

## Success Criteria

- The site reads as a light technical blog, not a dark developer dashboard.
- The homepage is search-first and immediately about technical retrieval.
- Articles use the full available reading area.
- Code highlighting is visible and comfortable.
- The palette is warm and restrained, without green/blue dominance.
- SEO, RSS, sitemap, `llms.txt`, and webmaster verification remain discoverable.
