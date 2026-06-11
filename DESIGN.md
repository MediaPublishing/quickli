# DESIGN.md — Quickli Share

> Design system for Quickli: an Obsidian plugin + WordPress plugin for sharing notes as unlisted web pages. Two distinct surfaces — the Obsidian plugin modal and the WordPress shared-note page.

---

## Product Character

Quickli is a tool for people who care deeply about their notes. The UX must honor the context of use: someone in a writing flow who wants to share with minimal friction. The Obsidian plugin surface should feel like it belongs inside Obsidian — respecting its CSS variable system, its minimal aesthetic. The WordPress-rendered shared page should feel like a clean reading environment, not a generic blog post.

---

## Typography System

### Obsidian Plugin

All typography defers to Obsidian's host theme via CSS variables. **Do not hardcode font families, font sizes, or colors in the plugin.**

```css
/* Correct pattern */
font-family: var(--font-interface);
font-size: var(--font-ui-medium);
color: var(--text-normal);
```

Required Obsidian variable references:
- `--font-interface` — UI font
- `--font-text` — Reading font
- `--font-monospace` — Code font
- `--font-ui-small`, `--font-ui-medium`, `--font-ui-large` — Size scale
- `--font-ui-smaller` — Micro labels (timestamps, metadata)

### WordPress Shared Page

Design recommendation for the rendered note page:

| Role       | Font                              | Source            |
|------------|-----------------------------------|-------------------|
| Body text  | `Georgia, 'Times New Roman', serif` | System serif    |
| UI chrome  | `system-ui, sans-serif`           | System sans       |
| Code       | `ui-monospace, 'JetBrains Mono', monospace` | System mono |

Rationale: a shared note should feel like a document being read, not a web product being used. Serif body text signals "this is content worth reading." The UI chrome (password form, expiry notice) stays sans-serif for contrast.

Scale for WordPress page:
- Body: 18px, `line-height: 1.7`
- H1: 2rem, weight 700, `letter-spacing: -0.02em`
- H2/H3: 1.5rem / 1.2rem
- Code blocks: 0.9rem

---

## Color Palette

### Obsidian Plugin

Use only Obsidian CSS variables. No hardcoded colors. Key variables:

```css
--background-primary      /* Modal/panel background */
--background-secondary    /* Input fields, inset areas */
--background-modifier-border /* Input borders */
--text-normal             /* Primary text */
--text-muted              /* Secondary text, labels */
--text-accent             /* Links, active states */
--interactive-accent      /* Button backgrounds */
--interactive-accent-hover /* Button hover */
```

The styles.css file already follows this pattern — preserve it.

### WordPress Shared Page

| Token            | Suggested Value | Use                          |
|------------------|-----------------|------------------------------|
| Background       | `#fefefe`       | Reading canvas               |
| Text             | `#1a1a1a`       | Body text — warm near-black  |
| Text muted       | `#6b7280`       | Metadata, timestamps         |
| Border           | `#e5e7eb`       | Dividers, note chrome borders|
| Accent           | `#2563eb`       | Links                        |
| Surface          | `#f9fafb`       | Code block backgrounds       |

Dark mode (WordPress): respect `@media (prefers-color-scheme: dark)` — invert background to `#111827`, text to `#f9fafb`.

---

## Layout Principles

### Obsidian Plugin Modal

- Standard Obsidian modal width: ~550px (do not set fixed width — let Obsidian handle it)
- Vertical sections with clear separation
- Input fields full-width within modal
- Actions row at the bottom: secondary action left, primary action right
- Compact spacing: 8px–12px between elements (Obsidian modal density is medium-tight)

### WordPress Shared Note Page

- Single column, centered, `max-width: 720px`
- `padding: 2rem 1.5rem` (mobile), `padding: 4rem 2rem` (desktop)
- No sidebar, no navigation, no related posts
- Header: minimal — note title + optional password/expiry indicator
- Footer: minimal — "Shared with Quickli" attribution, no marketing

---

## Component Tone

### Obsidian Modal (Share Dialog)

- **Password field:** optional, collapsible — show only when toggled
- **Expiry selector:** dropdown or segmented control, not a free-text date
- **Share URL display:** read-only input with copy button inline
- **Action buttons:** use Obsidian's `mod-cta` class for primary, no custom styling
- **Status feedback:** inline below the action, not a toast

### WordPress Page — Password Form

- Simple: one input, one button
- Error state: red border on input + brief error message below
- No modal overlay — the form should be the page's primary content

### WordPress Page — Note Chrome

- Expiry notice: subtle banner at top — `--text-muted` color, small font
- Password-protected badge: if the share has a password set, note this in the URL bar or page title
- "Revoked" state: clear, brief message — no 404 by default

---

## Motion Principles

- Obsidian plugin: no custom animations — use Obsidian's built-in modal transitions
- Copy-to-clipboard button: brief icon swap (clipboard → check), `500ms` timeout, no elaborate animation
- WordPress page: no entrance animations on content — load instantly
- Password form: shake animation on wrong password (`200ms`, 3 cycles, `4px` horizontal) — the one place motion earns its place

---

## Anti-Patterns

- **No hardcoded colors in the Obsidian plugin** — it must work with all Obsidian themes, including AMOLED dark and bright light themes
- **No Obsidian plugin-specific icons** that conflict with the host theme's icon set — use Obsidian's `setIcon()` API
- **No marketing copy on the shared WordPress page** — the reader came for a note, not a pitch for Quickli
- **No comments section, no social sharing buttons** on the shared page
- **No sticky headers on the WordPress note page** — distraction-free reading
- **No gradient backgrounds** on either surface
- **No `!important`** in plugin CSS — it breaks theme overrides

---

## Implementation Notes

- Plugin CSS: `obsidian-plugin/styles.css` — minimal, Obsidian-variable-only approach is correct
- Plugin entry: `obsidian-plugin/main.ts`
- WordPress plugin: `wordpress-plugin/` — rendered page styles should live in a dedicated CSS file, not inline
- The plugin uses Obsidian's `Modal` class — all modal layout decisions defer to that class's structure
