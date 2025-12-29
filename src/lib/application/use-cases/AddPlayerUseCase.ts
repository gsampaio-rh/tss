/**
 * Add Player Use Case
 * Adds a new player/boat to an existing game
 */

import type { IUseCase } from './IUseCase';
import { PlayerService } from '../services/PlayerService';
import type { Game } from '../../types/game';
import type { Boat } from '../../types/boat';
import { logger } from '../../infrastructure/logging/logger';

export interface AddPlayerRequest {
	game: Game;
	colors?: string[];
}

export interface AddPlayerResponse {
	game: Game;
	player: Boat;
}

/**
 * Use case for adding a player to a game
 */
export class AddPlayerUseCase implements IUseCase<AddPlayerRequest, AddPlayerResponse> {
	async execute(request: AddPlayerRequest): Promise<AddPlayerResponse> {
		logger.info(
			'[AddPlayerUseCase] Executing',
			'AddPlayerUseCase',
			{
				currentPlayersCount: request.game.players.length
			}
		);

		try {
			const colors = request.colors || [];
			const color = request.game.findFreeColor(colors);

			if (!color) {
				const error = new Error('Cannot add player: no free colors available');
				logger.warn('[AddPlayerUseCase] No free colors', 'AddPlayerUseCase');
				throw error;
			}

			const newBoat = PlayerService.createPlayer(
				6,
				request.game.height - 2,
				false,
				color,
				`Player ${request.game.players.length + 1}`
			);

			newBoat.startPos = 1; // Default to middle
			newBoat.startPriority = request.game.currentStartPriority++;

			request.game.players.push(newBoat);
			request.game.placeBoatsOnStart();

			logger.info(
				'[AddPlayerUseCase] Player added successfully',
				'AddPlayerUseCase',
				{
					playerName: newBoat.name,
					playerColor: newBoat.color,
					totalPlayers: request.game.players.length
				}
			);

			return {
				game: request.game,
				player: newBoat
			};
		} catch (error) {
			logger.error(
				'[AddPlayerUseCase] Failed to add player',
				error instanceof Error ? error : new Error(String(error)),
				'AddPlayerUseCase',
				{ request }
			);
			throw error;
		}
	}
}

