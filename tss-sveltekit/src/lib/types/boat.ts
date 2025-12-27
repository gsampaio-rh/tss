import type { Point } from './game';
import { TurnType } from './game';

export interface PlayerStory {
	turnType: TurnType;
	points: Point[];
	rotation: number;
	tack: boolean;
	finished: number | false;
}

export interface BoatTurn {
	turnType: TurnType;
	points: Point[];
	rotation: number;
	tack: boolean;
	finished: number | false;
}

export class Boat {
	x: number;
	y: number;
	turns: PlayerStory[] = [];
	rotation: number = -45;
	tack: boolean = false;
	finished: number | false = false;
	isStart: boolean = true;
	startPos: number = 1;
	startPriority: number = 0;
	customStartX?: number; // Custom X position on start line (when dragged)
	color: string;
	name: string = '';
	turntype: TurnType = TurnType.Forward;

	// UI elements (will be replaced by Svelte components)
	html?: HTMLElement;
	track?: SVGPolylineElement;

	// Control elements (will be replaced by Svelte components)
	forwardBtn?: HTMLInputElement;
	tackBtn?: HTMLInputElement;
	toMarkBtn?: HTMLInputElement;
	nameInput?: HTMLInputElement;
	startInputs?: HTMLInputElement[];

	constructor(x: number, y: number, tack: boolean, color: string) {
		this.x = x;
		this.y = y;
		this.tack = tack;
		this.rotation = -45;
		this.finished = false;
		this.turns = [];
		this.isStart = true;
		this.startPos = 1;
		this.color = color;
		this.turntype = TurnType.Forward;
	}

	getTurn(): TurnType {
		// In Svelte, we use the turntype property directly (set by PlayerControl component)
		console.log(`[BOAT.getTurn] Boat: ${this.name || 'Unnamed'}`);
		console.log(`  Current turntype property: ${TurnType[this.turntype]}`);
		console.log(`  Returning: ${TurnType[this.turntype]}`);
		return this.turntype;
	}

	setTurn(turntype: TurnType): void {
		// In Svelte, this will be replaced by reactive state
		if (!this.forwardBtn || !this.tackBtn || !this.toMarkBtn) {
			console.log(
				`[BOAT.setTurn] Boat: ${this.name || 'Unnamed'}, Cannot set turn - buttons not initialized`
			);
			return;
		}

		console.log(
			`[BOAT.setTurn] Boat: ${this.name || 'Unnamed'}, Setting turntype to: ${TurnType[turntype]}`
		);

		if (turntype === TurnType.Forward) {
			this.forwardBtn.checked = true;
			console.log(`  Set forwardBtn.checked = true`);
		} else if (turntype === TurnType.Tack) {
			this.tackBtn.checked = true;
			console.log(`  Set tackBtn.checked = true`);
		} else {
			this.toMarkBtn.checked = true;
			console.log(`  Set toMarkBtn.checked = true`);
		}
	}

	saveTurn(
		turntype: TurnType,
		points: Point[],
		rotation: number,
		tack: boolean,
		finished: number | false
	): void {
		this.turns.push({
			turnType: turntype,
			points,
			rotation,
			tack,
			finished
		});
	}

	back(turncount: number): void {
		if (this.turns.length > turncount && turncount >= 0) {
			const turn = this.turns[turncount];
			if (turn.points.length > 0) {
				const lastPoint = turn.points[turn.points.length - 1];
				this.x = lastPoint.x;
				this.y = lastPoint.y;
			}
			this.rotation = turn.rotation;
			this.tack = turn.tack;
			this.finished = turn.finished;

			// Set turn type for next turn
			if (this.turns.length > turncount + 1) {
				const nextTurn = this.turns[turncount + 1];
				this.setTurn(nextTurn.turnType);
			}
		}
	}

	apply(): void {
		this.saveTurn(TurnType.Forward, [{ x: this.x, y: this.y }], this.rotation, this.tack, false);
		this.isStart = false;
		if (this.forwardBtn) {
			this.forwardBtn.checked = true;
		}
	}
}
