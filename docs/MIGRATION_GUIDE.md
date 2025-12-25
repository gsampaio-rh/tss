# Migration Guide: TSS to SvelteKit + TypeScript

## Overview

This guide outlines the migration strategy from vanilla JavaScript to SvelteKit with TypeScript for the Tactical Sail Simulator project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Migration Phases](#migration-phases)
4. [Architecture Decisions](#architecture-decisions)
5. [Component Mapping](#component-mapping)
6. [State Management](#state-management)
7. [Step-by-Step Migration](#step-by-step-migration)
8. [Common Patterns](#common-patterns)
9. [Testing Strategy](#testing-strategy)
10. [Performance Considerations](#performance-considerations)

---

## Prerequisites

### Tools Required
- Node.js 18+ and npm/pnpm/yarn
- Git (for version control during migration)
- VS Code (recommended) with Svelte extension

### Knowledge Required
- Basic understanding of Svelte/SvelteKit
- TypeScript fundamentals
- Component-based architecture concepts

---

## Project Structure

### Current Structure
```
tss/
├── index.html
├── js/
│   ├── game.js
│   ├── gamestate.js
│   ├── controls.js
│   ├── settings.js
│   ├── winddata.js
│   ├── windeditor.js
│   └── ...
├── css/
└── img/
```

### Target Structure
```
tss-sveltekit/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── game/
│   │   │   │   ├── GameCanvas.svelte
│   │   │   │   ├── Boat.svelte
│   │   │   │   ├── WindParticles.svelte
│   │   │   │   └── Marks.svelte
│   │   │   ├── controls/
│   │   │   │   ├── PlayerControl.svelte
│   │   │   │   ├── SettingsPanel.svelte
│   │   │   │   └── WindSelector.svelte
│   │   │   └── modals/
│   │   │       ├── WindEditor.svelte
│   │   │       ├── CupModal.svelte
│   │   │       └── HelpModal.svelte
│   │   ├── stores/
│   │   │   ├── game.ts
│   │   │   ├── settings.ts
│   │   │   ├── wind.ts
│   │   │   └── cup.ts
│   │   ├── utils/
│   │   │   ├── gameLogic.ts
│   │   │   ├── windCalculations.ts
│   │   │   └── fileHandling.ts
│   │   └── types/
│   │       ├── game.ts
│   │       ├── boat.ts
│   │       └── wind.ts
│   ├── routes/
│   │   └── +page.svelte
│   └── app.html
├── static/
│   ├── img/
│   └── manifest.json
├── package.json
├── tsconfig.json
└── svelte.config.js
```

---

## Migration Phases

### Phase 1: Foundation (Week 1)
**Goal:** Set up SvelteKit project and migrate core logic

**Tasks:**
1. Initialize SvelteKit project
2. Set up TypeScript
3. Migrate game logic classes (`Game`, `Boat`, `PlayerStory`)
4. Create type definitions
5. Set up stores for state management
6. Migrate utility functions

**Deliverables:**
- Working SvelteKit project
- Type-safe game logic
- Basic stores setup

### Phase 2: UI Components (Weeks 2-3)
**Goal:** Migrate UI components one by one

**Priority Order:**
1. Settings Panel (simplest, isolated)
2. Wind Selector
3. Player Controls
4. Game Canvas (most complex)
5. Modals (Wind Editor, Cup, Help)

**Deliverables:**
- All UI components migrated
- Reactive UI updates
- Component reusability

### Phase 3: Integration & Polish (Week 4)
**Goal:** Connect everything and optimize

**Tasks:**
1. Wire up all components
2. Implement animations
3. Performance optimization
4. Testing
5. PWA setup
6. Build optimization

**Deliverables:**
- Fully functional migrated app
- Performance benchmarks
- Test coverage

---

## Architecture Decisions

### 1. State Management: Svelte Stores

**Why:** Built-in, simple, reactive, no external dependencies

**Structure:**
```typescript
// src/lib/stores/game.ts
import { writable } from 'svelte/store';
import type { Game } from '../types/game';

export const gameStore = writable<Game | null>(null);
export const turnCount = writable<number>(0);
export const isStart = writable<boolean>(true);
```

### 2. Component Architecture

**Pattern:** Container/Presentational Components
- **Container:** Manages state, handles logic (`GameCanvas.svelte`)
- **Presentational:** Pure UI, receives props (`Boat.svelte`)

### 3. SVG Handling

**Approach:** Use Svelte's SVG support directly
```svelte
<svg viewBox="0 0 {game.width} {game.height}">
  {#each game.players as player}
    <Boat {player} />
  {/each}
</svg>
```

### 4. Animations

**Approach:** Svelte transitions + CSS
```svelte
{#if showParticles}
  <WindParticles 
    particles={windParticles}
    transition:fly={{ duration: 300 }}
  />
{/if}
```

---

## Component Mapping

### Current → Svelte Components

| Current | Svelte Component | Location |
|---------|------------------|----------|
| `createControl()` | `<PlayerControl>` | `lib/components/controls/` |
| `drawBoat()` | `<Boat>` | `lib/components/game/` |
| `drawWindIndicators()` | `<WindParticles>` | `lib/components/game/` |
| `windEditorStart()` | `<WindEditor>` | `lib/components/modals/` |
| Settings HTML | `<SettingsPanel>` | `lib/components/controls/` |
| Cup HTML | `<CupModal>` | `lib/components/modals/` |

---

## State Management

### Store Structure

```typescript
// src/lib/stores/game.ts
import { writable, derived } from 'svelte/store';
import { Game } from '../types/game';
import { Boat } from '../types/boat';

export const game = writable<Game | null>(null);
export const players = writable<Boat[]>([]);
export const turnCount = writable<number>(0);
export const isStart = writable<boolean>(true);

// Derived stores
export const currentWind = derived(
  [game, turnCount],
  ([$game, $turnCount]) => 
    $game?.getWind($turnCount + 1) ?? 0
);

// Actions
export const gameActions = {
  turn: () => {
    turnCount.update(n => n + 1);
    // Update players, etc.
  },
  backTurn: () => {
    turnCount.update(n => Math.max(0, n - 1));
  },
  reset: () => {
    turnCount.set(0);
    isStart.set(true);
  }
};
```

```typescript
// src/lib/stores/settings.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface Settings {
  showBoats: boolean;
  showTracks: boolean;
  showLanelines: boolean;
  showEqualLines: boolean;
  showWindIndicators: boolean;
}

const defaultSettings: Settings = {
  showBoats: true,
  showTracks: true,
  showLanelines: true,
  showEqualLines: true,
  showWindIndicators: true,
};

function createSettingsStore() {
  const { subscribe, set, update } = writable<Settings>(defaultSettings);

  // Load from localStorage on init
  if (browser) {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        set({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
  }

  return {
    subscribe,
    set,
    update: (updater: (s: Settings) => Settings) => {
      update(current => {
        const updated = updater(current);
        if (browser) {
          localStorage.setItem('settings', JSON.stringify(updated));
        }
        return updated;
      });
    },
    reset: () => set(defaultSettings),
  };
}

export const settings = createSettingsStore();
```

---

## Step-by-Step Migration

### Step 1: Initialize SvelteKit Project

```bash
npm create svelte@latest tss-sveltekit
cd tss-sveltekit
npm install
```

**Options:**
- Template: Skeleton project
- TypeScript: Yes
- Add type checking: Yes
- ESLint: Yes
- Prettier: Yes

### Step 2: Install Dependencies

```bash
npm install -D @types/node
npm install bootstrap  # Keep Bootstrap for UI
```

### Step 3: Migrate Types

Create `src/lib/types/game.ts`:

```typescript
export interface Mark {
  x: number;
  y: number;
  type: MarkType;
}

export enum MarkType {
  StartLeft = 0,
  StartRight = 1,
  Mark1 = 2,
}

export interface GameState {
  width: number;
  height: number;
  marks: Mark[];
  wind: number[];
  turncount: number;
  isStart: boolean;
  name: string;
  currentStartPriority: number;
}

export class Game {
  width: number = 0;
  height: number = 0;
  marks: Mark[] = [];
  wind: number[] = [];
  turncount: number = 0;
  isStart: boolean = true;
  name: string = '';
  currentStartPriority: number = 0;
  players: Boat[] = [];

  getWind(index: number): number {
    return this.wind[index % this.wind.length];
  }

  // ... rest of Game class methods
}
```

### Step 4: Create First Component

`src/lib/components/controls/SettingsPanel.svelte`:

```svelte
<script lang="ts">
  import { settings } from '$lib/stores/settings';
  
  function toggleSetting(key: keyof typeof $settings) {
    settings.update(s => ({ ...s, [key]: !s[key] }));
  }
</script>

<div class="btn-group col w-100" role="group">
  <input 
    class="btn-check" 
    type="checkbox" 
    id="set-show-tracks"
    checked={$settings.showTracks}
    onchange={() => toggleSetting('showTracks')}
  />
  <label class="btn btn-outline-secondary" for="set-show-tracks">
    Show Tracks
  </label>
  
  <!-- More settings... -->
</div>
```

### Step 5: Migrate Game Canvas

`src/lib/components/game/GameCanvas.svelte`:

```svelte
<script lang="ts">
  import { game, players, currentWind } from '$lib/stores/game';
  import { settings } from '$lib/stores/settings';
  import Boat from './Boat.svelte';
  import WindParticles from './WindParticles.svelte';
  import Marks from './Marks.svelte';
  
  $: gridSize = 20;
  $: viewBox = `0 0 ${$game?.width ?? 0} ${$game?.height ?? 0}`;
</script>

<div class="game-area">
  <svg 
    viewBox={viewBox}
    class="game-canvas"
  >
    {#if $settings.showTracks}
      <g id="tracks">
        {#each $players as player}
          <polyline 
            points={player.trackPoints}
            stroke={player.color}
            fill="none"
          />
        {/each}
      </g>
    {/if}
    
    <Marks marks={$game?.marks ?? []} />
    
    {#if $settings.showBoats}
      {#each $players as player}
        <Boat {player} />
      {/each}
    {/if}
    
    {#if $settings.showWindIndicators}
      <WindParticles wind={$currentWind} />
    {/if}
  </svg>
</div>
```

---

## Common Patterns

### Pattern 1: Reactive Updates

**Before (Vanilla JS):**
```javascript
function updateControls() {
  for (var i = 0; i < game.players.length; i++) {
    game.players[i].posLabel.innerText = "";
    if (game.players[i].finished) {
      // Update UI...
    }
  }
}
```

**After (Svelte):**
```svelte
<script>
  import { players } from '$lib/stores/game';
</script>

{#each $players as player}
  <div class="player-control">
    {#if player.finished}
      <span>Position: {player.position}</span>
    {/if}
  </div>
{/each}
```

### Pattern 2: Event Handling

**Before:**
```javascript
document.getElementById("btn-apply").addEventListener("click", apply);
```

**After:**
```svelte
<button on:click={apply}>Start!</button>
```

### Pattern 3: Conditional Rendering

**Before:**
```javascript
if (settings.showBoats) {
  gameArea.setAttribute("data-show-boats", "full");
} else {
  gameArea.setAttribute("data-show-boats", "dot");
}
```

**After:**
```svelte
{#if $settings.showBoats}
  <Boat {player} />
{:else}
  <div class="boat-dot" style="background: {player.color}"></div>
{/if}
```

### Pattern 4: Animations

**Before:**
```javascript
particle.style.left = formatCssPx(particle.x * gridsize);
particle.style.top = formatCssPx(particle.y * gridsize);
```

**After:**
```svelte
<line
  x1={particle.x * gridSize}
  y1={particle.y * gridSize}
  x2={(particle.x + dx) * gridSize}
  y2={(particle.y + dy) * gridSize}
  transition:draw={{ duration: 100 }}
/>
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// src/lib/utils/gameLogic.test.ts
import { describe, it, expect } from 'vitest';
import { Game } from '../types/game';

describe('Game', () => {
  it('should calculate wind correctly', () => {
    const game = new Game();
    game.wind = [10, 20, 30];
    expect(game.getWind(0)).toBe(10);
    expect(game.getWind(3)).toBe(10); // Wraps around
  });
});
```

### Component Tests (Testing Library)

```typescript
// src/lib/components/controls/SettingsPanel.test.ts
import { render, screen } from '@testing-library/svelte';
import SettingsPanel from './SettingsPanel.svelte';

test('toggles setting on click', async () => {
  render(SettingsPanel);
  const checkbox = screen.getByLabelText('Show Tracks');
  await fireEvent.click(checkbox);
  expect(checkbox).toBeChecked();
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/game.spec.ts
import { test, expect } from '@playwright/test';

test('can start a race', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start!")');
  await expect(page.locator('.race-controls')).toBeVisible();
});
```

---

## Performance Considerations

### 1. Reactive Statements

**Use `$:` sparingly:**
```svelte
<!-- Good: Specific reactive statement -->
$: currentWind = $game?.getWind($turnCount + 1) ?? 0;

<!-- Bad: Too broad -->
$: everything = { game: $game, players: $players, /* ... */ };
```

### 2. Keyed Each Blocks

**Always use keys:**
```svelte
{#each $players as player (player.id)}
  <Boat {player} />
{/each}
```

### 3. Lazy Loading

**Load heavy components on demand:**
```svelte
<script>
  import { onMount } from 'svelte';
  let WindEditor;
  
  onMount(async () => {
    if (showEditor) {
      WindEditor = (await import('./WindEditor.svelte')).default;
    }
  });
</script>

{#if WindEditor}
  <svelte:component this={WindEditor} />
{/if}
```

### 4. SVG Optimization

**Use `will-change` for animated elements:**
```svelte
<line
  x1={x1}
  y1={y1}
  style="will-change: x1, y1, x2, y2;"
/>
```

---

## Migration Checklist

### Phase 1: Foundation
- [ ] Initialize SvelteKit project
- [ ] Set up TypeScript
- [ ] Create type definitions for Game, Boat, Settings
- [ ] Migrate Game class to TypeScript
- [ ] Migrate Boat class to TypeScript
- [ ] Create game store
- [ ] Create settings store
- [ ] Create wind store
- [ ] Migrate utility functions
- [ ] Set up testing framework

### Phase 2: Components
- [ ] SettingsPanel component
- [ ] WindSelector component
- [ ] PlayerControl component
- [ ] GameCanvas component
- [ ] Boat component
- [ ] WindParticles component
- [ ] Marks component
- [ ] WindEditor modal
- [ ] CupModal component
- [ ] HelpModal component

### Phase 3: Integration
- [ ] Wire up all stores
- [ ] Connect all components
- [ ] Implement animations
- [ ] Add transitions
- [ ] Performance optimization
- [ ] Write unit tests
- [ ] Write component tests
- [ ] Write E2E tests
- [ ] PWA configuration
- [ ] Build optimization
- [ ] Documentation

---

## Common Pitfalls & Solutions

### Pitfall 1: Store Updates Not Triggering

**Problem:** Changes to nested objects don't trigger reactivity

**Solution:**
```typescript
// Bad
game.update(g => {
  g.players[0].x = 10; // Won't trigger
  return g;
});

// Good
game.update(g => ({
  ...g,
  players: g.players.map((p, i) => 
    i === 0 ? { ...p, x: 10 } : p
  )
}));
```

### Pitfall 2: Memory Leaks with Event Listeners

**Problem:** Event listeners not cleaned up

**Solution:**
```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  
  let animationId;
  
  onMount(() => {
    function animate() {
      // animation logic
      animationId = requestAnimationFrame(animate);
    }
    animate();
  });
  
  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
</script>
```

### Pitfall 3: SVG Coordinate System

**Problem:** SVG coordinates vs screen coordinates

**Solution:**
```svelte
<script>
  const gridSize = 20;
  $: svgX = (gameX * gridSize).toFixed(2);
  $: svgY = (gameY * gridSize).toFixed(2);
</script>

<circle cx={svgX} cy={svgY} r="5" />
```

---

## Resources

### Documentation
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools
- [Svelte REPL](https://svelte.dev/repl) - Test components online
- [Svelte DevTools](https://github.com/RedHatter/svelte-devtools) - Browser extension

### Examples
- [SvelteKit Examples](https://github.com/sveltejs/kit/tree/main/packages/kit/examples)
- [Real-world SvelteKit apps](https://github.com/sveltejs/kit#real-world-apps)

---

## Next Steps

1. **Review this guide** - Understand the migration approach
2. **Set up development environment** - Install tools
3. **Create proof of concept** - Migrate one component (SettingsPanel)
4. **Iterate** - Migrate components one by one
5. **Test continuously** - Ensure functionality at each step
6. **Deploy incrementally** - Can run both versions in parallel

---

## Support

For questions or issues during migration:
1. Check SvelteKit documentation
2. Review component examples
3. Test in Svelte REPL
4. Ask in Svelte Discord/forums

---

**Last Updated:** 2024
**Version:** 1.0

