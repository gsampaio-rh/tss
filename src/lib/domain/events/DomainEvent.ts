/**
 * Domain Event Base Class
 * Represents events that occur in the domain
 */

export interface DomainEvent {
	readonly eventId: string;
	readonly occurredOn: Date;
	readonly eventType: string;
	readonly aggregateId: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
	readonly eventId: string;
	readonly occurredOn: Date;
	readonly eventType: string;
	readonly aggregateId: string;

	constructor(aggregateId: string, eventType: string) {
		this.eventId = this.generateEventId();
		this.occurredOn = new Date();
		this.eventType = eventType;
		this.aggregateId = aggregateId;
	}

	private generateEventId(): string {
		return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}

/**
 * Domain Event Handler
 */
export type DomainEventHandler<T extends DomainEvent> = (event: T) => void | Promise<void>;

/**
 * Domain Event Bus
 * Handles publishing and subscribing to domain events
 */
export class DomainEventBus {
	private handlers: Map<string, DomainEventHandler<DomainEvent>[]> = new Map();

	/**
	 * Subscribe to a specific event type
	 */
	subscribe<T extends DomainEvent>(
		eventType: string,
		handler: DomainEventHandler<T>
	): () => void {
		if (!this.handlers.has(eventType)) {
			this.handlers.set(eventType, []);
		}

		const handlers = this.handlers.get(eventType)!;
		handlers.push(handler as DomainEventHandler<DomainEvent>);

		// Return unsubscribe function
		return () => {
			const index = handlers.indexOf(handler as DomainEventHandler<DomainEvent>);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		};
	}

	/**
	 * Publish a domain event
	 */
	async publish(event: DomainEvent): Promise<void> {
		const handlers = this.handlers.get(event.eventType) || [];
		
		// Execute all handlers
		await Promise.all(
			handlers.map(handler => {
				try {
					return handler(event);
				} catch (error) {
					console.error(`Error handling domain event ${event.eventType}:`, error);
					return Promise.resolve();
				}
			})
		);
	}

	/**
	 * Clear all handlers (useful for testing)
	 */
	clear(): void {
		this.handlers.clear();
	}
}

// Singleton instance
export const domainEventBus = new DomainEventBus();


