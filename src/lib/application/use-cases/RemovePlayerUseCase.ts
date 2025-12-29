/**
 * Remove Player Use Case
 * Removes a player/boat from the game
 */

import type { IUseCase } from './IUseCase';
import type { Game } from '../../types/game';
import { logger } from '../../infrastructure/logging/logger';

export interface RemovePlayerRequest {
	game: Game;
	playerIndex: number;
}

export interface RemovePlayerResponse {
	game: Game;
	removedPlayerName: string;
}

/**
 * Use case for removing a player from a game
 */
export class RemovePlayerUseCase implements IUseCase<RemovePlayerRequest, RemovePlayerResponse> {
	async execute(request: RemovePlayerRequest): Promise<RemovePlayerResponse> {
		logger.info(
			'[RemovePlayerUseCase] Executing',
			'RemovePlayerUseCase',
			{
				playerIndex: request.playerIndex,
				totalPlayers: request.game.players.length
			}
		);

		try {
			const player = request.game.players[request.playerIndex];
			if (!player) {
				const error = new Error(`Player at index ${request.playerIndex} not found`);
				logger.warn('[RemovePlayerUseCase] Player not found', 'RemovePlayerUseCase');
				throw error;
			}

			const removedPlayerName = player.name || `Player ${request.playerIndex + 1}`;
			request.game.players.splice(request.playerIndex, 1);
			request.game.placeBoatsOnStart();

			logger.info(
				'[RemovePlayerUseCase] Player removed successfully',
				'RemovePlayerUseCase',
				{
					removedPlayerName,
					remainingPlayers: request.game.players.length
				}
			);

			return {
				game: request.game,
				removedPlayerName
			};
		} catch (error) {
			logger.error(
				'[RemovePlayerUseCase] Failed to remove player',
				error instanceof Error ? error : new Error(String(error)),
				'RemovePlayerUseCase',
				{ request }
			);
			throw error;
		}
	}
}

