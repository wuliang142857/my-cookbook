# Reference Cases

This file records the current visual direction for `my-cookbook`.

## Current Direction

**Light Emacs Knowledge Console**

The blog should feel like a calm technical notebook with command-console
affordances: light, readable, precise, searchable, and a little idiosyncratic.
It should not feel like a dark command center, a paper scrapbook, a generic
Starlight documentation site, or a marketing landing page.

## Project Baseline

- Project: personal Chinese technical knowledge base.
- Stack: Astro + Starlight, deployed as a static Cloudflare Pages site.
- Content: technical notes about C++, Go, Java, JavaScript, Python, databases,
  big data, maps, editors, Git, system configuration, and build/debug workflows.
- Primary surfaces: homepage, search, sidebar, article reading, code blocks,
  tables, and category discovery.
- Current implementation: warm light Emacs-style theme in
  `src/styles/custom.css`.

## Reference Direction

### GNU Emacs / Info / Org-mode

- Use for: technical plainness, command-first interaction, text-forward density,
  and a tool-like mood.
- Transfer to this blog:
  - Prefer useful labels, commands, and paths over decorative copy.
  - Keep long-form reading comfortable.
  - Let code and notes create texture.
- Do not copy:
  - Raw default editor chrome.
  - Low-contrast terminal nostalgia.

### Technical Manuals

- Use for: clarity, stable hierarchy, content over decoration.
- Transfer to this blog:
  - Make headings and sections easy to scan.
  - Keep code blocks and tables central to the reading experience.
  - Avoid hiding practical details behind visual flourishes.

### Command Palettes

- Use for: search-first retrieval.
- Transfer to this blog:
  - Treat search as a primary route into the archive.
  - Show real categories, article titles, and command-like route chips.
  - Keep shortcut hints and input styling familiar.

### Light Product Tools

- Use for: modern polish without dark SaaS defaults.
- Transfer to this blog:
  - Use subtle borders, restrained surfaces, and tight controls.
  - Keep cards shallow and purposeful.
  - Maintain an app-like top bar and sidebar.

## Previous Directions To Avoid

- `Paper Engineer Notebook`: too close to a decorative paper index.
- `Night Ops Knowledge Console`: too dark for the current technical-blog goal.
- Green/blue command-center palettes: rejected as visually unsuitable here.

## Current Decision

Use the light Emacs-inspired direction:

- Warm paper background.
- Ink-like body text.
- Muted wine/sepia/rust accents.
- Search-first homepage.
- Full-width article reading.
- Visible code highlighting.
- Minimal decorative imagery.

## Success Criteria

- The first screen no longer resembles a plain docs index.
- The palette is light and elegant, without green/blue dominance.
- Search and topic routing feel like real retrieval tools.
- Article pages are comfortable for Chinese technical reading.
- Code blocks, tables, inline code, and asides stay legible.
- The design documentation matches the implemented Starlight theme.
