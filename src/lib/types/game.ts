import type { Boat } from './boat';
import type { WindScenario } from './wind';

// Constants
export const GRID_SIZE = 25; // Increased from 20 to make map elements larger
export const BOAT_SIZE = 32;
export const START_LINE_SIZE = 15;
export const COLORS = [
	'red',
	'blue',
	'black',
	'green',
	'cyan',
	'magenta',
	'purple',
	'gray',
	'yellow',
	'darkred',
	'darkblue',
	'goldenrod'
];

// Color mapping for boats - converts color names to hex values
export const BOAT_COLORS: Record<string, string> = {
	red: '#D94B41',
	blue: '#2F6FD6',
	black: '#000000',
	green: '#4A9B4A',
	cyan: '#00CED1',
	magenta: '#C71585',
	purple: '#9370DB',
	gray: '#808080',
	yellow: '#FFD700',
	darkred: '#8B0000',
	darkblue: '#00008B',
	goldenrod: '#DAA520'
};

// Helper function to get boat color hex value
export function getBoatColorHex(colorName: string): string {
	return BOAT_COLORS[colorName.toLowerCase()] || colorName;
}

export enum MarkType {
	StartLeft = 0,
	StartRight = 1,
	Mark1 = 2,
	Mark2 = 2,
	Mark3 = 4
}

export interface Mark {
	x: number;
	y: number;
	type: MarkType;
}

export enum TurnType {
	Forward = 0,
	Tack = 1,
	ToMark = 2
}

export interface Point {
	x: number;
	y: number;
}

export interface GameState {
	width: number;
	height: number;
	marks: Mark[];
	wind: number[];
	turncount: number;
	isStart: boolean;
	name: string;
	currentStartPriority: number;
	players: Boat[];
}

export interface WindScenarioRef {
	windscenario: WindScenario;
}

export class Game {
	players: Boat[] = [];
	width: number = 0;
	height: number = 0;
	marks: Mark[] = [];
	wind: number[] = [];
	currentStartPriority: number = 0;
	turncount: number = 0;
	isStart: boolean = true;
	name: string = '';

	getWind(index: number): number {
		return this.wind[index % this.wind.length];
	}

	isOutLaneline(x: number, y: number): boolean {
		const a = this.getRotateAngle(x, y, this.marks[2].x, this.marks[2].y);
		const currentWind = this.getWind(this.turncount);
		return a - currentWind >= 44.99 || a - currentWind <= -44.99;
	}

	setMapData(windscenario: WindScenario): void {
		this.width = windscenario.width;
		this.height = windscenario.height;
		const startsize = windscenario.startsize || 15;
		this.marks = [
			{
				x: (this.width - startsize) / 2,
				y: this.height - 2,
				type: MarkType.StartLeft
			},
			{
				x: this.width - (this.width - startsize) / 2,
				y: this.height - 2,
				type: MarkType.StartRight
			},
			{
				x: this.width / 2,
				y: 2,
				type: MarkType.Mark1
			}
		];
	}

	setWindFromScenario(windscenario: WindScenario): void {
		this.wind = [];
		const stepscount = windscenario.stepscount || 50;
		// Wind must always start at 0 so the windward mark makes sense
		// Store the first wind value from scenario to use as offset
		const firstWindValue = windscenario.wind.length > 0 ? windscenario.wind[0] : 0;

		// First turn always has wind = 0
		this.wind[0] = 0;

		// Subsequent turns use relative shifts from the scenario
		for (let i = 1; i < stepscount; i++) {
			const scenarioIndex = i % windscenario.wind.length;
			const scenarioWind = windscenario.wind[scenarioIndex];
			// Calculate relative shift from first value
			this.wind[i] = scenarioWind - firstWindValue;
		}
		this.setMapData(windscenario);
	}

	setWindFromRandom(windscenario: WindScenario): void {
		this.wind = [];

		// Wind must always start at 0 so the windward mark makes sense
		// Store the first wind value from scenario to use as offset
		const firstWindValue = windscenario.wind.length > 0 ? windscenario.wind[0] : 0;

		// First turn always has wind = 0
		this.wind.push(0);

		while (this.wind.length < 50) {
			const cards: number[] = [];
			for (let i = 0; i < windscenario.count!.length; i++) {
				for (let j = 0; j < windscenario.count![i]; j++) {
					cards.push(windscenario.wind[i]);
				}
			}
			while (cards.length > 0 && this.wind.length < 50) {
				const index = Math.floor(Math.random() * cards.length);
				const scenarioWind = cards[index];
				// Calculate relative shift from first value
				this.wind.push(scenarioWind - firstWindValue);
				cards.splice(index, 1);
			}
		}
		this.setMapData(windscenario);
	}

	findFreeColor(colors: string[]): string | null {
		for (let i = 0; i < colors.length; i++) {
			if (!this.players.find(o => o.color === colors[i])) {
				return colors[i];
			}
		}
		return null;
	}

	placeBoatsOnStart(): void {
		// Calculate required start line size based on boat count
		const BOAT_SPACING = 2.5;
		const EDGE_OFFSET = 1.5;
		const MIN_MARGIN = 2.0;
		const baseStartSize = 15;

		if (this.players.length > 0) {
			// Calculate space needed for boats
			const spaceNeeded = EDGE_OFFSET + (this.players.length - 1) * BOAT_SPACING + EDGE_OFFSET + MIN_MARGIN * 2;
			const requiredStartSize = Math.max(baseStartSize, spaceNeeded);
			const maxStartSize = this.width - 4; // Leave 2 units margin on each side
			const actualStartSize = Math.min(requiredStartSize, maxStartSize);

			// Update start marks to accommodate all boats
			const leftX = (this.width - actualStartSize) / 2;
			const rightX = this.width - (this.width - actualStartSize) / 2;

			if (this.marks.length >= 2) {
				this.marks[0].x = leftX;
				this.marks[1].x = rightX;
			}
		}

		const boatsStartLeft: Boat[] = [];
		const boatsStartMiddle: Boat[] = [];
		const boatsStartRight: Boat[] = [];

		for (let i = 0; i < this.players.length; i++) {
			const player = this.players[i];
			// If boat has custom position, preserve it
			if (player.customStartX !== undefined) {
				player.x = player.customStartX;
				player.y = this.height - 2;
				continue;
			}

			if (player.startPos === 0) {
				boatsStartLeft.push(player);
			} else if (player.startPos === 2) {
				boatsStartRight.push(player);
			} else {
				boatsStartMiddle.push(player);
			}
		}

		function compareBoatStartPriority(a: Boat, b: Boat): number {
			return a.startPriority - b.startPriority;
		}

		boatsStartLeft.sort(compareBoatStartPriority);
		boatsStartMiddle.sort(compareBoatStartPriority);
		boatsStartRight.sort(compareBoatStartPriority);

		// Spacing between boats: 2.5 game units (approximately 2-3 boat lengths)
		// This ensures boats are clearly separated and easy to distinguish
		const BOAT_SPACING_FINAL = 2.5;
		const EDGE_OFFSET_FINAL = 1.5; // Distance from mark to first boat

		const leftMark = this.marks[0];
		const rightMark = this.marks[1];
		const middleX = (leftMark.x + rightMark.x) / 2;

		// Place boats on left side (from left mark outward)
		for (let i = 0; i < boatsStartLeft.length; i++) {
			boatsStartLeft[i].x = leftMark.x + EDGE_OFFSET_FINAL + i * BOAT_SPACING_FINAL;
			boatsStartLeft[i].y = this.height - 2;
		}

		// Place boats in middle (centered around middle, alternating left/right)
		for (let i = 0; i < boatsStartMiddle.length; i++) {
			// Calculate offset from center: boats alternate left/right
			// First boat at center, then spread outward symmetrically
			// Pattern: center, right, left, further right, further left, etc.
			if (i === 0) {
				// First boat at center
				boatsStartMiddle[i].x = middleX;
			} else {
				// Subsequent boats alternate left/right
				const pairIndex = Math.floor((i - 1) / 2) + 1; // 1, 1, 2, 2, 3, 3, ...
				const direction = i % 2 === 1 ? 1 : -1; // Odd indices go right, even go left
				const offset = pairIndex * BOAT_SPACING_FINAL;
				boatsStartMiddle[i].x = middleX + direction * offset;
			}
			boatsStartMiddle[i].y = this.height - 2;
		}

		// Place boats on right side (from right mark outward)
		for (let i = 0; i < boatsStartRight.length; i++) {
			boatsStartRight[i].x = rightMark.x - EDGE_OFFSET_FINAL - i * BOAT_SPACING_FINAL;
			boatsStartRight[i].y = this.height - 2;
		}
	}

	getPlayerName(index: number): string {
		if (this.players[index].name === '') {
			return `Player ${index + 1}`;
		} else {
			return this.players[index].name;
		}
	}

	private getRotateAngle(x1: number, y1: number, x2: number, y2: number): number {
		return (Math.atan2(x2 - x1, -(y2 - y1)) * 180) / Math.PI;
	}
}
