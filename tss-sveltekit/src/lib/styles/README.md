# Design System - Tactical Sailing Simulator

This directory contains the centralized design system for the TSS application.

## Structure

```
styles/
├── tokens.css      # Design tokens (colors, spacing, typography, etc.)
├── grid.css        # Grid system and layout utilities
├── layout.css      # Main layout components (sidebars, containers)
└── components.css  # Reusable component styles
```

## Design Tokens (`tokens.css`)

All design values are centralized as CSS custom properties (variables) in `tokens.css`.

### Usage

```css
/* Instead of hardcoded values */
.my-element {
  color: #007bff;
  padding: 1rem;
  font-size: 0.875rem;
}

/* Use design tokens */
.my-element {
  color: var(--color-primary);
  padding: var(--spacing-md);
  font-size: var(--font-size-sm);
}
```

### Available Tokens

#### Colors
- `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-tertiary`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- `--color-border-light`, `--color-border-medium`, `--color-border-dark`
- `--color-primary`, `--color-success`, `--color-danger`, etc.
- Game-specific colors: `--color-start-line`, `--color-layline`, `--color-mark-body`, etc.

#### Spacing
- `--spacing-xs` (4px), `--spacing-sm` (8px), `--spacing-md` (16px), `--spacing-lg` (24px), `--spacing-xl` (32px)

#### Typography
- `--font-size-xs` through `--font-size-2xl`
- `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`
- `--line-height-tight`, `--line-height-normal`, `--line-height-relaxed`

#### Layout
- `--sidebar-width-left`, `--sidebar-width-right`, `--game-width`
- Breakpoints: `--breakpoint-sm`, `--breakpoint-md`, `--breakpoint-lg`, etc.

#### Shadows & Effects
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-primary`

#### Transitions
- `--transition-fast` (0.15s), `--transition-base` (0.2s), `--transition-slow` (0.3s)

## Grid System (`grid.css`)

### Container

```html
<div class="container">
  <!-- Content -->
</div>
```

Responsive container with max-widths at different breakpoints.

### Grid Layout

```html
<div class="grid grid-cols-3 gap-md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

**Responsive columns:**
- `grid-cols-1` through `grid-cols-12`
- `md:grid-cols-2`, `md:grid-cols-3` (medium screens)
- `lg:grid-cols-3`, `lg:grid-cols-4` (large screens)

### Flexbox Utilities

```html
<div class="flex items-center justify-between gap-md">
  <span>Left</span>
  <span>Right</span>
</div>
```

**Available classes:**
- `flex`, `flex-col`, `flex-row`, `flex-wrap`
- `items-center`, `items-start`, `items-end`
- `justify-center`, `justify-between`, `justify-start`, `justify-end`
- `gap-xs`, `gap-sm`, `gap-md`, `gap-lg`, `gap-xl`

### Spacing Utilities

```html
<div class="p-md px-lg py-sm m-auto">
  <!-- Padding: medium, horizontal: large, vertical: small, margin: auto -->
</div>
```

**Padding:** `p-xs`, `p-sm`, `p-md`, `p-lg`, `p-xl`, `px-*`, `py-*`  
**Margin:** `m-xs`, `m-sm`, `m-md`, `m-lg`, `m-xl`, `mx-auto`, `my-auto`

## Layout Components (`layout.css`)

### App Layout

```html
<div class="app-layout">
  <div class="sidebar sidebar-left">...</div>
  <div class="game-stage-container">...</div>
  <div class="sidebar sidebar-right">...</div>
</div>
```

### Sidebar

```html
<div class="sidebar sidebar-left">
  <div class="sidebar-content">
    <div class="sidebar-header">
      <h5 class="sidebar-title">Title</h5>
    </div>
    <div class="sidebar-section">
      <!-- Content -->
    </div>
  </div>
</div>
```

### Cards

```html
<div class="card">
  <div class="card-header">Header</div>
  <div class="card-body">Body</div>
</div>
```

## Responsive Design

The design system includes responsive breakpoints:

- **Mobile:** `< 768px` - Sidebars stack vertically, game area takes full width
- **Tablet:** `768px - 992px` - Adjusted sidebar widths (25% each, 50% game)
- **Desktop:** `992px - 1200px` - Standard layout (18% each, 64% game)
- **Large Desktop:** `> 1200px` - Full layout (20% each, 60% game)

Breakpoints are defined in `tokens.css` and automatically adjust layout variables.

## Best Practices

1. **Always use design tokens** - Never hardcode colors, spacing, or typography values
2. **Use utility classes** - Prefer grid/flex utilities over custom CSS when possible
3. **Follow the structure** - Use layout components (`app-layout`, `sidebar`, etc.) for consistency
4. **Responsive first** - Design mobile-first, then enhance for larger screens
5. **Component styles** - Put reusable component styles in `components.css`, not inline

## Migration Guide

When refactoring existing code:

1. Replace hardcoded colors with `var(--color-*)` tokens
2. Replace hardcoded spacing with `var(--spacing-*)` tokens
3. Replace inline styles with utility classes where possible
4. Move component-specific styles to `components.css`
5. Use layout classes instead of inline positioning

## Examples

### Before (Hardcoded)
```html
<div style="padding: 1rem; background: #ffffff; color: #212529;">
  <button style="background: #007bff; padding: 0.5rem 1rem;">Click</button>
</div>
```

### After (Design System)
```html
<div class="card p-md">
  <button class="btn btn-primary px-lg py-sm">Click</button>
</div>
```

