/**
 * Update Player Start Position Use Case
 * Updates a player's start position preference
 */

import type { IUseCase } from './IUseCase';
import { PlayerService } from '../services/PlayerService';
import type { Game } from '../../types/game';
import { logger } from '../../infrastructure/logging/logger';

export interface UpdatePlayerStartPositionRequest {
	game: Game;
	playerIndex: number;
	startPos: number; // 0 = left, 1 = middle, 2 = right
}

export interface UpdatePlayerStartPositionResponse {
	game: Game;
}

/**
 * Use case for updating a player's start position preference
 */
export class UpdatePlayerStartPositionUseCase
	implements IUseCase<UpdatePlayerStartPositionRequest, UpdatePlayerStartPositionResponse>
{
	async execute(
		request: UpdatePlayerStartPositionRequest
	): Promise<UpdatePlayerStartPositionResponse> {
		logger.info(
			'[UpdatePlayerStartPositionUseCase] Executing',
			'UpdatePlayerStartPositionUseCase',
			{
				playerIndex: request.playerIndex,
				startPos: request.startPos
			}
		);

		try {
			const player = request.game.players[request.playerIndex];
			if (!player) {
				const error = new Error(`Player at index ${request.playerIndex} not found`);
				logger.warn('[UpdatePlayerStartPositionUseCase] Player not found', 'UpdatePlayerStartPositionUseCase');
				throw error;
			}

			if (player.startPos !== request.startPos) {
				PlayerService.updateStartPosition(player, request.startPos);
				player.startPriority = request.game.currentStartPriority++;
				// Clear custom position when changing startPos via buttons
				player.customStartX = undefined;
				request.game.placeBoatsOnStart();

				logger.info(
					'[UpdatePlayerStartPositionUseCase] Start position updated successfully',
					'UpdatePlayerStartPositionUseCase',
					{
						playerName: player.name,
						newStartPos: request.startPos
					}
				);
			}

			return {
				game: request.game
			};
		} catch (error) {
			logger.error(
				'[UpdatePlayerStartPositionUseCase] Failed to update start position',
				error instanceof Error ? error : new Error(String(error)),
				'UpdatePlayerStartPositionUseCase',
				{ request }
			);
			throw error;
		}
	}
}

