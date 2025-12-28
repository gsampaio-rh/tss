/**
 * useGame Hook
 * 
 * Provides game state and operations for Svelte components.
 * This hook encapsulates game-related state and operations, making
 * it easy to use game functionality in components.
 * 
 * @module Presentation/Hooks
 * 
 * @returns An object with game state getters and operation methods
 * 
 * @example
 * ```typescript
 * const gameHook = useGame();
 * const currentGame = gameHook.game;
 * gameHook.createGame(2, windScenario);
 * ```
 */

import { get } from 'svelte/store';
import { game, players, turnCount, isStart, currentWind } from '$lib/stores/game';
import { GameService } from '$lib/application/services/GameService';
import type { Game } from '$lib/types/game';
import type { WindScenario } from '$lib/types/wind';

/**
 * useGame Hook
 * 
 * Provides reactive access to game state and game operations.
 * 
 * @returns Object with game state getters and operation methods
 */
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


