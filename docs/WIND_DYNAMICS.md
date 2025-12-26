# Wind Dynamics in TSS

## Overview

This document explains how wind shifts impact boat direction and movement in the Tactical Sailing Simulator.

## Wind Angle System

### Wind Storage
- Wind is stored as an **angle offset** in degrees from 0° (north)
- Wind always starts at **0°** (straight north)
- Wind shifts are relative changes from the starting wind
- Example: If wind shifts to +5°, it means the wind has shifted 5° clockwise from north

### Wind Display
- The displayed wind angle is **multiplied by 2** for visualization
- `windDisplayAngle = wind * 2`
- This makes wind shifts more visually apparent on the compass

## Boat Heading Calculation

### Basic Formula

Boats sail at a **45° angle** relative to the wind direction. The exact heading depends on:

1. **Tack** (Port or Starboard)
2. **Current Wind Angle**

### Heading Formulas

**Port Tack (boat.tack = true):**
```
boat.rotation = 45° + currentWind
```

**Starboard Tack (boat.tack = false):**
```
boat.rotation = -45° + currentWind
```

### Example Scenarios

#### Scenario 1: Wind at 0° (Starting Wind)
- **Port Tack**: `rotation = 45° + 0° = 45°` (sailing northeast)
- **Starboard Tack**: `rotation = -45° + 0° = -45°` (sailing northwest)

#### Scenario 2: Wind Shifts to +5°
- **Port Tack**: `rotation = 45° + 5° = 50°` (boat rotates 5° clockwise)
- **Starboard Tack**: `rotation = -45° + 5° = -40°` (boat rotates 5° clockwise)

#### Scenario 3: Wind Shifts to -10°
- **Port Tack**: `rotation = 45° + (-10°) = 35°` (boat rotates 10° counter-clockwise)
- **Starboard Tack**: `rotation = -45° + (-10°) = -55°` (boat rotates 10° counter-clockwise)

## How Wind Shifts Impact Movement

### 1. **Immediate Rotation Change**

When wind shifts, the boat's rotation is **recalculated every turn**:

```typescript
// From gameLogic.ts line 164-171
const currentWind = game.getWind(game.turncount);
if (boat.tack) {
  boat.rotation = 45 + currentWind;  // Port tack
} else {
  boat.rotation = -45 + currentWind;  // Starboard tack
}
```

**Key Point**: The boat doesn't gradually rotate - it **instantly adjusts** to the new wind angle at the start of each turn.

### 2. **Movement Direction**

The boat moves in the direction of its rotation:

```typescript
// Movement calculation (line 173-174)
boat.x += Math.sin(boat.rotation * Math.PI / 180) * moveDist;
boat.y -= Math.cos(boat.rotation * Math.PI / 180) * moveDist;
```

**Impact**: When wind shifts, the boat's movement vector changes, affecting:
- **Upwind progress** (VMG - Velocity Made Good)
- **Lateral drift** (how far left/right the boat moves)
- **Time to reach the mark**

### 3. **Layline Changes**

Laylines are calculated based on wind angle:

**Port Layline:**
```
laylineAngle = -45° - currentWind
```

**Starboard Layline:**
```
laylineAngle = 45° - currentWind
```

**Impact**: When wind shifts:
- Laylines rotate around the mark
- The "safe zone" for reaching the mark changes
- Boats may need to tack earlier or later

## Tactical Implications

### Lift vs Knock

**Lift** (positive wind shift):
- Wind shifts **toward** the boat's current tack
- Boat gets a **better angle** to the mark
- Example: On port tack, wind shifts from 0° to +5° → boat rotates 5° closer to the mark

**Knock** (negative wind shift):
- Wind shifts **away** from the boat's current tack
- Boat gets a **worse angle** to the mark
- Example: On port tack, wind shifts from 0° to -5° → boat rotates 5° away from the mark

### Visual Indicators

The game shows lift/knock in the **Race Insight** panel:
- **Lifted**: Green indicator, boat has better angle
- **Knocked**: Red indicator, boat has worse angle
- **Relative Angle**: Shows how many degrees the boat is lifted/knocked

### Strategic Decisions

1. **When Lifted**: 
   - Continue on current tack (better angle = faster progress)
   - May delay tacking to maximize advantage

2. **When Knocked**:
   - Consider tacking soon (worse angle = slower progress)
   - May need to tack immediately if severely knocked

3. **Wind Shift Patterns**:
   - Pendulum pattern: Wind oscillates left/right
   - Persistent shift: Wind keeps shifting in one direction
   - Random: Unpredictable shifts

## Code Flow Example

### Turn Execution Flow

1. **Turn Starts** (`executeBoatTurn`)
   - Get current wind: `currentWind = game.getWind(turnCount)`
   - Check boat's tack (port or starboard)

2. **Calculate New Rotation**
   ```typescript
   if (boat.tack) {
     boat.rotation = 45 + currentWind;  // Port tack
   } else {
     boat.rotation = -45 + currentWind;  // Starboard tack
   }
   ```

3. **Move Boat**
   - Calculate movement vector from rotation
   - Update boat position
   - Check if boat reached mark or layline

4. **Save Turn**
   - Store rotation, position, tack for replay

### Wind Shift Example

**Turn 0**: Wind = 0°
- Port tack boat: `rotation = 45° + 0° = 45°`
- Boat sails northeast

**Turn 1**: Wind shifts to +5°
- Port tack boat: `rotation = 45° + 5° = 50°`
- Boat rotates 5° clockwise, now sailing more east
- **This is a LIFT** (better angle toward mark)

**Turn 2**: Wind shifts to -3°
- Port tack boat: `rotation = 45° + (-3°) = 42°`
- Boat rotates 3° counter-clockwise
- **This is a KNOCK** (worse angle away from mark)

## Key Takeaways

1. **Wind is relative**: All wind values are offsets from 0° (north)
2. **Boats sail at 45°**: Port tack = +45°, Starboard tack = -45°
3. **Wind shifts rotate boats**: +5° wind shift = boat rotates 5° clockwise
4. **Instant adjustment**: Boats adjust to new wind angle immediately each turn
5. **Laylines move**: Wind shifts rotate the laylines around the mark
6. **Tactical impact**: Lifts help, knocks hurt - timing tacks is crucial

## Visual Reference

When you hover over a boat, you'll see:
- **Gray dashed line**: Wind direction
- **Colored line**: Boat heading
- **Green arc**: Lift (positive angle)
- **Red arc**: Knock (negative angle)

This visual feedback helps you understand the relationship between wind and boat direction in real-time.

