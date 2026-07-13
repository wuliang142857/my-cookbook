# My Cookbook Design Reference

> Night Ops Knowledge Console: a modern command-center interface for a personal
> Chinese technical knowledge base.

This file replaces the earlier paper-notebook direction. The current homepage
felt too close to an ordinary documentation site, so the next pass should move
toward a sharper, darker, more interactive developer-tool aesthetic.

The direction is framework-agnostic. Use it whether the project stays on Astro +
Starlight or moves to a custom Astro/Next/static frontend later.

## Design Intent

`my-cookbook` is not a marketing site. It is a personal retrieval system for
technical decisions, commands, debugging paths, environment setup, build notes,
and operational recipes.

The interface should feel like opening a private engineering command center at
night: searchable, dense, fast, modern, and a little cinematic. The user should
immediately feel that this is a technical archive with personality, not a themed
Starlight default.

## Reference Sources

Use these references as direction, not as templates.

### Primary Mood

- Raycast
  - Site: `https://www.raycast.com/`
  - Refero: `https://styles.refero.design/style/3b6a17f0-3bdf-418c-a95e-0b89e5a8b2f8`
  - Transfer: command-center metaphor, dark cockpit, tactile keyboard-key
    surfaces, fast launcher feeling.
  - Do not copy: oversized marketing keyboard visuals or app-store conversion
    layout.
- Linear
  - Site: `https://linear.app/`
  - Refero: `https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1`
  - Transfer: midnight precision, compact panels, thin borders, restrained
    accent color, product UI as texture.
  - Do not copy: team/project-management language, kanban as decorative filler.
- Supabase
  - Site: `https://supabase.com/`
  - Refero: `https://styles.refero.design/style/632249f1-fd78-4c77-9b34-7bae37ff3e9b`
  - Transfer: midnight IDE feeling, phosphor green punctuation, code-first
    rhythm, hairline component borders.
  - Do not copy: green as a full brand flood or SaaS conversion layout.

### Supporting Mood

- GitHub
  - Refero: `https://styles.refero.design/style/c3ceca5c-d329-4559-b947-016172941ba2`
  - Transfer: deep developer observatory, translucent panels, terminal-like
    green waypoint, dark layered canvas.
  - Use carefully: avoid purple/blue gradient-heavy hero cliches.
- Cursor
  - Site: `https://cursor.com/`
  - Refero: `https://styles.refero.design/style/4e3b4717-84c8-4599-baaf-a343c3d619b6`
  - Transfer: agent/code interface previews, terminal snippets, research-log
    feeling.
  - Do not copy: cream editorial palette from the previous direction.
- Framer and v0
  - Sites: `https://www.framer.com/`, `https://v0.dev/`
  - Transfer: large polished preview surfaces, prompt/canvas affordances, modern
    app-builder confidence.
  - Do not copy: template-gallery feel.

### Pattern References

- Mobbin web search screens
  - `https://mobbin.com/explore/web/screens/search`
  - Transfer: command palette, filtered search modal, search suggestions,
    keyboard shortcut affordances.
- Mobbin web side navigation
  - `https://mobbin.com/explore/web/ui-elements/side-navigation`
  - Transfer: compact grouped navigation, active markers, modern app density.
- Awwwards Technology / Web Interactive / Experimental
  - `https://www.awwwards.com/websites/technology/`
  - `https://www.awwwards.com/websites/web-interactive/`
  - `https://www.awwwards.com/websites/experimental/`
  - Transfer: stronger first-screen composition, controlled interactivity,
    front-end craft.
- Recent Design Tools
  - `https://recent.design/tools`
  - Transfer: current product-design taste around Raycast, Better Stack,
    Framer, Geist, Inter, modern developer tools.

## Core Design Thesis

The homepage is a command console, not an index page.

The first screen should answer:

- What can I retrieve here?
- Which route should I take first?
- What kind of technical archive is this?

The signature element is a **Knowledge Console Hero**:

```text
┌──────────────────────────────────────────────────────────────┐
│ nav: title / command search / github                         │
├───────────────────────┬──────────────────────────────────────┤
│ large title           │ command palette preview               │
│ "技术笔记索引"        │ > search build hadoop mac             │
│ short description     │ results: Hadoop / Greenplum / CMake   │
│ stats and hot routes  │ live-looking terminal/status panels   │
└───────────────────────┴──────────────────────────────────────┘
```

Below the hero, content should become a dashboard-like route map:

- Quick commands: `build`, `debug`, `deploy`, `search`, `map`, `git`.
- Topic clusters: language/runtime, data systems, environment/tooling.
- Recent or highlighted notes if the content model later supports dates.
- Article pages remain readable and code-first.

## Visual System

### Theme

Default to dark.

Use a near-black canvas with crisp type, phosphor/mint accents, small coral
hotspots, and subtle translucent panels. The result should feel modern and
technical, not gothic, gamer, cyberpunk, or purple SaaS.

Keep the interface 90% neutral. Accent colors should appear as waypoints,
active states, code markers, and command hints.

### Color Tokens

| Token | Value | Role |
| --- | --- | --- |
| `--void` | `#060708` | Page background, deepest app shell. |
| `--panel` | `#0d0f12` | Primary panels and hero console. |
| `--panel-2` | `#14171b` | Nested surfaces, sidebar hover, code headers. |
| `--panel-3` | `#1b2026` | Inputs, selected rows, elevated controls. |
| `--line` | `#27303a` | Default hairline borders. |
| `--line-strong` | `#3a4654` | Focused borders, active separators. |
| `--text` | `#f4f7fb` | Primary text. |
| `--text-soft` | `#c6ced8` | Body copy, secondary headings. |
| `--text-muted` | `#7f8a98` | Metadata and helper text. |
| `--mint` | `#3ef0a3` | Primary signal: search focus, active route, terminal cursor. |
| `--lime` | `#d8ff3e` | Rare high-energy accent for one key metric or active marker. |
| `--coral` | `#ff5f57` | Error/hotspot accent, command badges, rare warmth. |
| `--amber` | `#ffbf45` | Caution, tips, command warnings. |
| `--cyan` | `#65d9ff` | Links and low-frequency technical highlights. |

### Color Rules

- Use `--void` as the global canvas. Do not use warm paper backgrounds in the
  next design pass.
- Use `--mint` for search, active nav, focused inputs, and terminal cursor
  moments.
- Use `--lime` at most once per viewport.
- Use `--coral` only for command badges, destructive/error semantics, or one
  small hero hotspot.
- Use `--cyan` for links, never as a large filled background.
- Avoid purple, blue-purple, dark slate, beige, and brown dominance.
- Avoid decorative gradient orbs, bokeh blobs, and stock atmospheric imagery.
- If a glow is used, keep it structural: a 1px border highlight, text cursor,
  or subtle panel edge, not a floating decoration.

## Typography

The type should feel like a modern product tool that can still carry Chinese
technical text comfortably.

| Role | Font Stack | Usage |
| --- | --- | --- |
| UI / body | `Inter`, `Geist`, `Noto Sans SC`, `PingFang SC`, `Microsoft YaHei`, `system-ui`, `sans-serif` | Navigation, homepage, articles, controls. |
| Display | `Inter`, `Geist`, `Noto Sans SC`, `system-ui`, `sans-serif` | Homepage hero and section headings. |
| Mono | `JetBrains Mono`, `Berkeley Mono`, `SF Mono`, `Monaco`, `Consolas`, `monospace` | Commands, code, counters, shortcuts, route labels. |

### Type Scale

Use fixed sizes and responsive breakpoints. Do not use viewport-width font
scaling. Keep letter spacing at `0`.

| Role | Desktop | Mobile | Weight | Line height |
| --- | --- | --- | --- | --- |
| Hero display | `64px` | `42px` | `600` | `1.02` |
| Page h1 | `44px` | `32px` | `600` | `1.12` |
| Section h2 | `28px` | `24px` | `600` | `1.2` |
| Card/route title | `18px` | `17px` | `600` | `1.35` |
| Body | `16px` | `16px` | `400` | `1.72` |
| UI small | `14px` | `14px` | `500` | `1.45` |
| Mono label | `12px` | `12px` | `500` | `1.35` |
| Code | `14px` | `13px` | `500` | `1.62` |

### Typography Rules

- Use size, weight, and contrast for hierarchy. Do not rely on many colors.
- Hero text may be large and compact; article text must stay relaxed.
- Avoid 700+ weights except where Chinese glyph rendering needs clarity.
- Use monospaced text for real technical affordances only: commands, paths,
  counters, shortcuts, statuses, IDs.
- Chinese text should never feel like it was forced into a Western-only tech
  landing page.

## Layout

### App Shell

The site should feel more like a modern app than a document template.

```text
┌────────────────────────────────────────────────────────────────┐
│ sticky translucent top bar                                     │
│ title        command search                         github      │
├───────────────┬────────────────────────────────────────────────┤
│ sidebar       │ content canvas                                  │
│ grouped index │ hero console / route map / article content      │
└───────────────┴────────────────────────────────────────────────┘
```

### Homepage Structure

1. **Knowledge Console Hero**
   - Left: `技术笔记索引`, concise description, counters, hot route chips.
   - Right: command-palette preview with 3-5 realistic results.
   - Background: dark panel, hairline grid or dot matrix derived from CSS.
   - No generic hero illustration.

2. **Command Routes**
   - 6 compact route buttons: `build`, `debug`, `deploy`, `data`, `map`, `git`.
   - Each route links to a real article or category.
   - Use mono labels and short Chinese explanations.

3. **Topic Matrix**
   - Replace plain rows with a compact matrix of topic cells.
   - Each cell has category, note count, sample keywords, and first route.
   - Cells may be cards, but keep radius at `8px` and avoid heavy shadows.

4. **Operational Notes**
   - Optional short section for evergreen high-utility notes.
   - This should feel like pinned commands, not a blog feed.

### Article Layout

Article pages should retain Starlight-like usefulness but look less default:

- Dark reading surface with high-contrast text.
- Code blocks as terminal panes.
- h2 sections with small mono anchors.
- Tables as dark data grids.
- Asides as status panels with left accent bars.
- Sidebar active state should feel like a route selected in a command center.

## Components

### Top Bar

- Sticky, translucent dark panel with `backdrop-filter`.
- Height around `64px`.
- Hairline bottom border.
- Site title left, command search center or right, GitHub icon/action right.
- Search trigger should feel like a launcher: `Search notes...` plus `⌘K`.

### Command Search

Search is the product's primary interaction.

- Shape: 8px radius, dark input well, mint focus border.
- Placeholder: `Search notes, commands, configs...`
- Shortcut badge: neutral keycap treatment.
- Search modal results should look like command palette rows:
  - mono category label,
  - title,
  - short path or keywords,
  - active row with mint left bar.

### Knowledge Console Hero

- Full-width within content column.
- Border: 1px solid `--line`.
- Radius: 8px.
- Background: `--panel`.
- Add a CSS-only dot grid or scanline texture at very low opacity.
- Add a right-side terminal/search preview using real project content:
  - `how-to-build-hadoop-on-mac`
  - `git-proxy`
  - `pybind11-tips`
  - `geoserver`
  - `command-cheatsheet`
- Avoid fake analytics numbers unrelated to the archive.

### Route Chips

- Use real verbs: `Build`, `Debug`, `Deploy`, `Data`, `Map`, `Git`.
- Each chip includes a mono label and Chinese description.
- 8px radius, `--panel-2` background, `--line` border.
- Hover: mint border and subtle panel tint.

### Topic Cards

- Card radius: 8px.
- Background: `rgba(255,255,255,0.035)` or `--panel`.
- Border: 1px solid `--line`.
- No heavy shadows.
- Content:
  - mono label such as `LANG/C++`,
  - Chinese title,
  - note count,
  - 2-4 keywords,
  - arrow or command indicator.

### Sidebar

- Background: `--panel`.
- Keep it dense and app-like.
- Group headings use mono micro-label style only if it improves scanning.
- Active item:
  - dark selected row,
  - mint left bar,
  - text `--text`,
  - optional tiny route dot.
- Hover:
  - `--panel-2` fill,
  - cyan text or mint border.

### Code Blocks

- Treat code blocks as terminal panes.
- Background: `#050607` or `--void`.
- Border: 1px solid `--line`.
- Optional tiny header if Starlight exposes filename/title.
- Left border or top cursor line in `--mint`.
- Inline code: dark pill with mono font and mint/coral syntax accent.

### Tables

- Data-grid style.
- Header background: `--panel-2`.
- Row border: `--line`.
- Avoid zebra stripes unless the table is dense enough to need them.

### Asides

- Note: cyan.
- Tip: mint.
- Caution: amber.
- Danger: coral.
- Use dark panels with a left border, not bright full-color fills.

## Motion

Use motion, but make it purposeful and lightweight.

Allowed:

- 120-180ms hover/focus transitions.
- Command cursor blink in the hero.
- Search result active-row movement.
- Subtle scanline opacity shift in the hero.
- Row arrow reveal.

Avoid:

- WebGL in the first optimization pass.
- 3D hero scenes unless a later pass proves they improve retrieval.
- Decorative parallax.
- Floating blobs, bokeh, or gradient orbs.
- Continuous motion that distracts from reading.

Always respect `prefers-reduced-motion`.

## Implementation Constraints

- Current implementation is Astro + Starlight. The next pass may stay on it, but
  the design should not be limited by Starlight defaults.
- If staying on Starlight, first try CSS overrides plus richer homepage markup.
- If Starlight blocks the desired shell, consider a custom Astro layout before
  switching frameworks.
- Preserve content URLs, RSS, SEO metadata, and search.
- Do not add a UI library only for visual styling.
- Do not add large JavaScript bundles for decoration.
- Generated implementation docs should remain in English if they are for agents.
- Preserve existing user edits unless explicitly replacing them.

## Success Criteria

- First impression is modern developer command center, not default docs theme.
- Homepage has a memorable console/search surface above the fold.
- Search feels primary and useful.
- Sidebar feels like an app navigation system.
- Article pages remain comfortable for Chinese technical reading.
- Code blocks look intentional and terminal-native.
- Mobile view keeps the command-center identity without horizontal overflow.
- The design uses dark, modern atmosphere without becoming generic purple SaaS,
  gamer UI, or inaccessible low-contrast text.

## Verification Checklist

Before accepting implementation:

- `npm run build` passes.
- Desktop homepage screenshot looks visually distinct from a plain technical
  blog.
- Mobile homepage has no text overlap or horizontal scroll.
- Article page text remains readable at default browser zoom.
- Search trigger and modal are legible.
- Sidebar active state is visible without relying only on color.
- Code blocks, tables, and asides still read clearly.
- `prefers-reduced-motion` removes cursor/scanline animations.
