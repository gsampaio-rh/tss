# Product Backlog

**Version**: 1.1.0  
**Last Updated**: 2024

## 🎯 Product Vision

Enhance the Tactical Sailing Simulator with additional features and polish to improve user experience and functionality.

---

## ✅ Version 1.1.0 - Completed (2024)

### Wind Mechanics & Tactical Analysis
- ✅ **Correct Lift/Header Calculation**: Implemented proper lift/header calculation relative to course axis (not boat angle)
- ✅ **VMG Calculation**: Added VMG (Velocity Made Good) and efficiency tracking
- ✅ **Wind Shift Detection**: Track wind shifts and calculate tactical impact correctly
- ✅ **Invariant Validation**: Validate that lift on one tack = header on other (with error logging)
- ✅ **UI Terminology**: Updated to use correct sailing terms (HEADER instead of KNOCK)
- ✅ **Separation of Concerns**: Separated wind events (LIFT/HEADER) from performance states (VMG)

### Layout & UX Improvements
- ✅ **Three-Panel Layout**: Reorganized to 20% left (controls), 60% center (game), 20% right (insights)
- ✅ **Increased Map Scale**: GRID_SIZE 20→25, boat scale 1.4→1.6, mark scale 1.0→1.2
- ✅ **Screen Resolution Display**: Added screen resolution info in settings panel
- ✅ **Map Containment**: Fixed map to stay within center area boundaries
- ✅ **Optimized Scaling**: Map uses 95% of container space with proper padding

### Documentation
- ✅ **Wind Dynamics Documentation**: Comprehensive guide on wind mechanics
- ✅ **Wind Mechanics Specification**: Complete spec for correct lift/header calculation
- ✅ **Implementation Plan**: Detailed plan for wind mechanics implementation

---

## 📋 Backlog Items

### 🔴 High Priority

#### 1. Cup Modal - Race Results & Cup Management
**Story**: As a user, I want to view race results and manage cup competitions so I can track multiple races and see overall standings.

**Acceptance Criteria**:
- Display finish times and positions for completed races
- Show cup standings across multiple races
- Add/remove players to race from cup view
- Reset cup functionality
- Print-friendly view

**Technical Notes**:
- Component: `src/lib/components/modals/CupModal.svelte`
- Store: May need cup store or extend game store
- Persistence: localStorage for cup data

**Estimate**: 8 story points

---

#### 2. Help Modal - User Documentation
**Story**: As a new user, I want to access help documentation so I can learn how to use the application.

**Acceptance Criteria**:
- Modal with help content
- Keyboard shortcuts documentation
- Feature explanations
- Examples and tips

**Technical Notes**:
- Component: `src/lib/components/modals/HelpModal.svelte`
- Content: Extract from original help or create new
- Original help content available in git history if needed

**Estimate**: 5 story points

---

### 🟡 Medium Priority

#### 3. Language/Internationalization (i18n)
**Story**: As a non-English speaker, I want to use the application in my language so I can understand all features.

**Acceptance Criteria**:
- Support for multiple languages (at minimum: English, Russian)
- Language switcher in settings
- All UI text translatable
- Persist language preference

**Technical Notes**:
- Store: `src/lib/stores/lang.ts`
- Use Svelte i18n library or custom solution
- Original has Russian translations (`name_ru` fields)

**Estimate**: 13 story points

---

#### 4. Fullscreen Mode
**Story**: As a user, I want to use fullscreen mode so I can have a better view of the game on larger displays.

**Acceptance Criteria**:
- Toggle fullscreen button
- Exit fullscreen with ESC key
- Preserve game state when entering/exiting
- Visual indicator when in fullscreen

**Technical Notes**:
- Use Fullscreen API
- Add to settings or toolbar
- Handle browser compatibility
- Original implementation available in git history

**Estimate**: 3 story points

---

#### 5. Keyboard Shortcuts
**Story**: As a power user, I want keyboard shortcuts so I can control the game faster.

**Acceptance Criteria**:
- Shortcuts for common actions (Forward/Tack/ToMark for all boats)
- Document shortcuts in help modal
- Visual feedback when shortcuts are used
- Configurable shortcuts (optional)

**Technical Notes**:
- Global keyboard event handlers
- Map shortcuts to game actions
- Original shortcuts available in git history

**Estimate**: 5 story points

---

### 🟢 Low Priority / Nice to Have

#### 6. PWA Features - Offline Support
**Story**: As a user, I want the app to work offline so I can use it without internet connection.

**Acceptance Criteria**:
- Service worker for offline caching
- Offline indicator
- Cache game assets and code
- Handle offline gracefully

**Estimate**: 8 story points

---

#### 7. PWA Features - Install Prompt
**Story**: As a user, I want to install the app on my device so I can access it like a native app.

**Acceptance Criteria**:
- Install prompt for supported browsers
- App icon on home screen
- Standalone mode support
- Update manifest.json with proper icons

**Estimate**: 3 story points

---

#### 8. Performance Optimization
**Story**: As a user, I want the app to run smoothly even with many boats and long races.

**Acceptance Criteria**:
- Optimize rendering for many boats
- Reduce re-renders
- Lazy load components if needed
- Performance profiling and improvements

**Estimate**: 5 story points

---

#### 9. End-to-End Testing
**Story**: As a developer, I want E2E tests so I can ensure the app works correctly after changes.

**Acceptance Criteria**:
- Test critical user flows
- Automated test suite
- CI/CD integration
- Test coverage for core features

**Estimate**: 8 story points

---

#### 10. Enhanced Visual Features
**Story**: As a user, I want enhanced visual features to better understand the game state.

**Acceptance Criteria**:
- Future wind visualization (if not already done)
- Zoom to up mark zone (check if needed)
- Projector mode (optional)
- Additional visual indicators

**Estimate**: 5 story points

---

## 📊 Sprint Planning

### Sprint 1 (Completed)
- ✅ Core migration complete
- ✅ Version 1.0 released

### Sprint 2 (Completed - Version 1.1)
- ✅ Correct wind mechanics implementation
- ✅ Layout improvements
- ✅ Map scale optimization

### Sprint 2 (Next)
- Cup Modal
- Help Modal

### Sprint 3
- i18n implementation
- Fullscreen mode

### Sprint 4
- Keyboard shortcuts
- PWA features

### Sprint 5
- Performance optimization
- Testing

---

## 🎯 Definition of Done

- [ ] Code implemented and reviewed
- [ ] TypeScript types defined
- [ ] Component tested manually
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Accessibility checked (if applicable)
- [ ] Documentation updated (if needed)

---

## 📝 Notes

- Original codebase available in git history if needed for reference
- All new features should maintain TypeScript type safety
- Follow existing component patterns
- Use Svelte stores for state management
- Keep UI consistent with Bootstrap 5 styling
- For CupModal/HelpModal: Reference original implementation in git history if needed

---

## 🔄 Backlog Refinement

This backlog should be reviewed and refined regularly:
- Add new items based on user feedback
- Re-prioritize based on business value
- Break down large items into smaller tasks
- Update estimates based on actual velocity
