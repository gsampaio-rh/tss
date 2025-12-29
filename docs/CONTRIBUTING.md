# Contributing to Tactical Sailing Simulator

Thank you for your interest in contributing to TSS! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/tss.git
   cd tss/tss-sveltekit
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/ai-player-support`
- `fix/wind-calculation-bug`
- `refactor/domain-services`
- `docs/api-documentation`

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add AI player support
fix: correct wind pattern calculation
docs: update architecture documentation
refactor: extract boat movement logic
test: add unit tests for GameService
chore: update dependencies
```

### Pull Request Process

1. **Create a branch** from `main` or `refactoring`
2. **Make your changes** following the coding standards
3. **Test your changes** thoroughly
4. **Run linting and type checking**:
   ```bash
   npm run lint
   npm run check
   ```
5. **Commit your changes** with descriptive messages
6. **Push to your fork** and create a Pull Request
7. **Wait for review** and address feedback

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types for public APIs
- Use explicit return types for public functions
- Avoid `any` type - use `unknown` if needed

### Code Style

- Follow ESLint rules (configured in `eslint.config.js`)
- Use Prettier for formatting (configured in `.prettierrc`)
- Maximum line length: 100 characters
- Use meaningful variable and function names

### Architecture

Follow Clean Architecture principles:

- **Domain Layer**: Pure business logic, no dependencies
- **Application Layer**: Orchestrates domain, uses DTOs
- **Infrastructure Layer**: Implements domain interfaces
- **Presentation Layer**: UI components and hooks

### File Organization

- One class/interface per file
- Group related files in directories
- Use `index.ts` files for exports
- Keep files focused and small (< 300 lines)

### Documentation

- Add JSDoc comments to all public APIs
- Document complex logic with inline comments
- Update README for user-facing changes
- Create ADRs for architectural decisions

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

### Writing Tests

- Write tests for all domain services
- Test edge cases and error conditions
- Aim for 80%+ code coverage
- Use descriptive test names

### Test Structure

```typescript
describe('GameService', () => {
  describe('createGame', () => {
    it('should create a game with specified players', () => {
      // Test implementation
    });

    it('should throw error for invalid player count', () => {
      // Test implementation
    });
  });
});
```

## Project Structure

```
src/lib/
├── domain/          # Domain Layer (business logic)
├── application/     # Application Layer (use cases, services)
├── infrastructure/  # Infrastructure Layer (logging, errors, stores)
└── presentation/    # Presentation Layer (components, hooks)
```

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture documentation.

## Areas for Contribution

### High Priority

- **Testing**: Add unit tests, integration tests, E2E tests
- **Documentation**: Improve API documentation, add examples
- **Performance**: Optimize rendering, reduce memory usage
- **Accessibility**: Improve keyboard navigation, screen reader support

### Feature Ideas

- **AI Improvements**: Better AI decision-making, difficulty tuning
- **Multiplayer**: Online multiplayer support
- **Replay System**: Save and replay games
- **Analytics**: Game statistics and analysis
- **Mobile Support**: Better mobile UI/UX

### Bug Fixes

- Check [Issues](https://github.com/your-repo/tss/issues) for known bugs
- Report bugs with steps to reproduce
- Include browser/OS information

## Questions?

- Check [DEVELOPMENT.md](./DEVELOPMENT.md) for development guide
- Check [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for architecture details
- Open an issue for questions or discussions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

