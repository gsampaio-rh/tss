import { writable } from 'svelte/store';
import type { Boat } from '../types/boat';
import type { WindScenario } from '../types/wind';

export interface BoatLogEntry {
	playerIndex: number;
	name: string;
	color: string;
	x: number;
	y: number;
	rotation: number;
	tack: boolean;
	turntype: number;
	finished: boolean;
	startPos?: number;
	startPriority?: number;
}

export interface WindLogEntry {
	turn: number;
	windValue: number;
	windDisplayAngle: number; // windValue * 2
	windShift?: number; // Delta from previous turn
	timestamp: number;
}

export interface TurnLogEntry {
	turn: number;
	timestamp: number;
	wind: WindLogEntry;
	boats: BoatLogEntry[];
}

export interface GameLog {
	gameId: string;
	gameName: string;
	windScenario: {
		name: string;
		israndom: boolean;
	};
	startTime: number;
	endTime?: number;
	initialBoats: BoatLogEntry[];
	turns: TurnLogEntry[];
	metadata: {
		playerCount: number;
		gameWidth: number;
		gameHeight: number;
	};
}

function createBoatLogEntry(boat: Boat, playerIndex: number): BoatLogEntry {
	return {
		playerIndex,
		name: boat.name || `Player ${playerIndex + 1}`,
		color: boat.color,
		x: boat.x,
		y: boat.y,
		rotation: boat.rotation,
		tack: boat.tack,
		turntype: boat.turntype,
		finished: boat.finished !== false,
		startPos: boat.startPos,
		startPriority: boat.startPriority
	};
}

function createGameLogStore() {
	let currentLog: GameLog | null = null;
	let previousWind: number | null = null;

	const { subscribe, set, update } = writable<GameLog | null>(null);

	// Expose the store for reactivity
	const store = { subscribe };

	return {
		...store,

		startLog: (
			gameName: string,
			windScenario: WindScenario,
			boats: Boat[],
			gameWidth: number,
			gameHeight: number
		) => {
			const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			currentLog = {
				gameId,
				gameName: gameName || windScenario.name || 'Untitled Game',
				windScenario: {
					name: windScenario.name || 'Unknown',
					israndom: windScenario.israndom || false
				},
				startTime: Date.now(),
				initialBoats: boats.map((boat, idx) => createBoatLogEntry(boat, idx)),
				turns: [],
				metadata: {
					playerCount: boats.length,
					gameWidth,
					gameHeight
				}
			};

			previousWind = null;
			set(currentLog);
		},

		logTurn: (turn: number, windValue: number, boats: Boat[]) => {
			if (!currentLog) return;

			const windDisplayAngle = windValue * 2;
			const windShift = previousWind !== null ? windValue - previousWind : undefined;

			const windEntry: WindLogEntry = {
				turn,
				windValue,
				windDisplayAngle,
				windShift,
				timestamp: Date.now()
			};

			const turnEntry: TurnLogEntry = {
				turn,
				timestamp: Date.now(),
				wind: windEntry,
				boats: boats.map((boat, idx) => createBoatLogEntry(boat, idx))
			};

			currentLog.turns.push(turnEntry);
			previousWind = windValue;

			set(currentLog);
		},

		endLog: () => {
			if (!currentLog) return;

			currentLog.endTime = Date.now();
			set(currentLog);
		},

		getLog: (): GameLog | null => {
			return currentLog;
		},

		exportLog: (): string => {
			if (!currentLog) return '';
			return JSON.stringify(currentLog, null, 2);
		},

		downloadLog: (filename?: string) => {
			if (!currentLog) return;

			const json = JSON.stringify(currentLog, null, 2);
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename || `game_log_${currentLog.gameId}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		},

		clearLog: () => {
			currentLog = null;
			previousWind = null;
			set(null);
		}
	};
}

export const gameLogs = createGameLogStore();
