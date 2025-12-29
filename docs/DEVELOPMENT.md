# Development Guide

This guide provides detailed information for developers working on the Tactical Sailing Simulator.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)

## Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: Latest version

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/tss.git
cd tss

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run check        # Type check with svelte-check

# Testing (when implemented)
npm test             # Run tests
npm test:watch       # Run tests in watch mode
npm test:coverage    # Run tests with coverage
```

## Project Structure

```
tss-sveltekit/
├── src/
│   ├── lib/
│   │   ├── domain/          # Domain Layer
│   │   │   ├── entities/    # Domain entities
│   │   │   ├── value-objects/ # Value objects
│   │   │   ├── services/    # Domain services
│   │   │   ├── events/      # Domain events
│   │   │   └── repositories/ # Repository interfaces
│   │   ├── application/     # Application Layer
│   │   │   ├── use-cases/   # Use cases
│   │   │   ├── services/    # Application services
│   │   │   ├── dto/         # Data Transfer Objects
│   │   │   └── mappers/     # Entity-DTO mappers
│   │   ├── presentation/     # Presentation Layer
│   │   │   ├── components/  # Svelte components
│   │   │   └── hooks/       # Reusable hooks
│   │   ├── infrastructure/  # Infrastructure Layer
│   │   │   ├── logging/     # Logging service
│   │   │   ├── errors/      # Error handling
│   │   │   └── stores/      # Store utilities
│   │   ├── stores/          # Svelte stores
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── routes/              # SvelteKit routes
├── docs/                     # Documentation
│   ├── ADRs/                # Architecture Decision Records
│   └── *.md                 # Other documentation
└── static/                  # Static assets
```

## Architecture

The project follows **Clean Architecture** with four layers:

### Layer Dependencies

```
Presentation → Application → Domain ← Infrastructure
```

- **Domain**: No dependencies (pure business logic)
- **Application**: Depends only on Domain
- **Infrastructure**: Implements Domain interfaces
- **Presentation**: Depends on Application and Infrastructure

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture documentation.

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow coding standards
- Write tests for new features
- Update documentation

### 3. Test Your Changes

```bash
# Type check
npm run check

# Lint
npm run lint

# Format
npm run format

# Run tests (when implemented)
npm test
```

### 4. Commit Changes

Use conventional commits:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: fix bug"
git commit -m "docs: update documentation"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Standards

### TypeScript

- **Strict Mode**: Always enabled
- **Types**: Prefer explicit types for public APIs
- **Interfaces**: Use interfaces for public APIs
- **Any**: Avoid `any`, use `unknown` if needed

### Naming Conventions

- **Files**: `PascalCase.ts` for classes, `camelCase.ts` for utilities
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `IPascalCase` or `PascalCase`

### Code Organization

- One class/interface per file
- Group related exports in `index.ts`
- Keep files focused (< 300 lines)
- Use meaningful names

### Comments

- Add JSDoc to all public APIs
- Document complex logic
- Explain "why", not "what"

Example:

```typescript
/**
 * Calculate VMG (Velocity Made Good) toward a target
 * @param boatPosition - Current boat position
 * @param targetPosition - Target position (e.g., mark)
 * @param boatSpeed - Boat speed (typically 1.0)
 * @param heading - Current boat heading
 * @returns VMG value (positive = toward target, negative = away)
 */
static calculateVMG(
  boatPosition: Position,
  targetPosition: Position,
  boatSpeed: number,
  heading: Angle
): number {
  // Implementation
}
```

## Testing

For detailed testing strategy, see [Testing Strategy](./docs/ARCHITECTURE.md#testing-strategy) in the Architecture documentation.

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { GameService } from '$lib/application/services/GameService';

describe('GameService', () => {
  describe('createGame', () => {
    it('should create a game with specified players', () => {
      const game = GameService.createGame(2, windScenario);
      expect(game.players.length).toBe(2);
    });
  });
});
```

### Test Coverage Goals

- Domain services: 80%+ coverage
- Application services: 70%+ coverage
- Value objects: 90%+ coverage
- Entities: 80%+ coverage

## Debugging

### Browser DevTools

- Use Chrome/Edge DevTools for debugging
- Check Console for errors and logs
- Use Performance tab for performance issues
- Use Memory tab for memory leaks

### Logging

The project uses a centralized logging service:

```typescript
import { logger } from '$lib/infrastructure/logging/logger';

logger.debug('Debug message', 'ComponentName', { context });
logger.info('Info message', 'ComponentName', { context });
logger.warn('Warning message', 'ComponentName', { context });
logger.error('Error message', error, 'ComponentName', { context });
```

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('debug', 'true');
```

## Common Tasks

### Adding a New Domain Service

1. Create file in `src/lib/domain/services/`
2. Implement service with static methods
3. Export from `src/lib/domain/services/index.ts`
4. Add JSDoc comments
5. Write tests

### Adding a New Use Case

1. Create file in `src/lib/application/use-cases/`
2. Implement `IUseCase` interface
3. Export from `src/lib/application/use-cases/index.ts`
4. Add JSDoc comments
5. Write tests

### Adding a New Component

1. Create component in appropriate directory
2. Use shared components when possible
3. Follow component naming conventions
4. Add TypeScript types
5. Test component

### Adding a New Store

1. Create store in `src/lib/stores/`
2. Use middleware if needed (logging, persistence)
3. Export from appropriate index file
4. Add TypeScript types
5. Document store purpose

## Performance Considerations

### Rendering Optimization

- Use Svelte reactivity efficiently
- Avoid unnecessary re-renders
- Use `$:` reactive statements carefully
- Memoize expensive calculations

### Memory Management

- Clean up event listeners in `onDestroy`
- Remove store subscriptions
- Avoid memory leaks in animations
- Use object pooling for particles

### Bundle Size

- Use dynamic imports for large components
- Tree-shake unused code
- Optimize images and assets
- Monitor bundle size

## Troubleshooting

### Common Issues

**TypeScript Errors**
- Run `npm run check` to see all errors
- Check type imports vs value imports
- Ensure all types are properly exported

**Linting Errors**
- Run `npm run lint` to see all errors
- Run `npm run format` to auto-fix formatting
- Check ESLint configuration

**Build Errors**
- Clear `node_modules` and reinstall
- Check Node.js version (18+)
- Check for circular dependencies

**Runtime Errors**
- Check browser console
- Enable debug logging
- Check store subscriptions
- Verify event handlers are cleaned up

## Error Tracking (Sentry)

Sentry is integrated for error tracking. To set it up:

### Installation

1. Install the Sentry SvelteKit SDK:
```bash
npm install @sentry/sveltekit
```

2. Run the Sentry wizard:
```bash
npx @sentry/wizard@latest -i sveltekit
```

### Configuration

Add to your `.env` file:
```env
VITE_SENTRY_DSN=your-sentry-dsn-here
VITE_SENTRY_ENABLED=true
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

Uncomment Sentry initialization in:
- `src/hooks.client.ts` - Client-side initialization
- `src/hooks.server.ts` - Server-side initialization

Sentry is automatically integrated with the error handler. All errors caught by `handleError()` will be sent to Sentry if enabled.

### Manual Error Reporting

```typescript
import { captureException, captureMessage } from '$lib/infrastructure/errors/sentry';

// Capture an exception
try {
  // some code
} catch (error) {
  captureException(error, { context: 'additional data' });
}

// Capture a message
captureMessage('Something important happened', 'info', { userId: '123' });
```

## Resources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)

## Getting Help

- Check [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for architecture details
- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
- Open an issue for questions or bugs
- Review existing code for examples

