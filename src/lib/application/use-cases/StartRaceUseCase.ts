/**
 * Start Race Use Case
 * Starts the race by applying all player positions and locking the game state
 */

import type { IUseCase } from './IUseCase';
import type { Game } from '../../types/game';
import { logger } from '../../infrastructure/logging/logger';

export interface StartRaceRequest {
	game: Game;
}

export interface StartRaceResponse {
	game: Game;
}

/**
 * Use case for starting a race
 */
export class StartRaceUseCase implements IUseCase<StartRaceRequest, StartRaceResponse> {
	async execute(request: StartRaceRequest): Promise<StartRaceResponse> {
		logger.info(
			'[StartRaceUseCase] Executing',
			'StartRaceUseCase',
			{
				playersCount: request.game.players.length,
				currentIsStart: request.game.isStart
			}
		);

		try {
			if (!request.game.isStart) {
				const error = new Error('Race has already started');
				logger.warn('[StartRaceUseCase] Race already started', 'StartRaceUseCase');
				throw error;
			}

			// Apply names and start positions
			for (const player of request.game.players) {
				if (!player.name) {
					const index = request.game.players.indexOf(player);
					player.name = `Player ${index + 1}`;
				}
				player.apply();
			}

			request.game.isStart = false;

			logger.info(
				'[StartRaceUseCase] Race started successfully',
				'StartRaceUseCase',
				{
					playersCount: request.game.players.length
				}
			);

			return {
				game: request.game
			};
		} catch (error) {
			logger.error(
				'[StartRaceUseCase] Failed to start race',
				error instanceof Error ? error : new Error(String(error)),
				'StartRaceUseCase',
				{ request }
			);
			throw error;
		}
	}
}

