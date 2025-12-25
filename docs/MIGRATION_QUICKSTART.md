# Quick Start: Migration to SvelteKit

## TL;DR - Get Started in 5 Minutes

### 1. Initialize Project

```bash
# Create new SvelteKit project
npm create svelte@latest tss-sveltekit
cd tss-sveltekit

# Select options:
# - Skeleton project
# - TypeScript: Yes
# - Add type checking: Yes
# - ESLint: Yes
# - Prettier: Yes

# Install dependencies
npm install
npm install bootstrap
```

### 2. Copy Static Assets

```bash
# Copy images and manifest
cp -r ../tss/img static/
cp ../tss/manifest.json static/
cp ../tss/favicon.ico static/
```

### 3. Create Basic Structure

```bash
mkdir -p src/lib/{components,stores,types,utils}
mkdir -p src/lib/components/{game,controls,modals}
```

### 4. First Component Example

Create `src/lib/components/controls/SettingsPanel.svelte`:

```svelte
<script lang="ts">
  import { settings } from '$lib/stores/settings';
  
  function toggle(key: keyof typeof $settings) {
    settings.update(s => ({ ...s, [key]: !s[key] }));
  }
</script>

<div class="settings-panel">
  <input 
    type="checkbox" 
    checked={$settings.showTracks}
    onchange={() => toggle('showTracks')}
  />
  <label>Show Tracks</label>
</div>
```

### 5. Create Settings Store

Create `src/lib/stores/settings.ts`:

```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface Settings {
  showBoats: boolean;
  showTracks: boolean;
  showLanelines: boolean;
  showEqualLines: boolean;
  showWindIndicators: boolean;
}

const defaults: Settings = {
  showBoats: true,
  showTracks: true,
  showLanelines: true,
  showEqualLines: true,
  showWindIndicators: true,
};

function createSettings() {
  const { subscribe, set, update } = writable<Settings>(defaults);

  if (browser) {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        set({ ...defaults, ...JSON.parse(stored) });
      } catch {}
    }
  }

  return {
    subscribe,
    update: (fn: (s: Settings) => Settings) => {
      update(current => {
        const updated = fn(current);
        if (browser) {
          localStorage.setItem('settings', JSON.stringify(updated));
        }
        return updated;
      });
    },
  };
}

export const settings = createSettings();
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` and you should see your SvelteKit app!

---

## Next Steps

1. **Migrate one component at a time** - Start with simplest (SettingsPanel)
2. **Keep old code running** - Migrate incrementally
3. **Test each component** - Ensure it works before moving on
4. **Refer to MIGRATION_GUIDE.md** - For detailed patterns and examples

---

## Key Differences to Remember

| Vanilla JS | Svelte |
|------------|--------|
| `document.getElementById()` | Direct binding: `bind:this={element}` |
| `element.innerHTML = ...` | Template: `{@html content}` |
| `addEventListener()` | `on:click={handler}` |
| Manual updates | Reactive: `$: computed = ...` |
| Global variables | Stores: `import { store } from '$lib/stores'` |

---

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Type checking
npm run check        # Run TypeScript checks
npm run check:watch  # Watch mode

# Linting
npm run lint         # Run ESLint
```

---

**Ready to start?** Follow the full [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions!

