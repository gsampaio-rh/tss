# Refactoring Backlog

This document tracks refactoring tasks to improve code quality, maintainability, and senior-level architecture in the `components/game` directory.

**Last Updated**: 2024-12-28

---

## 🎯 High Priority Refactoring

### 1. Refactor PlayerTacticalCard.svelte (1855 lines → Multiple Components)

**Priority**: 🔴 Critical  
**Status**: Not Started  
**Estimated Effort**: 3-5 days  
**Current Size**: 1855 lines

#### Problem
`PlayerTacticalCard.svelte` is a monolithic component that violates Single Responsibility Principle. It contains:
- Multiple modal states and logic (VMG, ATW, Heading, Tack Advantage)
- History tracking for 4 different metrics
- Complex tactical calculations
- Tell tales visualization
- Multiple metric card renderings
- Extensive CSS (800+ lines)

#### Proposed Refactoring

**1.1 Extract Metric Modals into Separate Components**
- Create `MetricModal.svelte` base component
- Extract `VMGModal.svelte`, `ATWModal.svelte`, `HeadingModal.svelte`, `TackAdvantageModal.svelte`
- Each modal handles its own state and history tracking
- **Estimated**: 1 day

**1.2 Extract Metric Cards into Reusable Components**
- Create `MetricCard.svelte` base component
- Extract `VMGMetricCard.svelte`, `ATWMetricCard.svelte`, `HeadingMetricCard.svelte`, etc.
- Each card handles its own calculations and display logic
- **Estimated**: 1 day

**1.3 Extract Tell Tales into Separate Component**
- Create `TellTales.svelte` component
- Move all tell tale logic, animations, and SVG paths
- Props: `isPinching`, `isFooting`, `leewardColor`, `windwardColor`
- **Estimated**: 0.5 days

**1.4 Extract History Tracking into Composable Hook**
- Create `useMetricHistory.ts` composable
- Handles history tracking logic for any metric
- Reusable across VMG, ATW, Heading, Tack Advantage
- **Estimated**: 0.5 days

**1.5 Extract Tactical Calculations into Service**
- Create `TacticalCardService.ts` in domain/application layer
- Move calculation logic out of component
- Component becomes presentation-only
- **Estimated**: 1 day

**1.6 Extract CSS into Separate Stylesheet**
- Move CSS to `PlayerTacticalCard.module.css` or separate `<style>` files
- Use CSS modules or scoped styles
- **Estimated**: 0.5 days

#### Target Structure
```
components/game/
├── PlayerTacticalCard.svelte (200-300 lines - orchestrator)
├── tactical/
│   ├── TellTales.svelte
│   ├── MetricCard.svelte
│   ├── VMGMetricCard.svelte
│   ├── ATWMetricCard.svelte
│   ├── HeadingMetricCard.svelte
│   ├── TackAdvantageMetricCard.svelte
│   └── modals/
│       ├── MetricModal.svelte
│       ├── VMGModal.svelte
│       ├── ATWModal.svelte
│       ├── HeadingModal.svelte
│       └── TackAdvantageModal.svelte
└── hooks/
    └── useMetricHistory.ts
```

#### Acceptance Criteria
- [ ] PlayerTacticalCard.svelte reduced to < 300 lines
- [ ] Each extracted component has single responsibility
- [ ] No code duplication between metric cards/modals
- [ ] History tracking logic is reusable
- [ ] CSS is properly scoped and organized
- [ ] All tests pass
- [ ] No performance regressions

---

### 2. Refactor BoatTacticalIndicators.svelte (545 lines)

**Priority**: 🟡 Medium  
**Status**: Not Started  
**Estimated Effort**: 1-2 days  
**Current Size**: 545 lines

#### Problem
Component handles multiple responsibilities:
- Tactical calculations
- Visual indicators rendering
- State management

#### Proposed Refactoring
- Extract calculation logic to `TacticalCalculationService`
- Split into smaller indicator components
- Use composition pattern

---

### 3. Refactor WindParticles.svelte (536 lines)

**Priority**: 🟡 Medium  
**Status**: Not Started  
**Estimated Effort**: 1-2 days  
**Current Size**: 536 lines

#### Problem
Large component with complex particle system logic.

#### Proposed Refactoring
- Extract particle system logic to `WindParticleSystem.ts`
- Separate rendering from logic
- Optimize performance with object pooling

---

### 4. Refactor GameCanvas.svelte (430 lines)

**Priority**: 🟡 Medium  
**Status**: Not Started  
**Estimated Effort**: 1-2 days  
**Current Size**: 430 lines

#### Problem
Canvas rendering logic mixed with component lifecycle.

#### Proposed Refactoring
- Extract canvas rendering to `CanvasRenderer.ts`
- Separate drawing logic from component
- Use composition for different render layers

---

## 🟢 Medium Priority Refactoring

### 5. Extract Chart Components Common Logic

**Priority**: 🟢 Low  
**Status**: Not Started  
**Estimated Effort**: 1 day

#### Problem
`VMGChart.svelte`, `ATWChart.svelte`, `HeadingChart.svelte`, `TackAdvantageChart.svelte` share similar structure.

#### Proposed Refactoring
- Create `BaseChart.svelte` with common SVG structure
- Extract shared chart utilities to `chartUtils.ts`
- Use composition for chart-specific logic

---

### 6. Consolidate Chart Components

**Priority**: 🟢 Low  
**Status**: Not Started  
**Estimated Effort**: 2 days

#### Proposed Refactoring
- Create generic `TacticalChart.svelte` component
- Use props/configuration to handle different metric types
- Reduce code duplication

---

## 📋 Refactoring Principles

### Code Quality Goals
- **Single Responsibility**: Each component should have one clear purpose
- **Composition over Inheritance**: Prefer composition for reusability
- **Separation of Concerns**: Logic in services, presentation in components
- **DRY**: Don't Repeat Yourself - extract common patterns
- **Testability**: Components should be easily testable in isolation

### Target Metrics
- **Component Size**: < 300 lines per component
- **Function Complexity**: < 10 cyclomatic complexity
- **File Organization**: Logical grouping by feature/domain
- **Code Reuse**: > 70% code reuse for similar components

### Refactoring Process
1. **Analysis**: Identify responsibilities and dependencies
2. **Design**: Plan component structure and interfaces
3. **Extract**: Move code to new components/services incrementally
4. **Test**: Ensure functionality preserved
5. **Refine**: Optimize and improve based on feedback

---

## 🎯 Current Sprint Focus

**Refactoring Sprint Goals** (Next 2 weeks):
1. **PlayerTacticalCard refactoring** - Break down monolithic component
2. **Extract metric modals** - Create reusable modal components
3. **Extract metric cards** - Create reusable card components
4. **Extract tell tales** - Separate tell tales visualization

---

**Last Updated**: 2024-12-28

