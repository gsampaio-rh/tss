/**
 * Boat Data Transfer Object
 * Used for serialization and API communication
 */

import type { TurnType } from '$lib/types/game';

export interface BoatDTO {
	id?: string;
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
	turnType: TurnType;
	turns: BoatTurnDTO[];
}

export interface BoatTurnDTO {
	turnType: TurnType;
	points: PointDTO[];
	rotation: number;
	tack: boolean;
	finished: number | false;
}

export interface PointDTO {
	x: number;
	y: number;
}


