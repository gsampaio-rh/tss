# ADR-004: Domain Events Pattern

**Status**: Accepted  
**Date**: 2024-12-26  
**Deciders**: Development Team

## Context

We need to decouple domain logic from side effects (logging, analytics, UI updates). Domain entities should not know about infrastructure concerns.

## Decision

We will use **Domain Events** to decouple domain logic from side effects:

1. Domain entities publish events when important things happen
2. Event handlers can react to events without coupling
3. Event bus manages event subscription and publishing
4. Events are immutable and contain domain data

## Rationale

### Benefits

1. **Loose Coupling**: Domain logic doesn't depend on side effects
2. **Extensibility**: Easy to add new event handlers
3. **Testability**: Can test domain logic without side effects
4. **Event Sourcing**: Can potentially implement event sourcing
5. **Audit Trail**: Events provide audit trail

### Trade-offs

- **Complexity**: Event infrastructure needed
- **Debugging**: More complex to debug event flows
- **Performance**: Event handling adds overhead

## Consequences

### Positive

- ✅ Domain logic is decoupled from side effects
- ✅ Easy to add new event handlers
- ✅ Better testability
- ✅ Event-driven architecture
- ✅ Potential for event sourcing

### Negative

- ⚠️ More complex event handling
- ⚠️ Event bus infrastructure needed
- ⚠️ Harder to debug event flows

## Implementation

### Domain Events

- `GameCreatedEvent`: Game was created
- `GameStartedEvent`: Race started
- `TurnExecutedEvent`: Turn was executed
- `TurnRevertedEvent`: Turn was reverted
- `GameResetEvent`: Game was reset
- `WindScenarioChangedEvent`: Wind scenario changed
- `PlayerAddedEvent`: Player was added
- `PlayerRemovedEvent`: Player was removed
- `BoatFinishedEvent`: Boat finished the race

### Event Bus

```typescript
class DomainEventBus {
  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => void): void;
  publish(event: DomainEvent): void;
  clear(): void;
}
```

### Usage

```typescript
// In domain entity
this.eventBus.publish(new GameCreatedEvent(this.id, windScenario));

// In infrastructure
eventBus.subscribe('GameCreated', (event) => {
  logger.info('Game created', { gameId: event.aggregateId });
});
```

## References

- [Domain Events Pattern](https://martinfowler.com/eaaDev/DomainEvent.html)
- [Event-Driven Architecture](https://www.oreilly.com/library/view/event-driven-architecture/9781492057878/)

