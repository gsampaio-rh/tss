# Wind Mechanics Implementation Plan

## Critical Issues Identified

### ❌ Current Implementation (INCORRECT)

**Location:** `tss-sveltekit/src/routes/+page.svelte` lines 48-54

```javascript
const windAngle = $currentWind * 2;
const boatHeading = player.rotation;
const relativeAngle = ((boatHeading - windAngle + 180) % 360) - 180;
const isLifted = relativeAngle > 0;
```

**Problem:** This calculates lift/knock based on boat's current heading relative to wind, NOT relative to course axis (bearing to mark).

### ✅ Required Implementation (CORRECT)

According to spec section 6.2:

```javascript
// 1. Calculate optimal heading for current tack
const optUpwindAngle = 45; // or from polar model
const optHeading_before = boat.tack 
  ? windDir_prev + optUpwindAngle  // Port
  : windDir_prev - optUpwindAngle; // Starboard

const optHeading_after = boat.tack
  ? windDir_now + optUpwindAngle
  : windDir_now - optUpwindAngle;

// 2. Calculate bearing to windward mark (course axis)
const courseAxis = getRotateAngle(boat.x, boat.y, mark.x, mark.y);

// 3. Calculate error from course axis
const err_before = Math.abs(angleDiff(optHeading_before, courseAxis));
const err_after = Math.abs(angleDiff(optHeading_after, courseAxis));

// 4. Determine lift/header
const isLift = err_after < err_before;
const isHeader = err_after > err_before;
```

## Implementation Steps

### Phase 1: Core Utilities

1. **Create `angleDiff` utility function**
   - Location: `tss-sveltekit/src/lib/utils/gameLogic.ts`
   - Returns shortest signed angle between two angles (-180° to +180°)

2. **Create `getCourseAxis` function**
   - Calculate bearing from boat to windward mark
   - Use existing `getRotateAngle` or create new function

3. **Create `getOptimalHeading` function**
   - Takes tack, wind direction, and optimal angle
   - Returns optimal heading for that tack

### Phase 2: Wind Shift Detection

4. **Track previous wind value**
   - Store `windDir_prev` in game state or reactive variable
   - Update on each turn

5. **Create `calculateLiftHeader` function**
   - Implements spec section 6.2
   - Returns: `{ isLift: boolean, isHeader: boolean, errorChange: number }`
   - Must validate invariant: lift on one tack = header on other

### Phase 3: VMG Calculation

6. **Create `calculateVMG` function**
   - VMG = boatSpeed * cos(angleDiff(heading, courseAxis))
   - Currently boat speed is constant (1 unit per turn)

7. **Create `calculateVMGEfficiency` function**
   - Compare current VMG to optimal VMG
   - Return efficiency percentage

### Phase 4: UI Refactoring

8. **Separate Wind Events from Performance**
   - Wind Event: "LIFT +5°" or "HEADER -3°"
   - Performance: "VMG Low" or "Outside Optimal"
   - Don't mix concepts

9. **Update Tactical Insights Panel**
   - Show wind event first
   - Then effect ("Angle improved/worsened")
   - Then advice ("Tack now" / "Hold 1-2 turns")

10. **Add Debug Overlay** (dev mode)
    - Show windDir_prev / windDir_now
    - Show optHeading_before / after
    - Show err_before / after
    - Show lift/header for both tacks
    - Validate invariant

## Files to Modify

1. `tss-sveltekit/src/lib/utils/gameLogic.ts`
   - Add `angleDiff` function
   - Add `getCourseAxis` function
   - Add `getOptimalHeading` function
   - Add `calculateLiftHeader` function
   - Add `calculateVMG` function

2. `tss-sveltekit/src/lib/stores/game.ts`
   - Track previous wind value
   - Add reactive variable for wind shifts

3. `tss-sveltekit/src/routes/+page.svelte`
   - Refactor tactical insights calculation
   - Use new lift/header calculation
   - Separate wind events from performance

4. `tss-sveltekit/src/lib/components/game/LiftKnockIndicator.svelte`
   - Update to show wind event (LIFT/HEADER)
   - Not performance state

5. Create new component: `WindEventIndicator.svelte`
   - Shows wind shift events
   - Separate from performance indicators

## Testing Checklist

- [ ] Lift on starboard = Header on port (invariant)
- [ ] Lift on port = Header on starboard (invariant)
- [ ] Error if both tacks show same result
- [ ] VMG calculation matches expected values
- [ ] Course axis calculation is correct
- [ ] Optimal heading matches polar model
- [ ] UI shows wind events separately from performance

## Priority

**HIGH PRIORITY:**
- Fix lift/header calculation (currently incorrect)
- Implement invariant validation
- Separate wind events from performance in UI

**MEDIUM PRIORITY:**
- VMG calculation
- VMG efficiency tracking
- Tactical advice logic

**LOW PRIORITY:**
- Debug overlay
- Downwind logic
- Advanced polar model

