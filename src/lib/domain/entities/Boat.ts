/**
 * Boat Domain Entity
 * Represents a boat in the game with proper encapsulation
 */

import { Position } from '../value-objects/Position';
import { Angle } from '../value-objects/Angle';
import type { TurnType } from '../../types/game';

export interface BoatTurn {
	turnType: TurnType;
	points: Position[];
	rotation: Angle;
	tack: boolean;
	finished: number | false;
}

export class BoatEntity {
	private _position: Position;
	private _rotation: Angle;
	private _tack: boolean;
	private _finished: number | false = false;
	private _isStart: boolean = true;
	private _startPos: number = 1;
	private _startPriority: number = 0;
	private _customStartX: number | null = null;
	private _turns: BoatTurn[] = [];
	private _turnType: TurnType;
	private _name: string = '';
	private _color: string;
	private _id: string;

	constructor(
		position: Position,
		tack: boolean,
		color: string,
		id?: string
	) {
		this._position = position;
		this._rotation = Angle.fromDegrees(-45);
		this._tack = tack;
		this._color = color;
		this._turnType = 0; // TurnType.Forward
		this._id = id || this.generateId();
	}

	// Getters
	get id(): string {
		return this._id;
	}

	get position(): Position {
		return this._position;
	}

	get x(): number {
		return this._position.x;
	}

	get y(): number {
		return this._position.y;
	}

	get rotation(): number {
		return this._rotation.degrees;
	}

	get rotationAngle(): Angle {
		return this._rotation;
	}

	get tack(): boolean {
		return this._tack;
	}

	get finished(): number | false {
		return this._finished;
	}

	get isStart(): boolean {
		return this._isStart;
	}

	get startPos(): number {
		return this._startPos;
	}

	get startPriority(): number {
		return this._startPriority;
	}

	get customStartX(): number | null {
		return this._customStartX;
	}

	get turns(): BoatTurn[] {
		return [...this._turns]; // Return copy to prevent external mutation
	}

	get turnType(): TurnType {
		return this._turnType;
	}

	get name(): string {
		return this._name;
	}

	get color(): string {
		return this._color;
	}

	// Setters with validation
	setPosition(position: Position): void {
		this._position = position;
	}

	setRotation(degrees: number): void {
		this._rotation = Angle.fromDegrees(degrees);
	}

	setRotationAngle(angle: Angle): void {
		this._rotation = angle;
	}

	setTack(tack: boolean): void {
		this._tack = tack;
	}

	setFinished(finished: number | false): void {
		this._finished = finished;
	}

	setIsStart(isStart: boolean): void {
		this._isStart = isStart;
	}

	setStartPos(startPos: number): void {
		if (startPos < 0 || startPos > 2) {
			throw new Error('Start position must be 0 (left), 1 (middle), or 2 (right)');
		}
		this._startPos = startPos;
	}

	setStartPriority(priority: number): void {
		if (priority < 0) {
			throw new Error('Start priority must be non-negative');
		}
		this._startPriority = priority;
	}

	setCustomStartX(x: number | null): void {
		this._customStartX = x;
	}

	setTurnType(turnType: TurnType): void {
		this._turnType = turnType;
	}

	setName(name: string): void {
		this._name = name;
	}

	// Domain methods
	saveTurn(
		turnType: TurnType,
		points: Position[],
		rotation: Angle,
		tack: boolean,
		finished: number | false
	): void {
		this._turns.push({
			turnType,
			points: [...points], // Copy array
			rotation,
			tack,
			finished
		});
	}

	back(turnCount: number): void {
		if (this._turns.length > turnCount && turnCount >= 0) {
			const turn = this._turns[turnCount];
			if (turn.points.length > 0) {
				const lastPoint = turn.points[turn.points.length - 1];
				this._position = lastPoint;
			}
			this._rotation = turn.rotation;
			this._tack = turn.tack;
			this._finished = turn.finished;

			// Set turn type for next turn
			if (this._turns.length > turnCount + 1) {
				const nextTurn = this._turns[turnCount + 1];
				this._turnType = nextTurn.turnType;
			}
		}
	}

	apply(): void {
		this.saveTurn(
			this._turnType,
			[this._position],
			this._rotation,
			this._tack,
			false
		);
		this._isStart = false;
	}

	// Helper methods
	private generateId(): string {
		return `boat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	// Convert to Boat data format
	toBoatData(): {
		x: number;
		y: number;
		rotation: number;
		tack: boolean;
		finished: number | false;
		isStart: boolean;
		startPos: number;
		startPriority: number;
		customStartX?: number;
		color: string;
		name: string;
		turntype: TurnType;
		turns: Array<{
			turnType: TurnType;
			points: Array<{ x: number; y: number }>;
			rotation: number;
			tack: boolean;
			finished: number | false;
		}>;
	} {
		return {
			x: this._position.x,
			y: this._position.y,
			rotation: this._rotation.degrees,
			tack: this._tack,
			finished: this._finished,
			isStart: this._isStart,
			startPos: this._startPos,
			startPriority: this._startPriority,
			customStartX: this._customStartX ?? undefined,
			color: this._color,
			name: this._name,
			turntype: this._turnType,
			turns: this._turns.map(turn => ({
				turnType: turn.turnType,
				points: turn.points.map(p => ({ x: p.x, y: p.y })),
				rotation: turn.rotation.degrees,
				tack: turn.tack,
				finished: turn.finished
			}))
		};
	}
}


