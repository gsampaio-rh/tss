/**
 * useBoat Hook
 * Provides boat/player operations
 */

import { get } from 'svelte/store';
import { players, game } from '$lib/stores/game';
import { PlayerService } from '$lib/application/services/PlayerService';
import type { Boat } from '$lib/types/boat';

export function useBoat() {
	return {
		// Get boat by index
		getBoat(index: number): Boat | null {
			const allPlayers = get(players);
			return allPlayers[index] || null;
		},

		// Get all boats
		get allBoats() {
			return get(players);
		},

		// Update boat name
		updateName(boat: Boat, name: string) {
			PlayerService.updatePlayerName(boat, name);
		},

		// Update start position
		updateStartPosition(boat: Boat, startPos: number) {
			PlayerService.updateStartPosition(boat, startPos);
		},

		// Set custom start X
		setCustomStartX(boat: Boat, x: number | null) {
			PlayerService.setCustomStartX(boat, x);
		},

		// Execute boat turn
		executeBoatTurn(boat: Boat, enableDirtyAirEffects: boolean = false) {
			const currentGame = get(game);
			if (!currentGame) return;
			PlayerService.executeBoatTurn(boat, currentGame, enableDirtyAirEffects);
		}
	};
}

