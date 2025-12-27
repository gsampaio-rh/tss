# TSS Refactoring Plan - FAANG-Level Architecture

> **📊 For current status and sprint planning, see [REFACTORING_STATUS.md](./REFACTORING_STATUS.md)**

## 🎯 Executive Summary

This document outlines a comprehensive refactoring plan to transform the Tactical Sailing Simulator into a production-grade, enterprise-level application following FAANG (Facebook, Amazon, Apple, Netflix, Google) engineering standards.

**Current State**: Functional MVP with basic architecture  
**Target State**: Enterprise-grade, scalable, maintainable, testable codebase

**Progress**: Phase 1, 2, 3 & 4 Complete ✅
- ✅ Phase 1: Foundation & Infrastructure (Code Quality, Logging, Error Handling)
- ✅ Phase 2: Domain Layer Refactoring (Value Objects, Entities, Services)
- ✅ Phase 3: Application Layer (Application Services, DTOs & Mappers)
- ✅ Phase 4: Presentation Layer Refactoring (Component Organization, State Management, Hooks)

**Recent Fixes** (2024-12-26):
- 🔧 Fixed boat movement not responding to wind shifts (BoatMovementService)
- 🔧 Fixed track visualization not displaying (GameEngineService - missing saveTurn calls)
- 🔧 Fixed TypeScript errors (logger API, type imports, boolean conversion)

**Next**: Sprint 5 - Performance & Polish (see REFACTORING_STATUS.md for details)

---

## 📊 Current Architecture Assessment

### Strengths ✅

- TypeScript for type safety
- SvelteKit for modern framework
- Component-based architecture
- Store-based state management
- Separation of concerns (components, stores, utils, types)

### Weaknesses ⚠️

- **No test coverage** - Zero tests currently
- **Large monolithic files**:
  - `gameLogic.ts`: 496 lines (should be < 200)
  - `game.ts` store: 296 lines (should be < 150)
  - `+page.svelte`: 643 lines (should be < 300)
- **Mixed concerns** - Business logic in components, UI logic in stores
- **No error boundaries** - Errors can crash entire app
- **Limited logging/monitoring** - No structured logging or error tracking
- **No performance optimization** - No memoization, lazy loading, or optimization
- **Inconsistent code patterns** - Mix of patterns across codebase
- **No CI/CD pipeline** - Manual deployments
- **Missing documentation** - No API docs, limited inline docs
- **No dependency injection** - Tight coupling between layers
- **Direct DOM manipulation** - Some components manipulate DOM directly
- **No service layer abstraction** - Stores directly call utility functions
- **No validation layer** - Input validation scattered
- **No error recovery** - No retry logic or graceful degradation

---

## 🏗️ Target Architecture

### Layer Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Components, Pages, UI Logic)         │
├─────────────────────────────────────────┤
│         Application Layer               │
│  (Services, Use Cases, Orchestration)  │
├─────────────────────────────────────────┤
│         Domain Layer                    │
│  (Business Logic, Entities, Rules)     │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Stores, Persistence, External APIs)   │
└─────────────────────────────────────────┘
```

### Proposed Structure

```
src/
├── lib/
│   ├── domain/                    # Business logic & entities
│   │   ├── entities/              # Domain entities (Boat, Game, Wind, etc.)
│   │   ├── services/              # Domain services
│   │   ├── repositories/          # Repository interfaces
│   │   └── value-objects/         # Value objects
│   │
│   ├── application/               # Application layer
│   │   ├── services/              # Application services
│   │   ├── use-cases/             # Use case implementations
│   │   ├── dto/                   # Data Transfer Objects
│   │   └── mappers/               # Entity ↔ DTO mappers
│   │
│   ├── infrastructure/            # Infrastructure layer
│   │   ├── stores/                # Svelte stores (state management)
│   │   ├── persistence/          # localStorage, IndexedDB adapters
│   │   ├── logging/               # Logging service
│   │   ├── monitoring/            # Performance monitoring
│   │   └── config/                # Configuration management
│   │
│   ├── presentation/              # Presentation layer
│   │   ├── components/            # UI components
│   │   │   ├── game/             # Game-specific components
│   │   │   ├── controls/         # Control components
│   │   │   ├── modals/           # Modal components
│   │   │   └── shared/           # Shared/reusable components
│   │   ├── pages/                 # Page components
│   │   ├── hooks/                 # Svelte hooks/composables
│   │   └── layouts/               # Layout components
│   │
│   ├── shared/                     # Shared utilities
│   │   ├── utils/                 # Pure utility functions
│   │   ├── constants/             # Constants
│   │   ├── types/                 # Shared TypeScript types
│   │   └── validators/            # Validation functions
│   │
│   └── testing/                    # Test utilities & mocks
│       ├── fixtures/              # Test fixtures
│       ├── mocks/                 # Mock implementations
│       └── helpers/               # Test helpers
│
├── tests/                          # Test files
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   ├── e2e/                       # End-to-end tests
│   └── performance/               # Performance tests
│
└── routes/                         # SvelteKit routes
```

---

## 🚀 Phase 1: Foundation & Infrastructure (Weeks 1-2)

### 1.2 Code Quality Tools

**Priority**: 🔴 Critical  
**Estimate**: 3 days  
**Status**: ✅ COMPLETED

**Tasks**:

- [x] Set up ESLint with strict rules (v9 format)
- [x] Set up Prettier with consistent formatting
- [x] Add Husky for git hooks
- [x] Configure lint-staged for pre-commit checks
- [x] Add commitlint for conventional commits
- [x] Set up TypeScript strict mode (already enabled)
- [x] Add import sorting (eslint-plugin-import)

**Deliverables**:

- ✅ `eslint.config.js` with strict rules (v9 format)
- ✅ `.prettierrc` configuration
- ✅ `.husky/` hooks (pre-commit, commit-msg)
- ✅ Pre-commit validation
- ✅ TypeScript strict mode enabled
- ✅ `.commitlintrc.json` configured

### 1.3 Logging & Error Handling

**Priority**: 🟡 High  
**Estimate**: 4 days  
**Status**: ✅ COMPLETED

**Tasks**:

- [x] Create centralized logging service
- [x] Implement error boundary component
- [ ] Add error tracking (Sentry or similar) - TODO: Integration pending
- [x] Create error types and handling utilities
- [x] Add structured logging with levels
- [x] Implement error recovery strategies

**Deliverables**:

- ✅ `src/lib/infrastructure/logging/logger.ts` - Complete logging service with levels
- ✅ `src/lib/presentation/components/shared/ErrorBoundary.svelte` - Error boundary component
- ✅ `src/lib/infrastructure/errors/ErrorTypes.ts` - Error type definitions
- ✅ `src/lib/infrastructure/errors/errorHandler.ts` - Error handling utilities
- ⏳ Error tracking integration (Sentry) - Pending

---

## 🏛️ Phase 2: Domain Layer Refactoring (Weeks 3-4)

**Status**: ✅ COMPLETED (Core structure)

### 2.1 Domain Entities

**Priority**: 🔴 Critical  
**Estimate**: 5 days  
**Status**: ✅ COMPLETED

**Tasks**:

- [x] Extract Boat entity from class to domain entity
- [ ] Extract Game entity with proper encapsulation - TODO: Keep legacy for compatibility
- [ ] Create Wind entity/value object - TODO: Using WindDirection value object
- [x] Create Mark entity/value object
- [x] Add domain validation rules (in entities)
- [ ] Implement domain events pattern - TODO: Future enhancement

**Deliverables**:

- ✅ `src/lib/domain/entities/Boat.ts` - BoatEntity with proper encapsulation
- ⏳ `src/lib/domain/entities/Game.ts` - Keep legacy Game class for compatibility
- ✅ `src/lib/domain/value-objects/WindDirection.ts` - Wind direction as value object
- ✅ `src/lib/domain/entities/Mark.ts` - MarkEntity created
- ✅ Domain validation rules (in BoatEntity, MarkEntity)
- ⏳ Domain events infrastructure - Future enhancement

### 2.2 Domain Services

**Priority**: 🔴 Critical  
**Estimate**: 6 days  
**Status**: ✅ COMPLETED (with bug fixes)

**Tasks**:

- [x] Break down `gameLogic.ts` (531 lines) into focused services:
  - [x] `GameEngineService` - Core game loop and turn execution
  - [x] `BoatMovementService` - Boat movement calculations (executeBoatTurn logic)
  - [x] `WindCalculationService` - Wind mechanics and vector calculations
  - [x] `TacticalAnalysisService` - Tactical calculations (VMG, Lift/Header, ATW)
  - [x] `NavigationService` - Course calculations, laylines, mark detection
  - [x] `DirtyAirService` - Dirty air zone calculations and effects
- [x] Extract each function from gameLogic.ts into appropriate service
- [x] **Bug Fix**: Boat movement now recalculates rotation based on current wind every turn
- [x] **Bug Fix**: Turn data is now properly saved for track visualization
- [ ] Implement repository pattern interfaces - TODO: Future enhancement
- [ ] Add domain service tests (80%+ coverage) - TODO: Phase 9 (Testing)

**Deliverables**:

- ✅ `src/lib/domain/services/GameEngineService.ts` (~100 lines) - **Fixed**: Now saves turn data
- ✅ `src/lib/domain/services/BoatMovementService.ts` (~250 lines) - **Fixed**: Wind response logic
- ✅ `src/lib/domain/services/WindCalculationService.ts` (~100 lines)
- ✅ `src/lib/domain/services/TacticalAnalysisService.ts` (~150 lines)
- ✅ `src/lib/domain/services/NavigationService.ts` (~80 lines)
- ✅ `src/lib/domain/services/DirtyAirService.ts` (~120 lines)
- ⏳ Repository interfaces - Future enhancement
- ⏳ Unit tests for all services - Phase 9 (Testing)

**Bug Fixes Applied** (2024-12-26):
1. **Wind Response Bug**: `BoatMovementService` was only recalculating rotation during tacking, not for Forward movement. Fixed by recalculating rotation every turn based on current wind and tack.
2. **Track Visualization Bug**: `GameEngineService` was not calling `boat.saveTurn()` after movement execution, so tracks weren't being saved. Fixed by saving turn data with proper point conversion.

### 2.3 Value Objects

**Priority**: 🟡 High  
**Estimate**: 3 days  
**Status**: ✅ COMPLETED

**Tasks**:

- [x] Create Position value object
- [x] Create Angle value object with validation
- [x] Create WindDirection value object
- [x] Create Velocity value object
- [x] Add value object equality/comparison

**Deliverables**:

- ✅ `src/lib/domain/value-objects/Position.ts` - Position with distance/angle calculations
- ✅ `src/lib/domain/value-objects/Angle.ts` - Angle with normalization and validation
- ✅ `src/lib/domain/value-objects/WindDirection.ts` - Wind direction encapsulation
- ✅ `src/lib/domain/value-objects/Velocity.ts` - Velocity with magnitude and direction

---

## 🔧 Phase 3: Application Layer (Weeks 5-6)

**Status**: ✅ COMPLETED

### 3.1 Application Services

**Priority**: 🔴 Critical  
**Estimate**: 5 days  
**Status**: ✅ COMPLETED

**Tasks**:

- [x] Create `GameService` - orchestrates game operations
- [x] Create `PlayerService` - manages players
- [x] Create `WindScenarioService` - manages wind scenarios
- [x] Create `TacticalInsightsService` - provides tactical insights
- [ ] Implement use cases pattern - TODO: Future enhancement
- [ ] Add service tests - TODO: Phase 9 (Testing)

**Deliverables**:

- ✅ `src/lib/application/services/GameService.ts` - Game orchestration
- ✅ `src/lib/application/services/PlayerService.ts` - Player management
- ✅ `src/lib/application/services/WindScenarioService.ts` - Wind scenario management
- ✅ `src/lib/application/services/TacticalInsightsService.ts` - Tactical insights
- ⏳ Use case implementations - Future enhancement
- ⏳ Integration tests - Phase 9 (Testing)

### 3.2 DTOs & Mappers

**Priority**: 🟡 High  
**Estimate**: 3 days  
**Status**: ✅ COMPLETED

**Tasks**:

- [x] Create DTOs for API/storage
- [x] Implement entity ↔ DTO mappers
- [x] Add validation for DTOs
- [x] Create serialization utilities

**Deliverables**:

- ✅ `src/lib/application/dto/GameDTO.ts` - Game, Mark, GameState DTOs
- ✅ `src/lib/application/dto/BoatDTO.ts` - Boat, BoatTurn, Point DTOs
- ✅ `src/lib/application/dto/WindScenarioDTO.ts` - WindScenario DTOs
- ✅ `src/lib/application/dto/validators.ts` - DTO validation
- ✅ `src/lib/application/dto/serialization.ts` - JSON serialization utilities
- ✅ `src/lib/application/mappers/GameMapper.ts` - Game ↔ DTO mapper
- ✅ `src/lib/application/mappers/BoatMapper.ts` - Boat ↔ DTO mapper
- ✅ `src/lib/application/mappers/WindScenarioMapper.ts` - WindScenario ↔ DTO mapper

---

## 🎨 Phase 4: Presentation Layer Refactoring (Weeks 7-8) ✅ COMPLETED

### 4.1 Component Organization ✅

**Priority**: 🟡 High  
**Estimate**: 4 days

**Tasks**:

- [x] Break down `+page.svelte` (643 lines) into smaller components:
  - Extract sidebar sections to separate components (`LeftSidebar.svelte`, `RightSidebar.svelte`)
  - Extract primary action zone to `PrimaryActionZone.svelte`
  - Create `GameStage.svelte` and `AppLayout.svelte`
- [x] Reorganize components by feature
- [x] Create component composition patterns
- [ ] Extract shared components (buttons, cards, etc.) - Future work
- [ ] Add component documentation - Future work
- [ ] Implement component testing - Future work (Phase 9)

**Deliverables**:

- ✅ `AppLayout.svelte` - Main layout orchestrator
- ✅ `LeftSidebar.svelte` - Left sidebar with controls
- ✅ `RightSidebar.svelte` - Right sidebar with tactical insights
- ✅ `GameStage.svelte` - Game canvas container
- ✅ `PrimaryActionZone.svelte` - Action buttons
- ✅ Reorganized component structure in `src/lib/presentation/components/layout/`
- Component documentation - Future work
- Component tests - Future work (Phase 9)

### 4.2 State Management Refactoring ✅

**Priority**: 🔴 Critical  
**Estimate**: 5 days

**Tasks**:

- [x] Break down `game.ts` store (296 lines):
  - Split into `gameStore.ts` (core game state) and `gameActions.ts` (actions)
  - Move complex logic to application services
  - Keep stores thin (delegation to services)
- [x] Refactor stores to use application services
- [x] Create derived stores for computed values
- [ ] Implement store composition pattern - Future enhancement
- [ ] Add store middleware (logging, persistence, error handling) - Future enhancement
- [ ] Add store tests - Future work (Phase 9)

**Deliverables**:

- ✅ `gameStore.ts` (~50 lines) - State only
- ✅ `gameActions.ts` (~250 lines) - Actions delegating to services
- ✅ Refactored stores using services
- ✅ Derived stores (`currentWind`, `previousWind`, `gameWidth`, `gameHeight`, `marks`)
- Store middleware - Future enhancement
- Store tests - Future work (Phase 9)

### 4.3 Hooks/Composables ✅

**Priority**: 🟢 Medium  
**Estimate**: 3 days

**Tasks**:

- [x] Create reusable hooks
  - `useGame()` - Game state hook
  - `useBoat()` - Boat operations hook
  - `useWind()` - Wind operations hook
  - `useTactical()` - Tactical analysis hook
- [ ] Extract component logic to hooks - Future enhancement
- [ ] Add hook tests - Future work (Phase 9)

**Deliverables**:

- ✅ `src/lib/presentation/hooks/useGame.ts` - Game state hook
- ✅ `src/lib/presentation/hooks/useBoat.ts` - Boat operations hook
- ✅ `src/lib/presentation/hooks/useWind.ts` - Wind operations hook
- ✅ `src/lib/presentation/hooks/useTactical.ts` - Tactical analysis hook
- ✅ `src/lib/presentation/hooks/index.ts` - Hooks exports
- Hook tests - Future work (Phase 9)

---

## ⚡ Phase 5: Performance Optimization (Week 9)

### 5.1 Rendering Optimization

**Priority**: 🟡 High  
**Estimate**: 4 days

**Tasks**:

- [ ] Implement virtual scrolling for large lists
- [ ] Add component memoization
- [ ] Optimize re-renders with reactive statements
- [ ] Lazy load heavy components
- [ ] Optimize SVG rendering
- [ ] Add performance monitoring

**Deliverables**:

- Optimized rendering
- Performance benchmarks
- Monitoring dashboard

### 5.2 Memory Management

**Priority**: 🟡 High  
**Estimate**: 3 days

**Tasks**:

- [ ] Implement object pooling for particles
- [ ] Add cleanup for event listeners
- [ ] Optimize store subscriptions
- [ ] Add memory leak detection
- [ ] Implement efficient data structures

**Deliverables**:

- Memory optimizations
- Leak detection tools
- Performance metrics

---

## 🧪 Phase 9: Testing & Quality Assurance (Week 13 - Final Phase)

**Note**: Testing is intentionally done at the end after all refactoring is complete. This ensures we test the final, refactored codebase rather than intermediate states. The testing infrastructure is set up in Phase 1, but actual tests are written here.

### 9.1 Unit Tests

**Priority**: 🔴 Critical  
**Estimate**: 8 days

**Tasks**:

- [ ] Test all domain services (80%+ coverage)
- [ ] Test all application services
- [ ] Test utility functions
- [ ] Test value objects
- [ ] Test domain entities
- [ ] Test all refactored modules

**Deliverables**:

- Unit test suite
- 80%+ code coverage
- Test documentation

### 9.2 Integration Tests

**Priority**: 🔴 Critical  
**Estimate**: 5 days

**Tasks**:

- [ ] Test store integrations
- [ ] Test service integrations
- [ ] Test component-service integration
- [ ] Test persistence layer
- [ ] Test cross-layer integrations

**Deliverables**:

- Integration test suite
- Test scenarios documentation

### 9.3 E2E Tests

**Priority**: 🟡 High  
**Estimate**: 5 days

**Tasks**:

- [ ] Test critical user flows
- [ ] Test game mechanics end-to-end
- [ ] Test UI interactions
- [ ] Test error scenarios
- [ ] Test all refactored features

**Deliverables**:

- E2E test suite
- Test scenarios

### 9.4 CI/CD Testing Integration

**Priority**: 🔴 Critical  
**Estimate**: 2 days

**Tasks**:

- [ ] Integrate test execution into CI/CD pipeline
- [ ] Add test coverage reporting to CI
- [ ] Add test failure notifications
- [ ] Configure coverage thresholds
- [ ] Add performance test execution

**Deliverables**:

- Complete CI/CD pipeline with testing
- Automated test execution on every commit
- Coverage reporting and thresholds

---

## 📚 Phase 7: Documentation & Developer Experience (Week 11)

### 7.1 Code Documentation

**Priority**: 🟡 High  
**Estimate**: 4 days

**Tasks**:

- [ ] Add JSDoc comments to all public APIs
- [ ] Document domain models
- [ ] Create architecture decision records (ADRs)
- [ ] Document design patterns used
- [ ] Add inline code comments for complex logic

**Deliverables**:

- Complete API documentation
- ADR documents
- Architecture diagrams

### 7.2 Developer Documentation

**Priority**: 🟡 High  
**Estimate**: 3 days

**Tasks**:

- [ ] Update README with architecture overview
- [ ] Create CONTRIBUTING.md
- [ ] Create DEVELOPMENT.md guide
- [ ] Document testing strategies
- [ ] Create component storybook (optional)

**Deliverables**:

- Comprehensive documentation
- Developer guides
- Contribution guidelines

---
<!-- 
## 🔄 Phase 8: CI/CD & DevOps (Week 12)

### 8.1 CI/CD Pipeline

**Priority**: 🔴 Critical  
**Estimate**: 4 days

**Tasks**:

- [ ] Set up GitHub Actions / GitLab CI
- [ ] Add linting/formatting checks
- [ ] Add build verification
- [ ] Add deployment pipeline
- [ ] Add version management
- [ ] **Note**: Testing pipeline will be added in Phase 9 after tests are written

**Deliverables**:

- CI/CD pipeline (without tests initially)
- Automated deployments
- Version management

### 8.2 Monitoring & Observability

**Priority**: 🟡 High  
**Estimate**: 3 days

**Tasks**:

- [ ] Add performance monitoring
- [ ] Add error tracking
- [ ] Add analytics
- [ ] Create monitoring dashboard
- [ ] Add alerting

**Deliverables**:

- Monitoring setup
- Error tracking
- Performance metrics -->

---

## 📋 Implementation Priorities

### Must Have (MVP Refactoring)

1. ✅ Testing infrastructure (setup only, tests written later)
2. ✅ Code quality tools - **COMPLETED**
3. ✅ Domain layer refactoring - **COMPLETED**
4. ✅ Application services - **COMPLETED**
5. ⏳ Code refactoring complete - **IN PROGRESS** (Phase 4)

### Should Have (Production Ready)

6. ✅ Error handling & logging
7. ✅ Component refactoring
8. ✅ Performance optimization
9. ✅ CI/CD pipeline
10. ✅ Comprehensive test suite (done at end)

### Nice to Have (Enterprise Grade)

11. ⚪ Advanced monitoring
12. ⚪ E2E tests
13. ⚪ Documentation
14. ⚪ Storybook
15. ⚪ Advanced performance optimizations

---

## 🎯 Success Metrics

### Code Quality

- [ ] 80%+ test coverage
- [ ] 0 critical linting errors
- [ ] TypeScript strict mode enabled
- [ ] All components documented

### Performance

- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] 60 FPS during game animations
- [ ] Memory usage < 100MB

### Maintainability

- [ ] Average file size < 200 lines (currently: 496, 296, 643)
- [ ] Max file size < 300 lines
- [ ] Cyclomatic complexity < 10
- [ ] No code duplication (DRY principle)
- [ ] Clear separation of concerns
- [ ] Single Responsibility Principle (SRP) followed

### Developer Experience

- [ ] CI/CD pipeline < 5 minutes
- [ ] Local setup < 5 minutes
- [ ] Comprehensive documentation
- [ ] Clear contribution guidelines

---

## 🛠️ Tools & Technologies

### Testing

- **Vitest** - Unit/integration tests
- **Playwright** - E2E tests
- **Testing Library** - Component tests
- **MSW** - API mocking

### Code Quality

- **ESLint** - Linting
- **Prettier** - Formatting
- **TypeScript** - Type safety
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks

### Monitoring

- **Sentry** - Error tracking
- **Web Vitals** - Performance monitoring
- **Custom analytics** - Usage tracking

### CI/CD

- **GitHub Actions** / **GitLab CI**
- **Docker** (if needed)
- **Semantic Release** - Version management

---

## 📅 Timeline Estimate

**Total Duration**: 13 weeks (3+ months)

- **Phase 1**: Weeks 1-2 (Foundation)
- **Phase 2**: Weeks 3-4 (Domain)
- **Phase 3**: Weeks 5-6 (Application)
- **Phase 4**: Weeks 7-8 (Presentation)
- **Phase 5**: Week 9 (Performance)
- **Phase 6**: Week 10 (Testing) - **MOVED TO END**
- **Phase 7**: Week 11 (Documentation)
- **Phase 8**: Week 12 (CI/CD)
- **Phase 9**: Week 13 (Testing & QA) - **FINAL PHASE**

**Note**: Testing is intentionally done last to ensure we test the final refactored codebase rather than intermediate states.

**Parallel Work**: Some phases can overlap (e.g., Documentation can be done alongside development)

---

## 🚦 Risk Assessment

### High Risk

- **Breaking changes during refactoring** → Mitigation: Incremental refactoring, feature flags
- **Test coverage gaps** → Mitigation: Test-first approach, coverage thresholds
- **Performance regression** → Mitigation: Performance benchmarks, monitoring

### Medium Risk

- **Timeline delays** → Mitigation: Phased approach, MVP-first
- **Team knowledge transfer** → Mitigation: Documentation, pair programming

---

## 📝 Next Steps

1. **Review & Approve Plan** - Get stakeholder buy-in
2. **Set Up Phase 1** - Initialize testing and code quality tools
3. **Create Feature Branch** - `refactor/faang-architecture`
4. **Start Incremental Refactoring** - One module at a time
5. **Continuous Integration** - Merge frequently, test always

---

## 🔍 Specific Refactoring Targets

### File Size Reduction

| File            | Current   | Target      | Strategy                                  |
| --------------- | --------- | ----------- | ----------------------------------------- |
| `gameLogic.ts`  | 496 lines | < 200 lines | Split into 6 domain services              |
| `game.ts` store | 296 lines | < 150 lines | Split state/actions, delegate to services |
| `+page.svelte`  | 643 lines | < 200 lines | Extract 4+ sub-components                 |

### Code Smells to Address

1. **God Object**: `Game` class does too much
   - Solution: Extract to multiple domain entities/services

2. **Long Method**: `executeBoatTurn()` is 200+ lines
   - Solution: Extract into smaller, focused methods

3. **Feature Envy**: Components directly access game internals
   - Solution: Use application services as facade

4. **Data Clumps**: Related data passed separately
   - Solution: Create value objects (Position, WindVector, etc.)

5. **Primitive Obsession**: Using primitives instead of domain types
   - Solution: Create value objects for angles, positions, etc.

---

## 📐 Design Patterns to Implement

### Domain Layer

- **Repository Pattern** - Abstract data access
- **Domain Events** - Decouple domain logic
- **Value Objects** - Encapsulate domain concepts
- **Factory Pattern** - Create complex entities

### Application Layer

- **Service Layer** - Orchestrate use cases
- **DTO Pattern** - Transfer data between layers
- **Mapper Pattern** - Convert between layers
- **Use Case Pattern** - Encapsulate business workflows

### Presentation Layer

- **Container/Presenter** - Separate logic from presentation
- **Composition Pattern** - Build complex UIs from simple components
- **Observer Pattern** - React to state changes (Svelte stores)

### Infrastructure Layer

- **Adapter Pattern** - Abstract external dependencies
- **Strategy Pattern** - Pluggable algorithms (e.g., persistence strategies)

---

## 🧩 Module Breakdown Example

### Current: `gameLogic.ts` (496 lines)

```
gameLogic.ts
├── Constants (10 lines)
├── angleDiff() (10 lines)
├── distance() (5 lines)
├── getRotateAngle() (5 lines)
├── getCourseAxis() (5 lines)
├── getOptimalHeading() (15 lines)
├── calculateLiftHeader() (50 lines)
├── calculateVMG() (20 lines)
├── calculateVMGEfficiency() (15 lines)
├── getDirtyAirEffect() (80 lines)
├── isPointInDirtyAirZone() (100 lines)
└── executeBoatTurn() (200 lines)
```

### Target: Domain Services

```
domain/
├── value-objects/
│   ├── Angle.ts (angleDiff, normalization)
│   ├── Position.ts (distance, calculations)
│   └── WindVector.ts (wind calculations)
├── services/
│   ├── NavigationService.ts (getRotateAngle, getCourseAxis)
│   ├── TacticalAnalysisService.ts (calculateLiftHeader, VMG)
│   ├── DirtyAirService.ts (dirty air calculations)
│   └── BoatMovementService.ts (executeBoatTurn)
└── entities/
    └── Boat.ts (getOptimalHeading as method)
```

---

## 🎓 Code Review Checklist

### Before Merging Any Refactored Code

- [ ] All tests pass (unit, integration, E2E)
- [ ] Code coverage ≥ 80%
- [ ] No linting errors
- [ ] TypeScript strict mode passes
- [ ] File size < target (200-300 lines)
- [ ] Cyclomatic complexity < 10
- [ ] No code duplication
- [ ] Documentation updated
- [ ] Performance benchmarks maintained/improved
- [ ] No breaking changes (or migration guide provided)

---

## 🐛 Bug Fixes During Refactoring

### Critical Bugs Discovered & Fixed (2024-12-26)

#### 1. Boat Movement Not Responding to Wind Shifts
**Issue**: Boats continued moving straight despite wind shifts because rotation was only recalculated during tacking, not for Forward movement.

**Root Cause**: `BoatMovementService.executeBoatTurn()` only set rotation when `TurnType.Tack`, but didn't recalculate it for `TurnType.Forward` based on current wind.

**Fix**: Added rotation recalculation for Forward movement every turn:
```typescript
// For Forward movement, recalculate rotation based on current wind and tack
if (boat.turntype === TurnType.Forward) {
  if (currentTack) {
    currentRotation = currentWind.add(Angle.fromDegrees(45)); // Port tack
  } else {
    currentRotation = currentWind.subtract(Angle.fromDegrees(45)); // Starboard tack
  }
}
```

**Files Modified**: `src/lib/domain/services/BoatMovementService.ts`

#### 2. Track Visualization Not Displaying
**Issue**: Boat tracks were not visible on the canvas because turn data wasn't being saved.

**Root Cause**: `GameEngineService.executeTurn()` called `BoatMovementService.executeBoatTurn()` but didn't save the returned turn data to `boat.turns`.

**Fix**: Added turn data saving after movement execution:
```typescript
const result = BoatMovementService.executeBoatTurn(boat, game, enableDirtyAirEffects);
const points = result.points.map(p => ({ x: p.x, y: p.y }));
boat.saveTurn(boat.turntype, points, result.finalRotation.degrees, result.finalTack, result.finished);
```

**Files Modified**: `src/lib/domain/services/GameEngineService.ts`

#### 3. TypeScript Compilation Errors
**Issue**: Multiple TypeScript errors preventing compilation.

**Fixes Applied**:
- Fixed logger API calls (context parameter position)
- Fixed type imports (Boat/Game used as values, not types)
- Fixed missing `writable` import in middleware
- Fixed boolean type conversion (`finished` property)

**Files Modified**: Multiple files across application and infrastructure layers

---

## 📖 References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [SvelteKit Best Practices](https://kit.svelte.dev/docs)
- [FAANG Engineering Standards](https://github.com/google/eng-practices)

---

**Last Updated**: 2024-12-26  
**Version**: 1.1  
**Status**: Active - Bug Fixes Applied
