/**
 * Player Service
 * Manages player/boat operations
 */

import { Boat } from '$lib/types/boat';
import type { Game } from '$lib/types/game';
import { Position } from '$lib/domain/value-objects/Position';
import { BoatMovementService } from '$lib/domain/services/BoatMovementService';

export class PlayerService {
	/**
	 * Create a new player/boat
	 */
	static createPlayer(
		x: number,
		y: number,
		tack: boolean,
		color: string,
		name: string = ''
	): Boat {
		const boat = new Boat(x, y, tack, color);
		boat.name = name || `Player ${Date.now()}`;
		return boat;
	}

	/**
	 * Update player name
	 */
	static updatePlayerName(boat: Boat, name: string): void {
		boat.name = name;
	}

	/**
	 * Update player start position
	 */
	static updateStartPosition(boat: Boat, startPos: number): void {
		if (startPos < 0 || startPos > 2) {
			throw new Error('Start position must be 0 (left), 1 (middle), or 2 (right)');
		}
		boat.startPos = startPos;
	}

	/**
	 * Update player start priority
	 */
	static updateStartPriority(boat: Boat, priority: number): void {
		if (priority < 0) {
			throw new Error('Start priority must be non-negative');
		}
		boat.startPriority = priority;
	}

	/**
	 * Set custom start X position (for drag-and-drop)
	 */
	static setCustomStartX(boat: Boat, x: number | null): void {
		boat.customStartX = x ?? undefined;
	}

	/**
	 * Execute boat turn
	 */
	static executeBoatTurn(
		boat: Boat,
		game: Game,
		enableDirtyAirEffects: boolean = false
	): void {
		BoatMovementService.executeBoatTurn(boat, game, enableDirtyAirEffects);
	}

	/**
	 * Get player position
	 */
	static getPlayerPosition(boat: Boat): Position {
		return new Position(boat.x, boat.y);
	}

	/**
	 * Check if player is finished
	 */
	static isPlayerFinished(boat: Boat): boolean {
		return boat.finished !== false;
	}

	/**
	 * Get player finish time
	 */
	static getFinishTime(boat: Boat): number | null {
		return boat.finished !== false ? boat.finished : null;
	}
}

