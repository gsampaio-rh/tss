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

### 1.5. Improve Tell Tales Design

**Priority**: 🟡 Medium  
**Status**: ✅ Completed  
**Estimated Effort**: 2-3 days  
**Actual Effort**: ~2 hours

#### Requirements
- **Visual Enhancements**:
  - Improve visual clarity and readability
  - Make tell tales more prominent/easier to see
  - Better color contrast and visibility
  - Consider alternative visual styles (ribbons, flags, etc.)

- **Realism Improvements**:
  - More realistic wind flow representation
  - Better animation smoothness and organic feel
  - Enhanced visual feedback for different states
  - Consider adding wind speed indicators

- **User Experience**:
  - Clearer indication of what action to take
  - Better integration with tactical card layout
  - Optional: Add tooltips explaining tell tale states
  - Consider adding numerical indicators (wind angle, etc.)

- **Design Options to Explore**:
  - Ribbon-style tell tales (more realistic)
  - Flag-style indicators
  - Enhanced color gradients
  - Size/scale adjustments
  - Better label positioning

#### Acceptance Criteria
- [x] Tell tales are more visually prominent and clear (3 strands per side, tape points, sail outline)
- [x] Improved visual design (physics-based animation, tapered strands, less saturated colors)
- [x] Better user feedback (3-state system: FLOW, ON_EDGE, STALL with smooth transitions)
- [x] Maintains current functionality (flowing/stalled states, plus ON_EDGE state)
- [x] Better integration with tactical card UI (improved layout, better labels)
- [x] Realistic physics-based animation (noise functions, non-periodic motion)

#### Technical Notes
- ✅ Replaced morphing animation with physics-based noise animation
- ✅ Added 3 strands per side with slight variations (hash offsets for unique motion)
- ✅ Implemented tapered strands (body + highlight) for depth and realism
- ✅ Added tape/attachment points and subtle sail outline (luff curve)
- ✅ Implemented 3-state system (FLOW, ON_EDGE, STALL) with smooth transitions
- ✅ Updated colors to less saturated (muted green/red/yellow)
- ✅ Animation parameters vary by state (amplitude, frequency, jitter, flick chance)
- ✅ Non-periodic motion using deterministic noise functions
- ✅ Tip moves more than root for realistic strand behavior
- ✅ Removed heavy drop shadows, added subtle translucency

#### UI/UX Considerations
- Visual prominence: Should be easy to see at a glance
- Clarity: Users should immediately understand state
- Polish: Professional, refined appearance
- Integration: Fits well with overall UI design
- Accessibility: Works for colorblind users

---

### 2. Wind Zones UI Improvements

**Priority**: 🔴 High  
**Status**: ✅ Completed  
**Estimated Effort**: 1 day  
**Actual Effort**: ~1 day

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
- [x] Wind zone circles/arcs are smaller and less intrusive (reduced from 3.5 to 2.2 units)
- [x] Zones don't obscure important game elements (z-index lowered to 15, thinner strokes)
- [x] Still clearly visible and informative (dashed stroke borders, user-controlled opacity)
- [x] Visual design is polished and professional (thinner strokes, better opacity control)
- [x] Settings allow users to control visibility/opacity (opacity slider added)

#### Technical Notes
- Modify `WindZones.svelte` component
- Adjust SVG circle/arc radius calculations
- Update opacity and stroke width values
- May need to adjust z-index/layering
- Test with different screen sizes

---

### 3. Speed-Based Movement System

**Priority**: 🔴 High  
**Status**: ✅ Completed  
**Estimated Effort**: 3-5 days  
**Actual Effort**: ~2 hours

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
- [x] Speed varies based on angle to wind (ATW)
- [x] Optimal angle (45°) provides full speed (1.0 multiplier)
- [x] Pinching (<42° ATW) reduces speed proportionally (0.7-0.9 range)
- [x] Footing (>50° ATW) reduces speed proportionally (0.7-0.9 range)
- [x] Movement distance reflects speed changes (applied to Forward and ToMark movement)
- [x] Visual indicators show speed differences (TacticalCardService updated to show actual speed)

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

### 6. Better Wind Dynamics (Gusts & Lulls)

**Priority**: 🔴 High  
**Status**: Not Started  
**Estimated Effort**: 4-6 days

#### Description
Implement more realistic wind dynamics with gusts (sudden increases in wind speed) and lulls (sudden decreases). This will add tactical depth as players must adapt to changing wind conditions in real-time.

#### Requirements
- **Gusts**:
  - Sudden increases in wind speed (e.g., +2 to +5 knots)
  - Random occurrence based on wind scenario
  - Visual indicators (wind particles intensify, boat speed increases)
  - Duration: 1-3 turns
  - Frequency: Configurable per wind scenario

- **Lulls**:
  - Sudden decreases in wind speed (e.g., -2 to -5 knots)
  - Random occurrence based on wind scenario
  - Visual indicators (wind particles slow, boat speed decreases)
  - Duration: 1-3 turns
  - Frequency: Configurable per wind scenario

- **Wind Variability**:
  - Base wind speed varies within a range (e.g., 10 knots ± 2 knots)
  - Smooth transitions between gust/lull states
  - Visual feedback showing current wind strength

- **Tactical Impact**:
  - Gusts provide speed advantage (faster VMG)
  - Lulls reduce speed (slower VMG)
  - Players must anticipate and react to changes
  - Different wind scenarios have different gust/lull patterns

#### Acceptance Criteria
- [ ] Gusts occur randomly during races
- [ ] Lulls occur randomly during races
- [ ] Wind speed varies smoothly between states
- [ ] Visual indicators show gust/lull states
- [ ] Boat speed responds to wind changes
- [ ] Wind scenarios can configure gust/lull frequency
- [ ] Tactical metrics (VMG, speed) reflect wind changes

#### Technical Notes
- Modify `WindCalculationService` to add gust/lull logic
- Update wind scenario structure to include gust/lull parameters
- Enhance `WindParticles` component to show intensity changes
- Update `BoatMovementService` to respond to wind speed changes
- May need to add wind speed display in UI
- Consider adding gust/lull prediction indicators

#### UI/UX Considerations
- Visual wind intensity indicators (particle density, color)
- Wind speed display in tactical card or game canvas
- Optional: Gust/lull warnings/alerts
- Smooth animations for wind transitions

---

### 7. Fix Boat Start Position Spacing

**Priority**: 🔴 High  
**Status**: ✅ Completed  
**Estimated Effort**: 1-2 days  
**Actual Effort**: ~1 hour

#### Description
Boats are currently starting too close to each other on the start line, making it difficult to distinguish between boats and creating visual clutter. Increase spacing between boats at the start.

#### Requirements
- **Spacing Calculation**:
  - Increase minimum distance between boats at start
  - Ensure boats don't overlap visually
  - Maintain fair start line distribution
  - Consider different start positions (port, middle, starboard)

- **Start Line Distribution**:
  - Even spacing across available start line length
  - Respect start position preferences (port/middle/starboard)
  - Ensure boats fit within game boundaries
  - Visual clarity: boats should be easily distinguishable

- **Visual Improvements**:
  - Clear separation between boats
  - No overlapping boat graphics
  - Easy to identify each boat's position
  - Maintains tactical start line positioning

#### Acceptance Criteria
- [x] Boats have adequate spacing at start (2.5 units = ~2-3 boat lengths apart)
- [x] No visual overlap between boats (spacing increased from 0.5 to 2.5 units)
- [x] Start positions (port/middle/starboard) are respected
- [x] Boats fit within game boundaries (placed between start marks)
- [x] Visual clarity improved (easy to distinguish boats with 5x spacing increase)
- [x] Works with 2-12 players (simplified placement logic handles all counts)

#### Technical Notes
- Modify `GameSetupService.placeBoatsOnStart()` method
- Update spacing calculations in boat placement logic
- Consider boat length in spacing calculations
- Test with different numbers of players (2, 4, 6, 8, 12)
- May need to adjust start line length or boat size scaling

#### UI/UX Considerations
- Clear visual separation between boats
- Easy to identify each boat's color and position
- Start line should accommodate all boats comfortably
- Consider zoom/scale options if needed

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
2. ✅ **Tell tales indicators** - Completed: Visual wind flow indicators with snake-like animations
3. **Wind zones UI improvements** - Reduce circle size, improve visual design
4. **Better wind dynamics** - Add gusts and lulls for more realistic wind behavior
5. **Fix boat start position spacing** - Increase spacing between boats at start line
6. Speed-based movement system
7. Racing rules implementation
8. Enhanced game statistics

---

**Last Updated**: 2024-12-26

