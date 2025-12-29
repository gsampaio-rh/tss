# ADR-003: Use Cases Pattern

**Status**: Accepted  
**Date**: 2024-12-26  
**Deciders**: Development Team

## Context

We need to encapsulate application-specific business rules. Application logic should be clearly separated from domain logic and orchestrate domain services.

## Decision

We will use the **Use Cases Pattern** to encapsulate application-specific business rules:

1. Each use case represents a single application operation
2. Use cases orchestrate domain services
3. Use cases use DTOs for input/output
4. Use cases are independent and testable

## Rationale

### Benefits

1. **Clear Application Boundaries**: Each use case represents one operation
2. **Testability**: Use cases can be tested independently
3. **Reusability**: Use cases can be reused across different interfaces
4. **Single Responsibility**: Each use case has one responsibility
5. **Documentation**: Use cases serve as documentation

### Trade-offs

- **More Files**: One file per use case
- **Abstraction**: Additional layer of abstraction
- **Initial Overhead**: More structure initially

## Consequences

### Positive

- ✅ Clear application operations
- ✅ Easy to test application logic
- ✅ Reusable across different interfaces
- ✅ Better code organization
- ✅ Self-documenting code

### Negative

- ⚠️ More files to maintain
- ⚠️ Additional abstraction layer
- ⚠️ Requires discipline

## Implementation

### Use Cases

- `CreateGameUseCase`: Create a new game
- `ExecuteTurnUseCase`: Execute a game turn
- `AddPlayerUseCase`: Add a player to the game
- `RemovePlayerUseCase`: Remove a player
- `StartRaceUseCase`: Start the race
- `BackTurnUseCase`: Undo last turn
- `ResetGameUseCase`: Reset game to start
- `UpdatePlayerStartPositionUseCase`: Update player start position

### Structure

```typescript
interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse> | TResponse;
}

class CreateGameUseCase implements IUseCase<CreateGameRequest, CreateGameResponse> {
  execute(request: CreateGameRequest): CreateGameResponse {
    // Orchestrate domain services
  }
}
```

## References

- [Clean Architecture Use Cases](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Use Case Driven Development](https://www.agilemodeling.com/artifacts/useCaseDiagram.htm)

