/**
 * Game Engine Service
 * 
 * Core game loop and turn execution orchestration.
 * This is a domain service that handles the core game mechanics:
 * - Executes turns for all boats
 * - Handles AI decision-making
 * - Manages turn history
 * - Handles game state transitions
 * 
 * @module Domain/Services
 */

import { BoatMovementService } from './BoatMovementService';
import { WindCalculationService } from './WindCalculationService';
import { AIPlayerService, AIDifficulty } from '../../application/services/AIPlayerService';
import type { Boat } from '../../types/boat';
import type { Game } from '../../types/game';

/**
 * Game Engine Service
 * 
 * Provides core game loop functionality including turn execution,
 * turn history management, and game state management.
 */
export class GameEngineService {
	/**
	 * Execute a game turn for all boats
	 * 
	 * Processes one turn for all active boats in the game:
	 * 1. For AI boats, makes AI decisions
	 * 2. Executes boat movement for each boat
	 * 3. Saves turn data for track visualization
	 * 4. Increments turn count
	 * 
	 * @param game - The game instance
	 * @param enableDirtyAirEffects - Whether to apply dirty air speed/angle penalties
	 * 
	 * @example
	 * ```typescript
	 * GameEngineService.executeTurn(game, true);
	 * ```
	 */
	static executeTurn(
		game: Game,
		enableDirtyAirEffects: boolean = false
	): void {
		const currentWind = game.getWind(game.turncount);

		// Execute turn for each boat
		for (const boat of game.players) {
			if (!boat.finished) {
				// If boat is AI-controlled, make AI decision
				if (boat.isAI) {
					const difficulty = boat.aiDifficulty 
						? (boat.aiDifficulty as AIDifficulty)
						: AIDifficulty.Medium;
					const aiDecision = AIPlayerService.makeDecision(boat, game, difficulty);
					boat.turntype = aiDecision.turnType;
					// Log AI decision (can be removed or made optional)
					if (typeof console !== 'undefined' && console.debug) {
						console.debug(`[AI] ${boat.name || 'AI Player'}: ${aiDecision.reason}`);
					}
				}

				const result = BoatMovementService.executeBoatTurn(boat, game, enableDirtyAirEffects);
				
				// Save turn data for track visualization
				// Convert Position[] to Point[] format expected by boat.saveTurn()
				const points = result.points.map(p => ({ x: p.x, y: p.y }));
				boat.saveTurn(
					boat.turntype,
					points,
					result.finalRotation.degrees,
					result.finalTack,
					result.finished
				);
			}
		}

		// Increment turn count
		game.turncount++;
	}

	/**
	 * Undo last turn (go back one turn)
	 */
	static backTurn(game: Game): void {
		if (game.turncount > 0) {
			game.turncount--;

			// Restore boat states from previous turn
			for (const boat of game.players) {
				boat.back(game.turncount);
			}
		}
	}

	/**
	 * Reset game to start
	 */
	static resetToStart(game: Game): void {
		game.turncount = 0;
		game.isStart = true;

		// Reset all boats
		for (const boat of game.players) {
			boat.turns = [];
			boat.finished = false;
			boat.isStart = true;
		}

		// Place boats on start line
		game.placeBoatsOnStart();
	}

	/**
	 * Check if game is finished (all boats finished)
	 */
	static isGameFinished(game: Game): boolean {
		return game.players.every(boat => boat.finished !== false);
	}

	/**
	 * Get current game state summary
	 */
	static getGameState(game: Game): {
		turnCount: number;
		isStart: boolean;
		currentWind: number;
		finishedBoats: number;
		totalBoats: number;
	} {
		return {
			turnCount: game.turncount,
			isStart: game.isStart,
			currentWind: game.getWind(game.turncount),
			finishedBoats: game.players.filter(b => b.finished !== false).length,
			totalBoats: game.players.length
		};
	}
}

