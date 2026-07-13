# Reference Cases

This file records the refreshed visual direction for `my-cookbook` after the
first homepage sample was judged too plain and too close to an ordinary
technical documentation site.

## Selected Direction

**Night Ops Knowledge Console**

The blog should feel like a modern developer command center for retrieving
personal technical notes: dark, precise, searchable, app-like, and slightly
cinematic. It should not feel like a default Starlight documentation theme, a
paper notebook, a marketing landing page, or a generic purple SaaS site.

## Project Baseline

- Project: personal Chinese technical knowledge base.
- Current stack: Astro + Starlight, static documentation site.
- Framework scope: not fixed. The design can be implemented by extending
  Starlight, using custom Astro layouts, or moving to another static/blog
  framework if the implementation phase justifies it.
- Content: technical notes about C++, Go, Java, JavaScript, Python, databases,
  big data, maps, editors, Git, system configuration, and build/debug workflows.
- Primary surfaces: homepage, search, sidebar, article reading, code blocks,
  tables, and category discovery.
- Previous direction: `Paper Engineer Notebook`.
- Current decision: replace the paper direction with a darker command-console
  direction because the first sample still felt too traditional.

## Primary References

### Raycast

- Site: https://www.raycast.com/
- Refero Styles: https://styles.refero.design/style/3b6a17f0-3bdf-418c-a95e-0b89e5a8b2f8
- Use for: command-center metaphor, launcher/search-first experience, dark
  cockpit atmosphere, keyboard-key tactility, coral accent.
- Transfer to this blog:
  - Make search feel like the primary product interaction.
  - Treat the homepage as a command launcher into the archive.
  - Use dark panels, inset edges, keycap shortcut hints, and compact routes.
- Do not copy:
  - App-store conversion structure.
  - Oversized decorative keyboard hero.
  - Coral as a full theme color.

### Linear

- Site: https://linear.app/
- Refero Styles: https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1
- Use for: midnight precision, compact app surfaces, low-shadow depth, thin
  borders, restrained high-energy accent.
- Transfer to this blog:
  - Make topic/category navigation feel like a product surface.
  - Use hairline geometry, compact spacing, and app-like active states.
  - Let real technical content create texture.
- Do not copy:
  - Kanban/project-management metaphors as decoration.
  - Product-team marketing copy.

### Supabase

- Site: https://supabase.com/
- Refero Styles: https://styles.refero.design/style/632249f1-fd78-4c77-9b34-7bae37ff3e9b
- Use for: midnight IDE mood, phosphor green punctuation, code-editor rhythm,
  dark surfaces with subtle borders.
- Transfer to this blog:
  - Make code blocks feel terminal-native.
  - Use green as a precise signal for search/focus/active states.
  - Keep the interface mostly monochrome.
- Do not copy:
  - Green flood branding.
  - SaaS conversion blocks.

## Supporting References

### GitHub

- Refero Styles: https://styles.refero.design/style/c3ceca5c-d329-4559-b947-016172941ba2
- Use for: deep developer observatory mood, translucent dark panels, terminal
  green waypoint.
- Transfer cautiously:
  - Use layered dark panels for hero/search and code.
  - Avoid violet/blue-purple atmospheric gradients as a dominant theme.

### Cursor

- Site: https://cursor.com/
- Refero Styles: https://styles.refero.design/style/4e3b4717-84c8-4599-baaf-a343c3d619b6
- Use for: agent/code interface previews, terminal snippets, research-log
  confidence.
- Transfer to this blog:
  - Use real commands, filenames, and technical note titles as hero material.
  - Avoid fake productivity dashboards.

### Framer / v0

- Framer: https://www.framer.com/
- v0: https://v0.dev/
- Use for: polished modern app-builder surfaces, prompt/canvas affordances,
  confident large preview panels.
- Transfer to this blog:
  - Build a high-craft first viewport.
  - Use prompt/search affordances, but keep them tied to real note retrieval.

## Product Pattern References

### Mobbin Web Search Screens

- Source: https://mobbin.com/explore/web/screens/search
- Use for: command palette, filtered search modal, refined search suggestions,
  keyboard shortcuts, result rows.
- Transfer to this blog:
  - Search should be larger, more central, and more app-like.
  - Results should show category, title, route/path, and a clear active row.

### Mobbin Web Side Navigation UI

- Source: https://mobbin.com/explore/web/ui-elements/side-navigation
- Use for: compact grouped navigation, active states, hover feedback, app-like
  density.
- Transfer to this blog:
  - Sidebar should feel like a navigation system, not a generated docs list.
  - Active state needs a marker plus surface change.

## Context References

### Awwwards Technology

- Source: https://www.awwwards.com/websites/technology/
- Use for: current technology-site composition and stronger first-screen visual
  hierarchy.

### Awwwards Web Interactive

- Source: https://www.awwwards.com/websites/web-interactive/
- Use for: controlled interactivity and modern frontend craft.

### Awwwards Experimental

- Source: https://www.awwwards.com/websites/experimental/
- Use for: permission to move beyond a static docs layout.
- Constraint: avoid WebGL/3D in the first optimization pass unless it clearly
  improves retrieval.

### Recent Design Tools

- Source: https://recent.design/tools
- Use for: current product-design taste around Raycast, Better Stack, Framer,
  Geist, Inter, and modern developer tools.

## Design Decision

Generate and implement `DESIGN.md` from the Night Ops Knowledge Console
direction:

- Primary mood: Raycast command center.
- Structural discipline: Linear midnight precision.
- Code/readability layer: Supabase midnight IDE.
- Atmosphere: GitHub-like developer observatory, but without purple dominance.
- Product patterns: Mobbin search and side navigation.
- Craft benchmark: Awwwards Technology / Interactive / Experimental.
- Motion policy: allow subtle command-cursor, scanline, focus, and hover motion;
  avoid WebGL, 3D, parallax, and decorative animated blobs in the first pass.

## Success Criteria

- The homepage feels like a modern command console for retrieving technical
  notes.
- The first viewport is visually memorable and no longer resembles a plain docs
  homepage.
- Search becomes a primary product surface.
- Sidebar and topic navigation feel app-like and dense.
- Article pages remain comfortable for Chinese technical reading.
- Code blocks, tables, and asides feel terminal-native.
- The design does not become a marketing page, gamer UI, purple SaaS page, or
  inaccessible low-contrast dark theme.
