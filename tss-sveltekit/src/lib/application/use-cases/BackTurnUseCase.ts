/**
 * Back Turn Use Case
 * Undoes the last turn, reverting game state
 */

import type { IUseCase } from './IUseCase';
import { GameService } from '../services/GameService';
import type { Game } from '../../types/game';
import { logger } from '../../infrastructure/logging/logger';

export interface BackTurnRequest {
	game: Game;
}

export interface BackTurnResponse {
	game: Game;
	turnCount: number;
}

/**
 * Use case for undoing the last turn
 */
export class BackTurnUseCase implements IUseCase<BackTurnRequest, BackTurnResponse> {
	async execute(request: BackTurnRequest): Promise<BackTurnResponse> {
		logger.info(
			'[BackTurnUseCase] Executing',
			'BackTurnUseCase',
			{
				currentTurnCount: request.game.turncount
			}
		);

		try {
			GameService.backTurn(request.game);

			logger.info(
				'[BackTurnUseCase] Turn reverted successfully',
				'BackTurnUseCase',
				{
					newTurnCount: request.game.turncount
				}
			);

			return {
				game: request.game,
				turnCount: request.game.turncount
			};
		} catch (error) {
			logger.error(
				'[BackTurnUseCase] Failed to revert turn',
				error instanceof Error ? error : new Error(String(error)),
				'BackTurnUseCase',
				{ request }
			);
			throw error;
		}
	}
}

