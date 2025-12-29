# Architecture Overview

## System Architecture

The Tactical Sailing Simulator follows **Clean Architecture** principles with clear separation of concerns across four main layers:

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                     │
│  (Svelte Components, Hooks, UI State Management)      │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                 Application Layer                        │
│  (Use Cases, Services, DTOs, Mappers)                   │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   Domain Layer                          │
│  (Entities, Value Objects, Domain Services, Events)     │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer                       │
│  (Logging, Error Handling, Stores, External Services)   │
└─────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Domain Layer (Core Business Logic)

**Purpose**: Contains the core business logic and domain rules. This layer is independent of frameworks and external concerns.

**Components**:
- **Entities**: `GameEntity`, `BoatEntity`, `MarkEntity` - Core business objects with encapsulated behavior
- **Value Objects**: `Position`, `Angle`, `WindDirection`, `Velocity` - Immutable domain concepts
- **Domain Services**: Business logic that doesn't belong to a single entity
  - `GameEngineService` - Core game loop and turn execution
  - `BoatMovementService` - Boat movement calculations
  - `TacticalAnalysisService` - VMG, lift/header calculations
  - `NavigationService` - Course calculations, laylines
  - `WindCalculationService` - Wind transformations
  - `DirtyAirService` - Dirty air zone calculations
- **Domain Events**: `GameCreatedEvent`, `TurnExecutedEvent`, etc. - Domain events for event-driven architecture
- **Repository Interfaces**: `IGameRepository`, `IBoatRepository`, etc. - Data access abstractions

**Key Principles**:
- No dependencies on other layers
- Pure business logic
- Domain events for side effects
- Repository pattern for data access abstraction

### 2. Application Layer (Use Cases & Orchestration)

**Purpose**: Orchestrates domain objects to perform application-specific tasks. Coordinates between domain and infrastructure.

**Components**:
- **Use Cases**: Application-specific business rules
  - `CreateGameUseCase` - Create a new game
  - `ExecuteTurnUseCase` - Execute a game turn
  - `AddPlayerUseCase` - Add a player to the game
  - `StartRaceUseCase` - Start the race
  - `BackTurnUseCase` - Undo last turn
  - `ResetGameUseCase` - Reset game to start
- **Application Services**: Higher-level orchestration
  - `GameService` - Game operations orchestration
  - `PlayerService` - Player/boat operations
  - `AIPlayerService` - AI decision-making
  - `WindScenarioService` - Wind scenario management
  - `TacticalInsightsService` - Tactical analysis for UI
- **DTOs**: Data Transfer Objects for data exchange
  - `GameDTO`, `BoatDTO`, `WindScenarioDTO`
- **Mappers**: Convert between domain entities and DTOs
  - `GameMapper`, `BoatMapper`, `WindScenarioMapper`

**Key Principles**:
- Depends only on Domain layer
- Orchestrates domain services
- Handles application-specific logic
- Uses DTOs for data transfer

### 3. Presentation Layer (UI & User Interaction)

**Purpose**: Handles user interface and user interactions. Reacts to user input and displays data.

**Components**:
- **Layout Components**: `AppLayout`, `LeftSidebar`, `RightSidebar`, `GameStage`
- **Game Components**: `GameCanvas`, `Boat`, `Marks`, `WindParticles`, etc.
- **Shared Components**: `Button`, `Card`, `Modal`, `FormInput`, `Select`, `Textarea`
- **Hooks**: Reusable component logic
  - `useGame()` - Game state and operations
  - `useBoat()` - Boat operations
  - `useWind()` - Wind operations
  - `useTactical()` - Tactical analysis
  - `useModal()` - Modal state management
  - `useCollapse()` - Collapse/expand state
  - `useForm()` - Form state and validation

**Key Principles**:
- Depends on Application layer (via stores/actions)
- Reactive UI updates
- Component composition
- Hooks for reusable logic

### 4. Infrastructure Layer (Technical Concerns)

**Purpose**: Provides technical capabilities and integrations with external systems.

**Components**:
- **Logging**: `logger.ts` - Centralized logging service
- **Error Handling**: `errorHandler.ts`, `ErrorTypes.ts`, `sentry.ts`
- **Stores**: Svelte stores with middleware
  - `gameStore.ts` - Game state
  - `gameActions.ts` - Game actions
  - `settings.ts` - User settings
  - `wind.ts` - Wind scenarios
- **Store Middleware**: Logging, persistence, error handling
- **Store Composition**: Utilities for composing stores

**Key Principles**:
- Implements interfaces from Domain layer
- Handles technical concerns
- Provides infrastructure services
- Can depend on external libraries

## Data Flow

### Typical Request Flow

1. **User Action** → Presentation Layer (Component)
2. **Component** → Calls `gameActions` or hook
3. **Action/Hook** → Calls Application Service
4. **Application Service** → Orchestrates Domain Services
5. **Domain Service** → Uses Domain Entities/Value Objects
6. **Domain Event** → Published if needed
7. **Response** → Flows back through layers
8. **Store Update** → Triggers reactive UI updates

### Example: Executing a Turn

```
User clicks "Next Turn"
  ↓
LeftSidebar.handleTurn()
  ↓
gameActions.turn()
  ↓
GameService.executeTurn()
  ↓
GameEngineService.executeTurn()
  ↓
For each boat:
  - If AI: AIPlayerService.makeDecision()
  - BoatMovementService.executeBoatTurn()
  - boat.saveTurn()
  ↓
game.turncount++
  ↓
Store updates → UI re-renders
```

## Design Patterns Used

### 1. Repository Pattern
- **Purpose**: Abstract data access
- **Location**: `src/lib/domain/repositories/`
- **Implementation**: Interfaces defined in domain, implementations in infrastructure

### 2. Use Case Pattern
- **Purpose**: Encapsulate application-specific business rules
- **Location**: `src/lib/application/use-cases/`
- **Benefits**: Clear application boundaries, testable, reusable

### 3. Domain Events Pattern
- **Purpose**: Decouple domain logic from side effects
- **Location**: `src/lib/domain/events/`
- **Benefits**: Event-driven architecture, loose coupling

### 4. DTO Pattern
- **Purpose**: Transfer data between layers
- **Location**: `src/lib/application/dto/`
- **Benefits**: Layer independence, data validation

### 5. Mapper Pattern
- **Purpose**: Convert between domain entities and DTOs
- **Location**: `src/lib/application/mappers/`
- **Benefits**: Separation of concerns, type safety

### 6. Value Object Pattern
- **Purpose**: Represent immutable domain concepts
- **Location**: `src/lib/domain/value-objects/`
- **Examples**: `Position`, `Angle`, `WindDirection`

### 7. Service Layer Pattern
- **Purpose**: Encapsulate business logic
- **Location**: Domain services, Application services
- **Benefits**: Reusable business logic, clear responsibilities

### 8. Store Composition Pattern
- **Purpose**: Compose multiple stores
- **Location**: `src/lib/infrastructure/stores/composition.ts`
- **Benefits**: Reusable store logic, better organization

### 9. Middleware Pattern
- **Purpose**: Add cross-cutting concerns to stores
- **Location**: `src/lib/infrastructure/stores/middleware.ts`
- **Benefits**: Logging, persistence, error handling

## Key Architectural Decisions

### ADR-001: Clean Architecture Layering
**Decision**: Use Clean Architecture with 4 layers (Domain, Application, Infrastructure, Presentation)

**Rationale**:
- Clear separation of concerns
- Domain logic independent of frameworks
- Easy to test and maintain
- Scalable architecture

**Consequences**:
- More files and structure
- Requires discipline to maintain boundaries
- Better long-term maintainability

### ADR-002: Domain-Driven Design
**Decision**: Use DDD principles with Entities, Value Objects, Domain Services, and Domain Events

**Rationale**:
- Rich domain model
- Encapsulated business logic
- Event-driven architecture
- Clear domain boundaries

**Consequences**:
- More complex domain layer
- Better business logic encapsulation
- Easier to extend domain concepts

### ADR-003: SvelteKit for Framework
**Decision**: Use SvelteKit as the web framework

**Rationale**:
- Reactive UI updates
- TypeScript support
- Server-side rendering capability
- Good developer experience

**Consequences**:
- Framework-specific code in Presentation layer
- Leverages Svelte reactivity
- Good performance

### ADR-004: Repository Pattern for Data Access
**Decision**: Use Repository pattern interfaces in Domain layer

**Rationale**:
- Domain layer independence
- Easy to swap implementations
- Testable with mocks
- Clear data access boundaries

**Consequences**:
- Additional abstraction layer
- More interfaces to maintain
- Better testability

### ADR-005: Event-Driven Architecture
**Decision**: Use Domain Events for side effects and decoupling

**Rationale**:
- Loose coupling
- Easy to add new event handlers
- Clear event flow
- Better separation of concerns

**Consequences**:
- Event bus infrastructure needed
- More complex event handling
- Better extensibility

## File Organization

```
src/lib/
├── domain/              # Domain Layer
│   ├── entities/        # Domain entities
│   ├── value-objects/   # Value objects
│   ├── services/        # Domain services
│   ├── events/          # Domain events
│   └── repositories/    # Repository interfaces
├── application/         # Application Layer
│   ├── use-cases/       # Use cases
│   ├── services/        # Application services
│   ├── dto/             # Data Transfer Objects
│   └── mappers/         # Entity-DTO mappers
├── presentation/        # Presentation Layer
│   ├── components/      # Svelte components
│   └── hooks/           # Reusable hooks
└── infrastructure/      # Infrastructure Layer
    ├── logging/         # Logging service
    ├── errors/          # Error handling
    └── stores/          # Store utilities
```

## Dependencies Flow

- **Presentation** → Application, Infrastructure (stores)
- **Application** → Domain
- **Infrastructure** → Domain (implements interfaces)
- **Domain** → No dependencies (pure business logic)

## Testing Strategy

### Testing Philosophy

- **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
- **Test in Isolation**: Unit tests should test one thing at a time
- **Test Edge Cases**: Don't just test the happy path
- **Maintain Tests**: Keep tests updated with code changes
- **Fast Feedback**: Tests should run quickly

### Testing Pyramid

```
        /\
       /  \
      / E2E \        Few, slow, expensive
     /------\
    /        \
   /Integration\     Some, medium speed
  /------------\
 /              \
/    Unit Tests  \   Many, fast, cheap
------------------
```

### Test Types

#### Unit Tests

**Purpose**: Test individual units (functions, classes, services) in isolation.

**Coverage Target**: 80%+ for domain services, 70%+ for application services

**What to Test**:
- Domain services (GameEngineService, BoatMovementService, etc.)
- Value objects (Position, Angle, WindDirection)
- Domain entities (GameEntity, BoatEntity)
- Application services (GameService, PlayerService)
- Utility functions

**Example**:

```typescript
import { describe, it, expect } from 'vitest';
import { TacticalAnalysisService } from '$lib/domain/services/TacticalAnalysisService';
import { Angle } from '$lib/domain/value-objects/Angle';
import { Position } from '$lib/domain/value-objects/Position';

describe('TacticalAnalysisService', () => {
  describe('calculateVMG', () => {
    it('should calculate VMG correctly when heading toward target', () => {
      const boatPos = new Position(0, 0);
      const targetPos = new Position(0, 10);
      const heading = Angle.fromDegrees(0); // Heading north
      const speed = 1.0;

      const vmg = TacticalAnalysisService.calculateVMG(
        boatPos,
        targetPos,
        speed,
        heading
      );

      expect(vmg).toBeCloseTo(1.0, 2); // Should be close to speed
    });
  });
});
```

#### Integration Tests

**Purpose**: Test interactions between multiple units.

**What to Test**:
- Service interactions (GameService + GameEngineService)
- Store updates (gameActions + stores)
- Component-service integration
- Event handling (Domain events)

**Example**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from '$lib/application/services/GameService';
import { game, players } from '$lib/stores/game';
import { get } from 'svelte/store';

describe('GameService Integration', () => {
  beforeEach(() => {
    game.set(null);
    players.set([]);
  });

  it('should create game and update stores', () => {
    const windScenario = { /* ... */ };
    const newGame = GameService.createGame(2, windScenario);

    expect(get(game)).not.toBeNull();
    expect(get(players).length).toBe(2);
  });
});
```

#### E2E Tests

**Purpose**: Test complete user flows from start to finish.

**What to Test**:
- Critical user flows (create game, execute turns, finish race)
- Game mechanics end-to-end
- UI interactions
- Error scenarios

**Example** (using Playwright):

```typescript
import { test, expect } from '@playwright/test';

test('complete game flow', async ({ page }) => {
  await page.goto('/');
  
  // Select wind scenario
  await page.click('[data-testid="wind-scenario-pendulum"]');
  
  // Add players
  await page.click('[data-testid="add-player"]');
  await page.click('[data-testid="add-ai-player"]');
  
  // Start race
  await page.click('[data-testid="start-race"]');
  
  // Execute turns
  for (let i = 0; i < 5; i++) {
    await page.click('[data-testid="next-turn"]');
    await page.waitForTimeout(100);
  }
  
  // Verify game state
  const turnCount = await page.textContent('[data-testid="turn-count"]');
  expect(turnCount).toBe('5');
});
```

### Testing Tools

- **Unit & Integration Tests**: Vitest (recommended), Jest (alternative)
- **E2E Tests**: Playwright (recommended), Cypress (alternative)
- **Coverage**: Vitest Coverage (built-in), Istanbul

### Test Organization

**File Structure**:
```
src/
├── lib/
│   ├── domain/
│   │   └── services/
│   │       └── GameEngineService.test.ts
│   └── application/
│       └── services/
│           └── GameService.test.ts
└── tests/
    ├── unit/          # Unit tests
    ├── integration/   # Integration tests
    └── e2e/           # E2E tests
```

**Naming Conventions**:
- Test files: `*.test.ts` or `*.spec.ts`
- Test descriptions: Use `describe` blocks for grouping
- Test cases: Use `it` or `test` with descriptive names

### Test Coverage Goals

**Domain Layer**:
- Domain Services: 80%+ coverage
- Value Objects: 90%+ coverage
- Entities: 80%+ coverage
- Domain Events: 70%+ coverage

**Application Layer**:
- Use Cases: 80%+ coverage
- Application Services: 70%+ coverage
- Mappers: 90%+ coverage
- DTOs: 60%+ coverage (validation logic)

**Infrastructure Layer**:
- Error Handling: 70%+ coverage
- Logging: 60%+ coverage
- Store Middleware: 80%+ coverage

**Presentation Layer**:
- Hooks: 80%+ coverage
- Components: 60%+ coverage (focus on logic, not rendering)

### Writing Good Tests

**Test Structure (AAA Pattern)**:
```typescript
it('should do something', () => {
  // Arrange: Set up test data
  const input = { /* ... */ };
  
  // Act: Execute the code being tested
  const result = functionUnderTest(input);
  
  // Assert: Verify the result
  expect(result).toBe(expected);
});
```

**Best Practices**:
1. **One Assertion Per Test**: Focus on one thing
2. **Descriptive Names**: Test names should describe what is being tested
3. **Test Edge Cases**: Test boundaries, null values, empty arrays
4. **Mock External Dependencies**: Use mocks for external services
5. **Keep Tests Fast**: Avoid slow operations in unit tests
6. **Clean Up**: Reset state between tests

### Mocking Strategies

**Mocking Domain Services**:
```typescript
import { vi } from 'vitest';

vi.mock('$lib/domain/services/GameEngineService', () => ({
  GameEngineService: {
    executeTurn: vi.fn(),
  },
}));
```

**Mocking Stores**:
```typescript
import { writable } from 'svelte/store';

const mockGame = writable(createTestGame());
vi.mock('$lib/stores/game', () => ({
  game: mockGame,
}));
```

### Continuous Integration

**CI Pipeline**:
1. **Lint**: Run ESLint
2. **Type Check**: Run TypeScript compiler
3. **Unit Tests**: Run unit tests
4. **Integration Tests**: Run integration tests
5. **E2E Tests**: Run E2E tests (on main branch)
6. **Coverage**: Generate coverage report

**Coverage Thresholds**:
- Overall: 75%+
- Domain Layer: 80%+
- Application Layer: 70%+
- Infrastructure Layer: 70%+
- Presentation Layer: 60%+

### Test Data Helpers

Create test data helpers for consistency:

```typescript
// tests/helpers/testData.ts
export function createTestBoat(overrides?: Partial<Boat>): Boat {
  return {
    x: 0,
    y: 0,
    tack: false,
    rotation: -45,
    color: 'red',
    name: 'Test Boat',
    ...overrides,
  };
}

export function createTestGame(overrides?: Partial<Game>): Game {
  return {
    width: 40,
    height: 30,
    turncount: 0,
    players: [],
    wind: [0],
    marks: [],
    ...overrides,
  };
}
```

## Future Considerations

- **Repository Implementations**: Currently using in-memory stores, could add persistence
- **Event Handlers**: Could add event handlers for analytics, logging, etc.
- **CQRS**: Could separate read/write models for better scalability
- **Microservices**: Could split into services if needed
- **GraphQL**: Could add GraphQL API layer

