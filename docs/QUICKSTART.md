# Quick Start - TSS SvelteKit Migration

## 🚀 Getting Started

### 1. Start Development Server

```bash
cd tss-sveltekit
npm run dev
```

Visit `http://localhost:5173` to see the migrated app!

### 2. What's Working

✅ **Settings Panel** - Fully migrated to Svelte component
✅ **Settings Store** - Reactive state management with localStorage
✅ **Bootstrap UI** - Styling preserved
✅ **TypeScript** - Type-safe code

### 3. Test the Settings

1. Toggle any checkbox in the Settings Panel
2. Watch the "Current Settings State" update automatically
3. Refresh the page - settings persist!
4. Check browser DevTools → Application → LocalStorage → see `settings` key

## 📁 Project Structure

```
tss-sveltekit/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── controls/
│   │   │       └── SettingsPanel.svelte  ✅ Migrated
│   │   ├── stores/
│   │   │   └── settings.ts              ✅ Migrated
│   │   └── utils/
│   │       └── settingsAdapter.ts      ✅ Migration helper
│   └── routes/
│       ├── +layout.svelte               ✅ Bootstrap setup
│       └── +page.svelte                 ✅ Demo page
├── static/
│   ├── img/                             ✅ Copied
│   ├── manifest.json                    ✅ Copied
│   └── favicon.ico                      ✅ Copied
└── package.json                         ✅ Dependencies
```

## 🎯 Next Steps

### Immediate Next Steps:

1. **Create Type Definitions** (`src/lib/types/`)
   - `game.ts` - Game state types
   - `boat.ts` - Boat/Player types
   - `wind.ts` - Wind scenario types

2. **Migrate Game Logic** (`src/lib/stores/game.ts`)
   - Convert `Game` class to TypeScript
   - Create game store
   - Migrate game state management

3. **Migrate Components**
   - `GameCanvas.svelte` - Main game area
   - `PlayerControl.svelte` - Player controls
   - `WindSelector.svelte` - Wind selection

### Migration Order:

1. ✅ Settings (DONE)
2. ⏳ Type Definitions (NEXT)
3. ⏳ Game Store
4. ⏳ Game Canvas
5. ⏳ Player Controls
6. ⏳ Wind Components
7. ⏳ Modals

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run check
```

## 📚 Documentation

- **Full Migration Guide**: See `../MIGRATION_GUIDE.md`
- **Integration Example**: See `../migration-poc/INTEGRATION_EXAMPLE.md`
- **Demo**: See `../migration-poc/demo.html`

## 🐛 Troubleshooting

### Port already in use?
```bash
npm run dev -- --port 3000
```

### Type errors?
```bash
npm run check
```

### Build errors?
```bash
rm -rf .svelte-kit node_modules
npm install
npm run dev
```

## ✨ What You'll See

When you run `npm run dev`, you'll see:

1. **Settings Panel** - Interactive checkboxes
2. **Live State Display** - Shows current settings values
3. **JSON Output** - Raw settings object
4. **Migration Status** - Progress tracker

Toggle the checkboxes and watch everything update automatically! 🎉

