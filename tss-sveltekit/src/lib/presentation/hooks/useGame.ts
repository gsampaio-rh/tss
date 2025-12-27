/**
 * useGame Hook
 * Provides game state and operations
 */

import { get } from 'svelte/store';
import { game, players, turnCount, isStart, currentWind } from '$lib/stores/game';
import { GameService } from '$lib/application/services/GameService';
import type { Game } from '$lib/types/game';
import type { WindScenario } from '$lib/types/wind';

export function useGame() {
	return {
		// State
		get game(): Game | null {
			return get(game);
		},
		get players() {
			return get(players);
		},
		get turnCount() {
			return get(turnCount);
		},
		get isStart() {
			return get(isStart);
		},
		get currentWind() {
			return get(currentWind);
		},

		// Actions
		createGame(playerCount: number, windScenario: WindScenario, colors: string[] = []) {
			const newGame = GameService.createGame(playerCount, windScenario, colors);
			game.set(newGame);
			players.set(newGame.players);
			return newGame;
		},

		executeTurn(enableDirtyAirEffects: boolean = false) {
			const currentGame = get(game);
			if (!currentGame) return;
			GameService.executeTurn(currentGame, enableDirtyAirEffects);
		},

		backTurn() {
			const currentGame = get(game);
			if (!currentGame) return;
			GameService.backTurn(currentGame);
		},

		resetToStart() {
			const currentGame = get(game);
			if (!currentGame) return;
			GameService.resetToStart(currentGame);
		},

		getGameState() {
			const currentGame = get(game);
			if (!currentGame) return null;
			return GameService.getGameState(currentGame);
		}
	};
}


