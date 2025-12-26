# Release Notes

## Version 1.1.0 (2024)

### 🎯 Major Improvements

#### Wind Mechanics - Correct Lift/Header Calculation
- **Fixed**: Lift/header now calculated relative to course axis (bearing to mark), not boat's current angle
- **Added**: VMG (Velocity Made Good) calculation and efficiency tracking
- **Added**: Wind shift detection with proper tactical analysis
- **Added**: Invariant validation (lift on one tack = header on other) with error logging
- **Changed**: UI terminology updated to use correct sailing terms (HEADER instead of KNOCK)
- **Improved**: Separated wind events (LIFT/HEADER) from performance states (VMG)

#### Layout & Visual Improvements
- **Reorganized**: Three-panel layout (20% left controls, 60% center game, 20% right insights)
- **Increased**: Map scale - GRID_SIZE 20→25px, boat scale 1.4→1.6x, mark scale 1.0→1.2x
- **Added**: Screen resolution display in settings panel
- **Fixed**: Map containment - map stays within center area boundaries
- **Optimized**: Map scaling uses 95% of container space with proper padding

#### Documentation
- **Added**: Comprehensive wind dynamics documentation (`docs/WIND_DYNAMICS.md`)
- **Added**: Wind mechanics specification (`docs/WIND_MECHANICS_SPEC.md`)
- **Added**: Implementation plan (`docs/IMPLEMENTATION_PLAN.md`)

### 🔧 Technical Changes

#### New Utility Functions (`gameLogic.ts`)
- `angleDiff(a, b)` - Calculate shortest signed angle difference
- `getCourseAxis(boatX, boatY, markX, markY)` - Calculate bearing to mark
- `getOptimalHeading(tack, windDir, isUpwind)` - Calculate optimal heading for tack
- `calculateLiftHeader(...)` - Calculate lift/header relative to course axis
- `calculateVMG(...)` - Calculate VMG toward mark
- `calculateVMGEfficiency(...)` - Calculate VMG efficiency percentage

#### New Stores
- `previousWind` - Track previous wind value for shift detection

#### Updated Components
- `LiftKnockIndicator` - Now shows LIFT/HEADER correctly
- `SettingsPanel` - Added screen resolution display
- `+page.svelte` - Updated tactical insights with correct wind mechanics

### 🐛 Bug Fixes
- Fixed wind initialization to always start at 0°
- Fixed map overflow into sidebar areas
- Fixed lift/header calculation to match sailing theory

### 📚 Documentation
- Removed migration documents (migration complete)
- Added comprehensive wind mechanics documentation
- Updated backlog with version 1.1 completed items

---

## Version 1.0.0 (2024)

### Initial Release

Complete migration from vanilla JavaScript to SvelteKit with TypeScript.

#### Core Features
- Full game functionality migrated
- Reactive state management with Svelte stores
- Type-safe codebase with TypeScript
- Modern UI with Bootstrap 5
- Responsive layout
- Visual improvements (grid, marks, tracks, laylines)
- Wind particle visualization
- Tactical insights panel

#### Technical Stack
- SvelteKit framework
- TypeScript for type safety
- Bootstrap 5 for UI
- SVG for game graphics
- LocalStorage for persistence

