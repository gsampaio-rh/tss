/**
 * Reset Game Use Case
 * Resets the game to its initial start state
 */

import type { IUseCase } from './IUseCase';
import { GameService } from '../services/GameService';
import type { Game } from '../../types/game';
import { logger } from '../../infrastructure/logging/logger';

export interface ResetGameRequest {
	game: Game;
}

export interface ResetGameResponse {
	game: Game;
}

/**
 * Use case for resetting a game to start
 */
export class ResetGameUseCase implements IUseCase<ResetGameRequest, ResetGameResponse> {
	async execute(request: ResetGameRequest): Promise<ResetGameResponse> {
		logger.info(
			'[ResetGameUseCase] Executing',
			'ResetGameUseCase',
			{
				currentTurnCount: request.game.turncount
			}
		);

		try {
			GameService.resetToStart(request.game);

			logger.info(
				'[ResetGameUseCase] Game reset successfully',
				'ResetGameUseCase',
				{
					isStart: request.game.isStart,
					turnCount: request.game.turncount
				}
			);

			return {
				game: request.game
			};
		} catch (error) {
			logger.error(
				'[ResetGameUseCase] Failed to reset game',
				error instanceof Error ? error : new Error(String(error)),
				'ResetGameUseCase',
				{ request }
			);
			throw error;
		}
	}
}

