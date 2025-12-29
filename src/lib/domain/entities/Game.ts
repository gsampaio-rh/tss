/**
 * Game Domain Entity
 * Represents a game instance with proper encapsulation
 */

import { MarkEntity } from './Mark';
import { Position } from '../value-objects/Position';
import { Angle } from '../value-objects/Angle';
import { GameSetupService } from '../services/GameSetupService';
import type { Boat } from '../../types/boat';
import type { WindScenario } from '../../types/wind';
import { MarkType } from '../../types/game';
import { domainEventBus } from '../events/DomainEvent';
import {
	GameCreatedEvent,
	GameStartedEvent,
	TurnExecutedEvent,
	TurnRevertedEvent,
	GameResetEvent,
	WindScenarioChangedEvent
} from '../events/GameEvents';

export class GameEntity {
	private _id: string;
	private _name: string = '';
	private _width: number = 0;
	private _height: number = 0;
	private _marks: MarkEntity[] = [];
	private _wind: number[] = [];
	private _turnCount: number = 0;
	private _isStart: boolean = true;
	private _currentStartPriority: number = 0;
	private _players: Boat[] = [];

	constructor(id?: string) {
		this._id = id || this.generateId();
	}

	// Getters
	get id(): string {
		return this._id;
	}

	get name(): string {
		return this._name;
	}

	get width(): number {
		return this._width;
	}

	get height(): number {
		return this._height;
	}

	get marks(): MarkEntity[] {
		return [...this._marks]; // Return copy
	}

	get wind(): number[] {
		return [...this._wind]; // Return copy
	}

	get turnCount(): number {
		return this._turnCount;
	}

	get turncount(): number {
		return this._turnCount; // Alias for compatibility with Game data type
	}

	get isStart(): boolean {
		return this._isStart;
	}

	get currentStartPriority(): number {
		return this._currentStartPriority;
	}

	get players(): Boat[] {
		return [...this._players]; // Return copy to prevent external mutation
	}

	// Setters with validation
	setName(name: string): void {
		if (!name || name.trim().length === 0) {
			throw new Error('Game name cannot be empty');
		}
		this._name = name;
	}

	setDimensions(width: number, height: number): void {
		if (width <= 0 || height <= 0) {
			throw new Error('Game dimensions must be positive');
		}
		this._width = width;
		this._height = height;
	}

	setMarks(marks: MarkEntity[]): void {
		this._marks = [...marks]; // Copy array
	}

	setWind(wind: number[]): void {
		this._wind = [...wind]; // Copy array
	}

	setTurnCount(turnCount: number): void {
		if (turnCount < 0) {
			throw new Error('Turn count cannot be negative');
		}
		this._turnCount = turnCount;
	}

	setIsStart(isStart: boolean): void {
		this._isStart = isStart;
	}

	setCurrentStartPriority(priority: number): void {
		if (priority < 0) {
			throw new Error('Start priority cannot be negative');
		}
		this._currentStartPriority = priority;
	}

	setPlayers(players: Boat[]): void {
		this._players = [...players]; // Copy array
	}

	// Domain methods
	getWind(index: number): number {
		if (this._wind.length === 0) {
			return 0;
		}
		return this._wind[index % this._wind.length];
	}

	/**
	 * Check if a position is outside the layline
	 */
	isOutLaneline(x: number, y: number): boolean {
		if (this._marks.length < 3) {
			return false;
		}
		const markPosition = this._marks[2];
		const angle = Angle.fromRadians(
			Math.atan2(markPosition.x - x, -(markPosition.y - y))
		);
		const currentWind = this.getWind(this._turnCount);
		const windAngle = Angle.fromDegrees(currentWind);
		const angleDiff = Math.abs(angle.degrees - windAngle.degrees);
		return angleDiff >= 44.99 || angleDiff <= -44.99;
	}

	/**
	 * Increment turn count and publish event
	 */
	incrementTurn(): void {
		this._turnCount++;
		const currentWind = this.getWind(this._turnCount);
		domainEventBus.publish(
			new TurnExecutedEvent(this._id, this._turnCount, currentWind)
		);
	}

	/**
	 * Start the game and publish event
	 */
	start(): void {
		if (!this._isStart) {
			throw new Error('Game is already started');
		}
		this._isStart = false;
		domainEventBus.publish(new GameStartedEvent(this._id, this._turnCount));
	}

	/**
	 * Reset game to start and publish event
	 */
	reset(): void {
		this._turnCount = 0;
		this._isStart = true;
		this._currentStartPriority = 0;
		domainEventBus.publish(new GameResetEvent(this._id));
	}

	/**
	 * Revert to previous turn and publish event
	 */
	revertTurn(): void {
		if (this._turnCount > 0) {
			this._turnCount--;
			domainEventBus.publish(new TurnRevertedEvent(this._id, this._turnCount));
		} else {
			this._isStart = true;
			domainEventBus.publish(new GameResetEvent(this._id));
		}
	}

	/**
	 * Find a free color from available colors
	 */
	findFreeColor(colors: string[]): string | null {
		for (const color of colors) {
			if (!this._players.find(p => p.color === color)) {
				return color;
			}
		}
		return null;
	}

	/**
	 * Get player name (with fallback)
	 */
	getPlayerName(index: number): string {
		if (index < 0 || index >= this._players.length) {
			throw new Error(`Invalid player index: ${index}`);
		}
		const player = this._players[index];
		return player.name || `Player ${index + 1}`;
	}

	/**
	 * Place boats on start line and update start marks to accommodate all boats
	 */
	placeBoatsOnStart(): void {
		// Get base start size from wind scenario (if available) or use default
		// We'll use a default of 15, but the method will calculate based on boat count
		const baseStartSize = 15; // Default, could be extracted from scenario if needed
		
		// Place boats and update marks dynamically
		const updatedMarks = GameSetupService.placeBoatsOnStart(
			this._players,
			this._marks,
			this._height,
			this._width,
			baseStartSize
		);
		
		// Update marks if they were changed
		if (updatedMarks !== this._marks) {
			this.setMarks(updatedMarks);
		}
	}

	/**
	 * Initialize game from wind scenario and publish event
	 */
	initializeFromScenario(windScenario: WindScenario, windArray: number[]): void {
		this._name = windScenario.name;
		this.setDimensions(windScenario.width, windScenario.height);
		this.setWind(windArray);
		this.setupMarks(windScenario);
		this._turnCount = 0;
		this._isStart = true;
		this._currentStartPriority = 0;

		domainEventBus.publish(
			new GameCreatedEvent(
				this._id,
				this._name,
				this._players.length,
				windScenario
			)
		);
	}

	/**
	 * Change wind scenario and publish event
	 */
	changeWindScenario(windScenario: WindScenario, windArray: number[]): void {
		this.setDimensions(windScenario.width, windScenario.height);
		this.setWind(windArray);
		this.setupMarks(windScenario);
		domainEventBus.publish(
			new WindScenarioChangedEvent(this._id, windScenario)
		);
	}

	/**
	 * Setup marks based on wind scenario
	 */
	private setupMarks(windScenario: WindScenario): void {
		const startSize = windScenario.startsize || 15;
		this._marks = [
			new MarkEntity(
				new Position((this._width - startSize) / 2, this._height - 2),
				MarkType.StartLeft
			),
			new MarkEntity(
				new Position(
					this._width - (this._width - startSize) / 2,
					this._height - 2
				),
				MarkType.StartRight
			),
			new MarkEntity(new Position(this._width / 2, 2), MarkType.Mark1)
		];
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Convert to Game data format
	 * Converts domain entity to application data type
	 */
	toGameData(): {
		players: Boat[];
		width: number;
		height: number;
		marks: Array<{ x: number; y: number; type: MarkType }>;
		wind: number[];
		currentStartPriority: number;
		turncount: number;
		isStart: boolean;
		name: string;
	} {
		return {
			players: this._players,
			width: this._width,
			height: this._height,
			marks: this._marks.map(m => m.toMarkData()),
			wind: [...this._wind],
			currentStartPriority: this._currentStartPriority,
			turncount: this._turnCount,
			isStart: this._isStart,
			name: this._name
		};
	}
}

