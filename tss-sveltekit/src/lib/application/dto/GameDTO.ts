/**
 * Game Data Transfer Object
 * Used for serialization and API communication
 */

import type { Mark } from '$lib/types/game';

export interface GameDTO {
	id?: string;
	name: string;
	width: number;
	height: number;
	marks: MarkDTO[];
	wind: number[];
	turnCount: number;
	isStart: boolean;
	currentStartPriority: number;
	playerIds: string[];
	createdAt?: string;
	updatedAt?: string;
}

export interface MarkDTO {
	x: number;
	y: number;
	type: number;
}

export interface GameStateDTO {
	width: number;
	height: number;
	marks: MarkDTO[];
	wind: number[];
	turncount: number;
	isStart: boolean;
	name: string;
	currentStartPriority: number;
	playerIds: string[];
}

