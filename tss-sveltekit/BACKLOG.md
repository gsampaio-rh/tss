# Product Backlog

This document tracks upcoming features and improvements for the Tactical Sailing Simulator.

**Last Updated**: 2024-12-26

---

## 🎯 High Priority Features

### 0. Contextual Help for Race Insights

**Priority**: 🔴 Critical  
**Status**: ✅ Completed  
**Estimated Effort**: 2-3 days  
**Actual Effort**: ~2 days

#### Description
Add contextual help icons (ℹ️) next to every insight/metric in the race insights panel. When users hover over the icon, they should see a tooltip explaining what that metric means and how to interpret it.

#### Requirements
- **Help Icons**:
  - Add "i" (info) icon next to each metric/insight
  - Icons should be subtle but discoverable
  - Consistent styling across all metrics

- **Tooltips**:
  - Show on hover (desktop) or tap (mobile)
  - Clear, concise explanations
  - Examples when helpful
  - Link to full documentation (optional)

- **Metrics to Document**:
  - Angle to Wind (ATW)
  - VMG (Velocity Made Good)
  - Lift/Header indicators
  - Wind Shift
  - Mode (FOOTING, PINCHING, VMG MODE, etc.)
  - Heading (HDG vs OPT)
  - Tack Advantage
  - Speed
  - Power state (OVERPOWERED, UNDERPOWERED, POWERED)
  - Decision flags (TACK SOON, TACK NOW)
  - Position badge
  - Tack indicator

#### Acceptance Criteria
- [x] Info icon (ℹ️) appears next to each metric
- [x] Modal shows on click (desktop and mobile)
- [x] Explanations are clear and concise
- [x] Modals don't interfere with UI interactions
- [x] Accessible (keyboard navigation, screen readers)
- [x] Consistent styling across all metrics
- [x] History charts for VMG, ATW, Heading, and Tack Advantage
- [x] Context-aware guidance based on current status

#### Technical Notes
- ✅ Created reusable `Modal` component (already existed)
- ✅ Used click-based modals (better for mobile than hover)
- ✅ Created chart components: `VMGChart`, `ATWChart`, `HeadingChart`, `TackAdvantageChart`
- ✅ History tracking for all metrics (60 turns)
- ✅ Turn-based X-axis (not time-based)
- ✅ Performance bands with color coding
- ✅ ARIA labels and keyboard navigation implemented

#### UI/UX Considerations
- ✅ Modal appears on click (works on all devices)
- ✅ Modal can be closed via backdrop, Escape key, or close button
- ✅ Charts show historical trends over last 60 turns
- ✅ Context-aware guidance updates based on current status
- ✅ Consistent visual hierarchy across all modals

#### Completed Metrics
- ✅ **VMG (Velocity Made Good)**: Full modal with history chart, performance bands, optimal VMG reference line
- ✅ **ATW (Angle to Wind)**: Full modal with history chart, target angle reference, pinching/footing guidance
- ✅ **Heading**: Full modal with history chart showing heading vs optimal, wind shift awareness
- ✅ **Tack Advantage**: Full modal with history chart showing advantage percentage, positive/negative zones

#### Implementation Details
- All modals follow consistent pattern: Hero stat → Supporting indicators → History chart → Guidance
- Charts use SVG for performance and scalability
- History persists across modal opens/closes
- Turn-based tracking ensures accurate representation for turn-based gameplay

---

## 🎯 High Priority Features

### 1. Tell Tales Indicators

**Priority**: 🔴 High  
**Status**: ✅ Completed  
**Estimated Effort**: 2-3 days  
**Actual Effort**: ~2 days

#### Description
Add tell tales indicators to the player tactical card. Tell tales are visual indicators that show wind flow and help sailors optimize sail trim and heading. They provide immediate visual feedback about whether the boat is sailing efficiently.

#### Requirements
- **Visual Indicators**:
  - Show tell tales on the player tactical card
  - Visual representation (e.g., arrows, ribbons, or small indicators)
  - Color-coded based on efficiency (green = good, yellow = okay, red = poor)
  
- **Wind Flow Visualization**:
  - Show wind direction relative to boat heading
  - Indicate if wind is flowing smoothly over sails
  - Show when sails are stalled or backwinded

- **Sail Trim Feedback**:
  - Indicate if sails are properly trimmed
  - Show when to ease or trim sails
  - Provide visual cues for optimal sail angle

- **Integration**:
  - Add to player tactical card UI
  - Update based on current wind and boat heading
  - Show real-time feedback as conditions change

#### Acceptance Criteria
- [x] Tell tales visible on player tactical card
- [x] Visual indicators show wind flow direction
- [x] Color coding reflects sail efficiency
- [x] Updates in real-time with wind/heading changes
- [x] Clear visual feedback for sail trim adjustments
- [x] Accessible and easy to understand
- [x] Realistic snake-like wave animations
- [x] Fixed bands prevent tell tales from crossing
- [x] Gradual collapse when stalled

#### Technical Notes
- ✅ Added tell tales to `PlayerTacticalCard.svelte`
- ✅ Uses ATW and mode (PINCHING/FOOTING) to determine tell tale state
- ✅ SVG path morphing for realistic snake-like wave animations
- ✅ Fixed bands: Leeward at y=30, Windward at y=55
- ✅ Phase shift between leeward and windward for realistic turbulence
- ✅ Separate animations for flowing and stalled states

#### UI/UX Considerations
- ✅ Compact horizontal lines stacked vertically
- ✅ Snake-like wave animations simulate ribbon-in-wind effect
- ✅ Color coding: green when OK, red when stalled
- ✅ Labels positioned next to each tell tale
- ✅ Stalled tell tales collapse downward gradually

#### Implementation Details
- **Leeward Tell Tale**:
  - Centered at y=30, amplitude ±6px (24-36)
  - 4 complete waves between x=20 and x=100
  - Red and drops when footing (too wide)
  - Green and flows when OK
  
- **Windward Tell Tale**:
  - Centered at y=55, amplitude ±6px (49-61)
  - 4 complete waves with 0.2s phase shift
  - Red and drops when pinching (too close to wind)
  - Green and flows when OK
  - Never invades leeward band (stays >= 53 when stalled)

- **Animations**:
  - Flowing: `snakeWave` / `snakeWaveWindward` (1.1s ease-in-out)
  - Stalled: `stallWiggle` / `stallWiggleWindward` (1.8s ease-in-out)
  - Path morphing creates organic, continuous motion
  - No translateX/Y - pure path animation for realism

---

### 2. Wind Zones UI Improvements

**Priority**: 🔴 High  
**Status**: Not Started  
**Estimated Effort**: 1 day

#### Description
Improve the visual design of wind zones. The current circle/arc visualization is too large and can be distracting or cover important game elements.

#### Requirements
- **Size Reduction**:
  - Reduce the size of wind zone circles/arcs
  - Make them more subtle and less intrusive
  - Ensure they're still visible but don't dominate the canvas

- **Visual Refinement**:
  - Adjust opacity/transparency for better visibility balance
  - Consider alternative visualizations (thinner arcs, dashed lines, etc.)
  - Ensure wind zones don't obscure boats, marks, or tracks

- **User Control**:
  - Keep the toggle to show/hide wind zones
  - Consider adding opacity slider in settings
  - Ensure zones are still informative when visible

#### Acceptance Criteria
- [ ] Wind zone circles/arcs are smaller and less intrusive
- [ ] Zones don't obscure important game elements
- [ ] Still clearly visible and informative
- [ ] Visual design is polished and professional
- [ ] Settings allow users to control visibility/opacity

#### Technical Notes
- Modify `WindZones.svelte` component
- Adjust SVG circle/arc radius calculations
- Update opacity and stroke width values
- May need to adjust z-index/layering
- Test with different screen sizes

---

### 3. Speed-Based Movement System

**Priority**: 🔴 High  
**Status**: Not Started  
**Estimated Effort**: 3-5 days

#### Description
Implement speed variations based on sailing angle relative to optimal power. Boats should advance different distances depending on whether they're sailing at the optimal angle for power or not.

#### Requirements
- **Speed Calculation**: 
  - Optimal angle (45° ATW) = Full speed (1.0 unit per turn)
  - Pinching (too close to wind, <42° ATW) = Reduced speed (e.g., 0.7-0.9 units)
  - Footing (too wide, >50° ATW) = Reduced speed (e.g., 0.7-0.9 units)
  - Speed should vary smoothly based on angle to wind

- **Movement Impact**:
  - Boats sailing at optimal angle advance full distance
  - Boats pinching or footing advance less distance per turn
  - Visual feedback showing speed differences

#### Acceptance Criteria
- [ ] Speed varies based on angle to wind (ATW)
- [ ] Optimal angle (45°) provides full speed
- [ ] Pinching reduces speed proportionally
- [ ] Footing reduces speed proportionally
- [ ] Movement distance reflects speed changes
- [ ] Visual indicators show speed differences

#### Technical Notes
- Modify `BoatMovementService` to calculate speed multiplier based on ATW
- Update movement calculations to use speed multiplier
- Consider using polar diagram data for realistic speed curves
- May need to update `TacticalAnalysisService` for speed calculations

---

### 4. Racing Rules Implementation

**Priority**: 🔴 High  
**Status**: Not Started  
**Estimated Effort**: 5-7 days

#### Description
Implement sailing racing rules, particularly right-of-way rules. Boats on starboard tack have right-of-way over boats on port tack.

#### Requirements
- **Right-of-Way Rules**:
  - Starboard tack has right-of-way over port tack
  - Port tack must keep clear and avoid starboard tack boats
  - Same tack: windward boat keeps clear of leeward boat
  - Overtaking boat keeps clear

- **Collision Detection**:
  - Detect when boats would collide
  - Prevent movement that would cause collision
  - Show warnings when boats are too close

- **Penalties**:
  - 360° turn penalty for rule violations
  - Optional: 720° turn for serious violations
  - Visual indication of penalty turns

#### Acceptance Criteria
- [ ] Starboard tack boats have right-of-way
- [ ] Port tack boats must keep clear
- [ ] Collision detection prevents illegal moves
- [ ] Penalty system for rule violations
- [ ] Visual indicators for right-of-way situations
- [ ] Warnings when boats are on collision course

#### Technical Notes
- Create `RacingRulesService` in domain layer
- Implement collision detection algorithm
- Add penalty turn system
- Update `BoatMovementService` to check rules before movement
- May need to add "keep clear" indicators in UI

---

### 5. Enhanced Game Statistics & Visualization

**Priority**: 🟡 Medium  
**Status**: Not Started  
**Estimated Effort**: 4-6 days

#### Description
Add comprehensive end-of-game statistics and enhanced track visualization with tack markers and VMG-based color gradients.

#### Requirements

**Track Visualization**:
- **Tack Markers**: Mark points where boats tacked on the track
  - Visual markers (e.g., circles, arrows) at tack points
  - Show tack direction (port ↔ starboard)
  - Optional: Show tack number/sequence

- **VMG-Based Color Gradient**:
  - Color track segments based on VMG efficiency
  - Green = High VMG (95%+)
  - Yellow = Medium VMG (85-95%)
  - Red = Low VMG (<85%)
  - Smooth gradient transitions between segments

**End-of-Game Statistics**:
- **Race Summary**:
  - Finish times and positions
  - Total distance sailed
  - Average VMG
  - Number of tacks
  - Time on each tack (port vs starboard)

- **Tack Analysis**:
  - List of all tacks with timestamps
  - VMG before/after each tack
  - Wind conditions at each tack
  - Effectiveness of each tack (did it improve VMG?)

- **Performance Metrics**:
  - Best VMG achieved
  - Worst VMG period
  - Time spent in different modes (VMG MODE, FOOTING, PINCHING)
  - Wind shift responses (how many lifts/headers detected)

#### Acceptance Criteria
- [ ] Tack markers visible on boat tracks
- [ ] Track colored by VMG efficiency (gradient)
- [ ] End-of-game statistics panel
- [ ] Tack-by-tack analysis
- [ ] Performance metrics summary
- [ ] Export statistics (optional: JSON/CSV)

#### Technical Notes
- Enhance `Boat.saveTurn()` to track tack events
- Create `GameStatisticsService` for stat calculations
- Update track rendering in `GameCanvas.svelte`
- Add statistics panel component
- May need to store additional turn data (VMG at each turn)

---

## 🟢 Medium Priority Features

### 4. Advanced Tactical Analysis

**Priority**: 🟡 Medium  
**Status**: Not Started  
**Estimated Effort**: 3-4 days

#### Description
Enhance tactical analysis with more sophisticated metrics and recommendations.

#### Features
- **Optimal Tack Analysis**: Show which tack is better at any given moment
- **Layline Calculations**: Visual laylines showing optimal approach angles
- **Wind Shift Predictions**: Analyze wind patterns to predict future shifts
- **Position Analysis**: Compare boat positions relative to competitors
- **Strategic Recommendations**: AI-powered tactical advice

---

### 5. Replay System

**Priority**: 🟡 Medium  
**Status**: Not Started  
**Estimated Effort**: 5-7 days

#### Description
Save and replay completed races with playback controls.

#### Features
- **Race Recording**: Automatically save race data
- **Playback Controls**: Play, pause, rewind, fast-forward
- **Speed Control**: Adjust playback speed (0.5x, 1x, 2x, 4x)
- **Frame-by-Frame**: Step through turns one at a time
- **Replay Export**: Save replays for sharing

---

### 6. Multiplayer Support

**Priority**: 🟡 Medium  
**Status**: Not Started  
**Estimated Effort**: 10-14 days

#### Description
Enable online multiplayer races with real-time synchronization.

#### Features
- **Online Lobby**: Create/join race rooms
- **Real-Time Sync**: Synchronize game state across players
- **Turn-Based Mode**: Players take turns (current system)
- **Real-Time Mode**: Continuous movement (future)
- **Spectator Mode**: Watch races in progress

---

## 🔵 Low Priority Features

### 7. Custom Wind Scenario Editor

**Priority**: 🔵 Low  
**Status**: Not Started  
**Estimated Effort**: 3-4 days

#### Description
Enhanced wind scenario editor with visual timeline and advanced controls.

#### Features
- **Visual Timeline**: Drag-and-drop wind values
- **Pattern Templates**: Common wind patterns (oscillating, persistent, etc.)
- **Import/Export**: Save and share custom scenarios
- **Preview Mode**: See how wind will change before starting race

---

### 8. Boat Customization

**Priority**: 🔵 Low  
**Status**: Not Started  
**Estimated Effort**: 2-3 days

#### Description
Allow players to customize boat appearance and properties.

#### Features
- **Boat Colors**: Custom color selection
- **Boat Names**: Custom naming
- **Boat Icons**: Different boat icons/styles
- **Performance Profiles**: Different boat types (fast/slow, different polar curves)

---

### 9. Race History & Leaderboards

**Priority**: 🔵 Low  
**Status**: Not Started  
**Estimated Effort**: 4-5 days

#### Description
Track race history and maintain leaderboards.

#### Features
- **Race History**: List of completed races
- **Personal Best Times**: Track best times for each scenario
- **Leaderboards**: Compare times with other players
- **Achievements**: Unlock achievements for milestones

---

## 🔧 Technical Improvements

### 10. Performance Optimizations

**Priority**: 🟡 Medium  
**Status**: Partially Complete  
**Estimated Effort**: 2-3 days

#### Remaining Tasks
- [ ] Component memoization for expensive renders
- [ ] Optimize SVG rendering performance
- [ ] Implement object pooling for particles
- [ ] Add performance monitoring dashboard

---

### 11. Testing Infrastructure

**Priority**: 🟡 Medium  
**Status**: Not Started  
**Estimated Effort**: 5-7 days

#### Tasks
- [ ] Set up Vitest test framework
- [ ] Write unit tests for domain services (80%+ coverage)
- [ ] Write integration tests for services
- [ ] Write E2E tests for critical flows
- [ ] Set up CI/CD with automated testing

---

## 📋 Feature Request Process

To request a new feature:

1. Check if it's already in the backlog
2. If not, create an issue with:
   - Clear description
   - Use cases/examples
   - Priority level
   - Estimated complexity

---

## 🎯 Current Sprint Focus

**Sprint Goals** (Next 2 weeks):
1. ✅ **Contextual help for race insights** - Completed: Info modals with history charts for VMG, ATW, Heading, and Tack Advantage
2. **Tell tales indicators** - Add visual wind flow indicators to player tactical card
3. **Wind zones UI improvements** - Reduce circle size, improve visual design
4. Speed-based movement system
5. Racing rules implementation
6. Enhanced game statistics

---

**Last Updated**: 2024-12-26

