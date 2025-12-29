/**
 * Game Domain Events
 * Events that occur in the game domain
 */

import { BaseDomainEvent } from './DomainEvent';
import type { WindScenario } from '../../types/wind';

/**
 * Game Created Event
 */
export class GameCreatedEvent extends BaseDomainEvent {
	constructor(
		aggregateId: string,
		public readonly gameName: string,
		public readonly playerCount: number,
		public readonly windScenario: WindScenario
	) {
		super(aggregateId, 'GameCreated');
	}
}

/**
 * Game Started Event
 */
export class GameStartedEvent extends BaseDomainEvent {
	constructor(aggregateId: string, public readonly turnCount: number) {
		super(aggregateId, 'GameStarted');
	}
}

/**
 * Turn Executed Event
 */
export class TurnExecutedEvent extends BaseDomainEvent {
	constructor(
		aggregateId: string,
		public readonly turnNumber: number,
		public readonly windDirection: number
	) {
		super(aggregateId, 'TurnExecuted');
	}
}

/**
 * Turn Reverted Event
 */
export class TurnRevertedEvent extends BaseDomainEvent {
	constructor(aggregateId: string, public readonly turnNumber: number) {
		super(aggregateId, 'TurnReverted');
	}
}

/**
 * Game Reset Event
 */
export class GameResetEvent extends BaseDomainEvent {
	constructor(aggregateId: string) {
		super(aggregateId, 'GameReset');
	}
}

/**
 * Player Added Event
 */
export class PlayerAddedEvent extends BaseDomainEvent {
	constructor(
		aggregateId: string,
		public readonly playerId: string,
		public readonly playerName: string
	) {
		super(aggregateId, 'PlayerAdded');
	}
}

/**
 * Player Removed Event
 */
export class PlayerRemovedEvent extends BaseDomainEvent {
	constructor(aggregateId: string, public readonly playerId: string) {
		super(aggregateId, 'PlayerRemoved');
	}
}

/**
 * Wind Scenario Changed Event
 */
export class WindScenarioChangedEvent extends BaseDomainEvent {
	constructor(
		aggregateId: string,
		public readonly windScenario: WindScenario
	) {
		super(aggregateId, 'WindScenarioChanged');
	}
}

/**
 * Boat Finished Event
 */
export class BoatFinishedEvent extends BaseDomainEvent {
	constructor(
		aggregateId: string,
		public readonly boatId: string,
		public readonly finishTime: number,
		public readonly position: number
	) {
		super(aggregateId, 'BoatFinished');
	}
}


