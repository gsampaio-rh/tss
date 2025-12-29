/**
 * Execute Turn Use Case
 * Executes a game turn for all active boats
 */

import type { IUseCase } from './IUseCase';
import { GameService } from '../services/GameService';
import type { Game } from '../../types/game';
import { logger } from '../../infrastructure/logging/logger';

export interface ExecuteTurnRequest {
	game: Game;
	enableDirtyAirEffects?: boolean;
}

export interface ExecuteTurnResponse {
	game: Game;
	turnCount: number;
}

/**
 * Use case for executing a game turn
 */
export class ExecuteTurnUseCase implements IUseCase<ExecuteTurnRequest, ExecuteTurnResponse> {
	async execute(request: ExecuteTurnRequest): Promise<ExecuteTurnResponse> {
		logger.info(
			'[ExecuteTurnUseCase] Executing',
			'ExecuteTurnUseCase',
			{
				turnCount: request.game.turncount,
				enableDirtyAirEffects: request.enableDirtyAirEffects || false
			}
		);

		try {
			GameService.executeTurn(request.game, request.enableDirtyAirEffects || false);

			logger.info(
				'[ExecuteTurnUseCase] Turn executed successfully',
				'ExecuteTurnUseCase',
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
				'[ExecuteTurnUseCase] Failed to execute turn',
				error instanceof Error ? error : new Error(String(error)),
				'ExecuteTurnUseCase',
				{ request }
			);
			throw error;
		}
	}
}

