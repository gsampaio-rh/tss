# Tactical Sailing Simulator (TSS)

A tactical sailing race simulator built with SvelteKit and TypeScript, following Clean Architecture and Domain-Driven Design principles.

**Version 1.2.0** - AI players, performance optimizations, and comprehensive documentation.

## Quick Start

### For Players (End Users)

New to TSS? Check out the **[Quick Start Guide](./QUICKSTART.md)** to learn how to play your first race!

### For Developers

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

- 🎮 Full tactical sailing race simulation
- ⛵ Player management with customizable start positions
- 🤖 **AI players** with three difficulty levels (Easy, Medium, Hard)
- 🌬️ Wind scenario system (presets + custom scenarios)
- 📊 Visual game canvas with tactical grid and laylines
- 🎨 Modern UI with responsive layout
- 💾 Settings and game state persistence
- 🔧 TypeScript for type safety
- 🏗️ Clean Architecture with DDD principles

## Architecture

The project follows **Clean Architecture** with four distinct layers:

- **Domain Layer**: Core business logic (entities, value objects, domain services)
- **Application Layer**: Use cases and orchestration (services, DTOs, mappers)
- **Infrastructure Layer**: Technical implementations (logging, error handling, stores)
- **Presentation Layer**: UI components and user interaction (Svelte components, hooks)

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture documentation.

## Project Structure

```
src/lib/
├── domain/          # Domain Layer (business logic)
│   ├── entities/    # Domain entities (GameEntity, BoatEntity)
│   ├── value-objects/ # Value objects (Position, Angle, WindDirection)
│   ├── services/    # Domain services (GameEngine, BoatMovement, TacticalAnalysis)
│   ├── events/      # Domain events (GameCreatedEvent, TurnExecutedEvent)
│   └── repositories/ # Repository interfaces
├── application/     # Application Layer (use cases, services)
│   ├── use-cases/   # Use cases (CreateGame, ExecuteTurn, AddPlayer)
│   ├── services/    # Application services (GameService, PlayerService, AIPlayerService)
│   ├── dto/         # Data Transfer Objects
│   └── mappers/     # Entity-DTO mappers
├── presentation/    # Presentation Layer (UI)
│   ├── components/  # Svelte components (layout, shared, game)
│   └── hooks/       # Reusable hooks (useGame, useBoat, useWind)
└── infrastructure/  # Infrastructure Layer
    ├── logging/     # Logging service
    ├── errors/     # Error handling (Sentry integration)
    └── stores/      # Store utilities (middleware, composition)
```

## Documentation

### Architecture & Design

- [Architecture Overview](./docs/ARCHITECTURE.md) - Complete architecture documentation
- [Architecture Decision Records](./docs/ADRs/) - ADRs for key architectural decisions
- [Project Structure](./docs/PROJECT_STRUCTURE.md) - Detailed project structure

### For Players

- [Quick Start Guide](./QUICKSTART.md) - Get started playing your first race
- [Race Insights Guide](./docs/RACE_INSIGHTS.md) - Understand all tactical metrics and indicators

### Development

- [Development Guide](./docs/DEVELOPMENT.md) - Developer guide and workflow
- [Contributing Guidelines](./docs/CONTRIBUTING.md) - How to contribute

### Game Mechanics

- [Wind Mechanics Spec](../docs/WIND_MECHANICS_SPEC.md) - Complete wind mechanics specification
- [Wind Dynamics](../docs/WIND_DYNAMICS.md) - Wind mechanics explanation

### Other

- [Release Notes](./docs/RELEASE_NOTES.md) - Version history and release notes

## Key Technologies

- **SvelteKit**: Web framework
- **TypeScript**: Type safety
- **Clean Architecture**: Layered architecture
- **Domain-Driven Design**: Rich domain model
- **Sentry**: Error tracking (optional)

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guide.

### Quick Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run check    # Type check
npm run format   # Format code
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Version

**1.2.0** - AI players, performance optimizations, and comprehensive documentation.

---

Built with [SvelteKit](https://kit.svelte.dev/) and [TypeScript](https://www.typescriptlang.org/)
