# Project Structure

## Overview

TSS follows Clean Architecture principles with clear separation of concerns across four layers: Domain, Application, Infrastructure, and Presentation.

## Directory Structure

```
tss/
├── src/
│   ├── lib/
│   │   ├── domain/              # Domain Layer (Core Business Logic)
│   │   │   ├── entities/       # Domain entities (GameEntity, BoatEntity, MarkEntity)
│   │   │   ├── value-objects/   # Value objects (Position, Angle, WindDirection, Velocity)
│   │   │   ├── services/        # Domain services (GameEngine, BoatMovement, TacticalAnalysis)
│   │   │   ├── events/          # Domain events (GameCreatedEvent, TurnExecutedEvent)
│   │   │   └── repositories/    # Repository interfaces
│   │   │
│   │   ├── application/        # Application Layer (Use Cases & Orchestration)
│   │   │   ├── use-cases/       # Use cases (CreateGame, ExecuteTurn, AddPlayer)
│   │   │   ├── services/        # Application services (GameService, PlayerService, AIPlayerService)
│   │   │   ├── dto/             # Data Transfer Objects
│   │   │   └── mappers/         # Entity-DTO mappers
│   │   │
│   │   ├── presentation/        # Presentation Layer (UI)
│   │   │   ├── components/      # Svelte components (layout, shared, game)
│   │   │   └── hooks/            # Reusable hooks (useGame, useBoat, useWind)
│   │   │
│   │   ├── infrastructure/      # Infrastructure Layer (Technical Concerns)
│   │   │   ├── logging/         # Logging service
│   │   │   ├── errors/          # Error handling (Sentry integration)
│   │   │   ├── rendering/       # Canvas rendering utilities
│   │   │   └── stores/          # Store utilities (middleware, composition)
│   │   │
│   │   ├── components/          # Legacy components (being migrated to presentation/)
│   │   ├── stores/              # Legacy stores (being migrated)
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Utility functions
│   │
│   └── routes/                  # SvelteKit routes
│
├── static/                      # Static assets
│   ├── img/                     # Images (icons, screenshots)
│   ├── manifest.json            # PWA manifest
│   └── robots.txt               # SEO robots file
│
├── docs/                        # Documentation
│   ├── ADRs/                    # Architecture Decision Records
│   ├── ARCHITECTURE.md          # Architecture overview
│   ├── CONTRIBUTING.md          # Contributing guidelines
│   ├── DEVELOPMENT.md           # Development guide
│   ├── PROJECT_STRUCTURE.md     # This file
│   ├── RACE_INSIGHTS.md         # Player guide for tactical metrics
│   └── RELEASE_NOTES.md         # Version history
│
├── BACKLOG.md                   # Product backlog
├── QUICKSTART.md                # Quick start guide for players
├── README.md                     # Main project README
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── svelte.config.js             # SvelteKit configuration
└── vite.config.ts               # Vite configuration
```

## Layer Responsibilities

### Domain Layer (`src/lib/domain/`)
**Purpose**: Core business logic, independent of frameworks and infrastructure.

- **Entities**: Core business objects (GameEntity, BoatEntity, MarkEntity)
- **Value Objects**: Immutable domain concepts (Position, Angle, WindDirection)
- **Services**: Domain-specific business logic (GameEngineService, TacticalAnalysisService)
- **Events**: Domain events for event-driven architecture
- **Repositories**: Interfaces for data access (not implementations)

### Application Layer (`src/lib/application/`)
**Purpose**: Orchestrates domain logic to fulfill use cases.

- **Use Cases**: Application-specific business rules (CreateGameUseCase, ExecuteTurnUseCase)
- **Services**: Application services that coordinate domain services
- **DTOs**: Data Transfer Objects for API boundaries
- **Mappers**: Convert between domain entities and DTOs

### Infrastructure Layer (`src/lib/infrastructure/`)
**Purpose**: Technical implementations and external concerns.

- **Logging**: Centralized logging service
- **Errors**: Error handling and tracking (Sentry integration)
- **Rendering**: Canvas rendering utilities
- **Stores**: Svelte store utilities (middleware, composition)

### Presentation Layer (`src/lib/presentation/`)
**Purpose**: UI components and user interaction.

- **Components**: Svelte components organized by concern (layout, shared, game)
- **Hooks**: Reusable Svelte hooks for common patterns

## Migration Status

The codebase is currently in a migration state:

- ✅ **Domain Layer**: Fully migrated to Clean Architecture
- ✅ **Application Layer**: Fully migrated with use cases and services
- ✅ **Infrastructure Layer**: Core infrastructure in place
- ✅ **Presentation Layer**: New components following Clean Architecture
- 🔄 **Legacy Components**: `src/lib/components/` and `src/lib/stores/` are being gradually migrated to presentation layer

## File Naming Conventions

- **Components**: PascalCase (e.g., `PlayerTacticalCard.svelte`)
- **Services**: PascalCase with "Service" suffix (e.g., `GameService.ts`)
- **Use Cases**: PascalCase with "UseCase" suffix (e.g., `CreateGameUseCase.ts`)
- **Stores**: camelCase (e.g., `game.ts`)
- **Types**: camelCase (e.g., `boat.ts`)
- **Utils**: camelCase (e.g., `chartUtils.ts`)

## Key Files

- `src/routes/+page.svelte` - Main application entry point
- `src/lib/domain/entities/Game.ts` - Core game entity
- `src/lib/application/services/GameService.ts` - Game orchestration
- `src/lib/presentation/components/layout/AppLayout.svelte` - Main layout component

## Documentation

For more details, see:
- [Architecture Overview](./ARCHITECTURE.md) - Complete architecture documentation
- [Architecture Decision Records](./ADRs/) - ADRs for key decisions
- [Development Guide](./DEVELOPMENT.md) - Developer workflow
