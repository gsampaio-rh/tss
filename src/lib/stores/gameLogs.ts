import { writable } from 'svelte/store';
import type { Boat } from '../types/boat';
import type { Game } from '../types/game';
import type { WindScenario } from '../types/wind';
import { RacingRulesService } from '../domain/services/RacingRulesService';

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
	penaltyTurnsRemaining?: number; // Number of penalty turns remaining (360° = 1 turn, 720° = 2 turns)
	isExecutingPenalty?: boolean; // Whether boat is currently executing a penalty turn
}

export interface WindLogEntry {
	turn: number;
	windValue: number;
	windDisplayAngle: number; // windValue * 2
	windShift?: number; // Delta from previous turn
	timestamp: number;
}

export interface RacingRulesLogEntry {
	playerIndex: number;
	warnings?: Array<{
		otherBoatIndex: number;
		situation: string;
		collisionRisk: string;
		warningLevel: 'warning' | 'critical';
		warningMessage: string;
	}>;
	penaltyApplied?: {
		type: 'TURN_360' | 'TURN_720';
		reason: string;
	};
}

export interface TurnLogEntry {
	turn: number;
	timestamp: number;
	wind: WindLogEntry;
	boats: BoatLogEntry[];
	racingRules?: RacingRulesLogEntry[]; // Optional: racing rules violations and warnings per boat
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
		startPriority: boat.startPriority,
		penaltyTurnsRemaining: boat.penaltyTurnsRemaining,
		isExecutingPenalty: boat.isExecutingPenalty
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

		logTurn: (turn: number, windValue: number, boats: Boat[], game?: Game | null) => {
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

			// Capture racing rules warnings and penalties if game is provided
			const racingRules: RacingRulesLogEntry[] = [];
			if (game) {
				for (let i = 0; i < boats.length; i++) {
					const boat = boats[i];
					const warnings = RacingRulesService.checkApproachingViolations(boat, game);
					const hasPenalty = boat.penaltyTurnsRemaining > 0;
					
					if (warnings.length > 0 || hasPenalty) {
						const entry: RacingRulesLogEntry = {
							playerIndex: i,
							warnings: warnings.length > 0 ? warnings.map(w => {
								const otherBoatIndex = boats.findIndex(b => b === w.otherBoat);
								return {
									otherBoatIndex: otherBoatIndex >= 0 ? otherBoatIndex : -1,
									situation: w.situation,
									collisionRisk: w.collisionRisk.riskLevel,
									warningLevel: w.warningLevel,
									warningMessage: w.warningMessage
								};
							}) : undefined,
							penaltyApplied: hasPenalty ? {
								type: boat.penaltyTurnsRemaining === 1 ? 'TURN_360' : 'TURN_720',
								reason: boat.isExecutingPenalty ? 'Executing penalty turn' : 'Penalty pending'
							} : undefined
						};
						racingRules.push(entry);
					}
				}
			}

			const turnEntry: TurnLogEntry = {
				turn,
				timestamp: Date.now(),
				wind: windEntry,
				boats: boats.map((boat, idx) => createBoatLogEntry(boat, idx)),
				racingRules: racingRules.length > 0 ? racingRules : undefined
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
