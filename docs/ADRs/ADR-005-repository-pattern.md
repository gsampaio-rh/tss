# ADR-005: Repository Pattern

**Status**: Accepted  
**Date**: 2024-12-26  
**Deciders**: Development Team

## Context

We need to abstract data access so that domain logic doesn't depend on specific data storage implementations. This allows us to swap implementations and test domain logic independently.

## Decision

We will use the **Repository Pattern** to abstract data access:

1. Repository interfaces are defined in the Domain layer
2. Repository implementations are in the Infrastructure layer
3. Domain entities use repositories through interfaces
4. Currently using in-memory stores, can be swapped for persistence

## Rationale

### Benefits

1. **Domain Independence**: Domain doesn't depend on data storage
2. **Testability**: Can use mock repositories in tests
3. **Flexibility**: Easy to swap implementations
4. **Clear Boundaries**: Clear data access boundaries
5. **Future-Proof**: Can add persistence later

### Trade-offs

- **Abstraction**: Additional abstraction layer
- **More Interfaces**: More interfaces to maintain
- **Initial Overhead**: More structure initially

## Consequences

### Positive

- ✅ Domain layer is independent of data storage
- ✅ Easy to test with mock repositories
- ✅ Can swap implementations easily
- ✅ Clear data access boundaries
- ✅ Future-proof for persistence

### Negative

- ⚠️ Additional abstraction layer
- ⚠️ More interfaces to maintain
- ⚠️ Requires discipline

## Implementation

### Repository Interfaces

- `IRepository<T, TId>`: Base repository interface
- `IReadOnlyRepository<T, TId>`: Read-only repository
- `IGameRepository`: Game entity repository
- `IBoatRepository`: Boat entity repository
- `IWindScenarioRepository`: Wind scenario repository

### Current Implementation

Currently using in-memory stores (Svelte stores). Can be swapped for:
- LocalStorage persistence
- IndexedDB persistence
- Backend API calls
- GraphQL queries

### Example

```typescript
// Domain layer (interface)
interface IGameRepository extends IRepository<GameEntity, string> {
  findByWindScenario(scenarioName: string): Promise<GameEntity[]>;
}

// Infrastructure layer (implementation)
class InMemoryGameRepository implements IGameRepository {
  // Implementation using Svelte stores
}
```

## References

- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Domain-Driven Design Repositories](https://www.domainlanguage.com/ddd/reference/)

