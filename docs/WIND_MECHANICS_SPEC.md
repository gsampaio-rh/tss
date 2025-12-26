# Wind Mechanics Specification

## Core Game Dynamics & Wind Mechanics

### 1. Coordinate System & Core References (FOUNDATION)

Everything depends on these being unambiguous.

#### 1.1 World Reference

- All angles are **true wind referenced** (not relative)
- Angles increase **clockwise**
- **0° wind = reference baseline** (can be arbitrary, but must be consistent)

#### 1.2 Key Bearings

- `windDir` → true wind direction (degrees)
- `heading` → boat heading (degrees)
- `courseAxis` → bearing from boat to windward mark

#### 1.3 Angle Utilities

```
angleDiff(a, b) = shortest signed angle between a and b (−180° … +180°)
```

### 2. Boat State Model (WHAT THE BOAT IS DOING)

These are state variables, not tactical judgments.

#### 2.1 Tack

```
if angleDiff(heading, windDir) < 0 → Starboard
else → Port
```

#### 2.2 Angle to Wind (ATW)

```
ATW = abs(angleDiff(heading, windDir))
```

**This is pure geometry.**
It does not mean lift, header, good, or bad.

### 3. Polar Model (PERFORMANCE TRUTH)

#### 3.1 Optimal Angles

From polars (or simplified constants):

- `optUpwindAngle ≈ 42–45°`
- `optDownwindAngle ≈ 150–160°`

#### 3.2 Optimal Heading on a Given Tack

```
optHeading(tack, windDir):
    if tack == Starboard:
        return windDir - optUpwindAngle
    else:
        return windDir + optUpwindAngle
```

### 4. VMG & Performance (QUALITY, NOT SHIFT)

#### 4.1 VMG Calculation

```
VMG = boatSpeed * cos(angleDiff(heading, courseAxis))
```

#### 4.2 VMG Efficiency

```
VMG_efficiency = VMG / VMG_optimal
```

#### 4.3 Performance States (examples)

- **Optimal VMG**: ≥ 95%
- **Acceptable**: 85–95%
- **Poor**: < 85%

⚠️ **Performance ≠ Lift/Header**

### 5. Wind Shift Mechanics (THE CRITICAL PART)

#### 5.1 Wind Shift Event

A wind shift is only a change in `windDir`:

```
Δwind = windDir_now − windDir_prev
```

**No judgment yet.**

### 6. Lift & Header Definition (TACTICAL EVENT)

**This MUST be relative to the course axis, not the boat's current angle.**

#### 6.1 Core Rule (UPWIND)

- A wind shift is a **LIFT** if it allows the boat (on its current tack) to sail **closer** to the windward mark.
- A wind shift is a **HEADER** if it forces the boat **away** from the windward mark.

#### 6.2 Formal Definition

For the current tack:

```
opt_before = optHeading(tack, windDir_prev)
opt_after  = optHeading(tack, windDir_now)

err_before = abs(angleDiff(opt_before, courseAxis))
err_after  = abs(angleDiff(opt_after,  courseAxis))

if err_after < err_before:
    LIFT
else:
    HEADER
```

#### 6.3 Fundamental Invariant

For any upwind shift:

```
Lift on starboard ⇔ Header on port
Lift on port      ⇔ Header on starboard
```

**If both tacks get the same result → BUG.**

### 7. Downwind Logic (BRIEF, FOR COMPLETENESS)

Downwind logic inverts priorities:

- **Lift** = wind shifts toward stern, forcing gybe or sailing higher than optimal.
- **Header** = wind shifts toward bow, allowing deeper angles.

Same structure, different optimal angles.

### 8. Tactical States (WHAT THE GAME TELLS THE PLAYER)

These are interpretations, not physics.

#### 8.1 Wind Event (Short-lived)

- `LIFT +X°`
- `HEADER −X°`

This describes what just happened.

#### 8.2 Boat Performance State (Persistent)

Examples:
- "Outside optimal VMG"
- "Under-speed"
- "Over-stood"

Derived from:
- ATW vs optimal
- VMG efficiency
- Speed vs polar

### 9. Tactical Advice Logic (DECISION LAYER)

#### 9.1 Example: "Consider Tacking"

Trigger only if:

```
HEADER
AND VMG_efficiency < threshold
AND opposite tack err < current tack err
```

#### 9.2 Example: "Hold / Protect Lane"

Trigger if:

```
HEADER
BUT lane control is valuable
AND VMG loss < acceptable window
```

### 10. UI / UX SEMANTIC RULES (VERY IMPORTANT)

#### 10.1 Never Use One Word for Two Concepts

❌ **Bad:**
- "KNOCK" meaning both header and poor VMG

✅ **Good:**
- `HEADER` → wind event
- `VMG LOW` → performance

#### 10.2 Correct Mental Model for Players

Display in this order:

1. **Wind event**
   - LIFT / HEADER
2. **Effect**
   - "Angle improved"
   - "Angle worsened"
3. **Advice**
   - "Tack now"
   - "Hold 1–2 turns"

### 11. Debug & Validation Rules (NON-NEGOTIABLE)

Add a dev overlay that shows:

- `windDir_prev / windDir_now`
- `optHeading_before / after`
- `err_before / after`
- `lift/header result for both tacks`

Automatic sanity check:

```javascript
if (lift_starboard == lift_port) {
    throw "INVALID WIND SHIFT CLASSIFICATION"
}
```

### 12. Design Philosophy (WHY THIS WORKS)

- Matches real sailing theory
- Matches RC sailing definitions
- Matches full-scale racing tactics
- Decouples physics, tactics, and UX
- Prevents sign, reference, and intuition bugs

## Implementation Status

### ✅ Currently Implemented
- Basic wind angle tracking
- Boat heading calculation
- Tack determination

### ❌ Needs Implementation
- [ ] Proper lift/header calculation relative to course axis
- [ ] VMG calculation and efficiency tracking
- [ ] Optimal heading calculation based on polar model
- [ ] Wind shift event detection
- [ ] Tactical advice logic
- [ ] Debug overlay for validation
- [ ] Separation of wind events from performance states in UI

### 🔧 Needs Refactoring
- [ ] Current lift/knock calculation (currently relative to boat angle, not course axis)
- [ ] Tactical insights panel to separate wind events from performance
- [ ] Angle difference utility function
- [ ] Course axis calculation (bearing to windward mark)

