# ADR-002: Domain-Driven Design

**Status**: Accepted  
**Date**: 2024-12-26  
**Deciders**: Development Team

## Context

We need to model the sailing simulation domain accurately. The domain includes complex concepts like boats, wind, tactical decisions, and race mechanics that need proper representation.

## Decision

We will use **Domain-Driven Design (DDD)** principles to model the domain:

1. **Entities**: `GameEntity`, `BoatEntity`, `MarkEntity` - Objects with identity
2. **Value Objects**: `Position`, `Angle`, `WindDirection`, `Velocity` - Immutable concepts
3. **Domain Services**: Business logic that doesn't belong to a single entity
4. **Domain Events**: `GameCreatedEvent`, `TurnExecutedEvent`, etc. - Domain events
5. **Repository Interfaces**: Data access abstractions

## Rationale

### Benefits

1. **Rich Domain Model**: Encapsulates business logic in domain objects
2. **Ubiquitous Language**: Code uses domain terminology
3. **Encapsulation**: Business rules are encapsulated in entities
4. **Event-Driven**: Domain events enable loose coupling
5. **Testability**: Domain logic can be tested independently

### Trade-offs

- **Complexity**: More sophisticated domain model
- **Learning Curve**: Team needs DDD knowledge
- **Initial Overhead**: More structure initially

## Consequences

### Positive

- ✅ Business logic is encapsulated in domain objects
- ✅ Domain concepts are clearly represented
- ✅ Easy to understand domain model
- ✅ Event-driven architecture enables extensibility
- ✅ Better testability

### Negative

- ⚠️ More complex domain layer
- ⚠️ Requires domain expertise
- ⚠️ More abstraction

## Implementation

### Entities

- `GameEntity`: Represents a game with players, wind, and state
- `BoatEntity`: Represents a boat/player with position, tack, and state
- `MarkEntity`: Represents a mark/buoy on the course

### Value Objects

- `Position`: Immutable position (x, y)
- `Angle`: Immutable angle with normalization
- `WindDirection`: Wind direction value object
- `Velocity`: Velocity value object

### Domain Services

- `GameEngineService`: Core game loop
- `BoatMovementService`: Boat movement calculations
- `TacticalAnalysisService`: Tactical calculations (VMG, lift/header)
- `NavigationService`: Navigation calculations
- `WindCalculationService`: Wind transformations
- `DirtyAirService`: Dirty air calculations

### Domain Events

- `GameCreatedEvent`: Game was created
- `TurnExecutedEvent`: Turn was executed
- `WindScenarioChangedEvent`: Wind scenario changed
- And more...

## References

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Implementing Domain-Driven Design by Vaughn Vernon](https://vaughnvernon.com/implementing-domain-driven-design/)

