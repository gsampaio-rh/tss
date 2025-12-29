/**
 * Create Game Use Case
 * Creates a new game with specified players and wind scenario
 */

import type { IUseCase } from './IUseCase';
import { GameService } from '../services/GameService';
import type { Game } from '../../types/game';
import type { WindScenario } from '../../types/wind';
import { logger } from '../../infrastructure/logging/logger';

export interface CreateGameRequest {
	playerCount: number;
	windScenario: WindScenario;
	colors?: string[];
}

export interface CreateGameResponse {
	game: Game;
}

/**
 * Use case for creating a new game
 */
export class CreateGameUseCase implements IUseCase<CreateGameRequest, CreateGameResponse> {
	async execute(request: CreateGameRequest): Promise<CreateGameResponse> {
		logger.info(
			'[CreateGameUseCase] Executing',
			'CreateGameUseCase',
			{
				playerCount: request.playerCount,
				scenarioName: request.windScenario.name
			}
		);

		try {
			const game = GameService.createGame(
				request.playerCount,
				request.windScenario,
				request.colors || []
			);

			logger.info(
				'[CreateGameUseCase] Game created successfully',
				'CreateGameUseCase',
				{
					gameName: game.name,
					playersCount: game.players.length
				}
			);

			return { game };
		} catch (error) {
			logger.error(
				'[CreateGameUseCase] Failed to create game',
				error instanceof Error ? error : new Error(String(error)),
				'CreateGameUseCase',
				{ request }
			);
			throw error;
		}
	}
}

