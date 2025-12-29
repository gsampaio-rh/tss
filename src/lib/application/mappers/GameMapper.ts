/**
 * Game Mapper
 * Converts between Game entity and GameDTO
 */

import { Game } from '$lib/types/game';
import type { GameDTO, MarkDTO, GameStateDTO } from '../dto/GameDTO';
import type { BoatDTO } from '../dto/BoatDTO';
import { BoatMapper } from './BoatMapper';

export class GameMapper {
	/**
	 * Convert Game entity to GameDTO
	 */
	static toDTO(game: Game, includePlayers: boolean = false): GameDTO {
		return {
			name: game.name,
			width: game.width,
			height: game.height,
			marks: game.marks.map(mark => GameMapper.markToDTO(mark)),
			wind: [...game.wind],
			turnCount: game.turncount,
			isStart: game.isStart,
			currentStartPriority: game.currentStartPriority,
			playerIds: includePlayers ? game.players.map((_, i) => `player-${i}`) : [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
	}

	/**
	 * Convert GameDTO to Game entity
	 */
	static fromDTO(dto: GameDTO, boats: BoatDTO[] = []): Game {
		const game = new Game();
		game.name = dto.name;
		game.width = dto.width;
		game.height = dto.height;
		game.marks = dto.marks.map(mark => GameMapper.markFromDTO(mark));
		game.wind = [...dto.wind];
		game.turncount = dto.turnCount;
		game.isStart = dto.isStart;
		game.currentStartPriority = dto.currentStartPriority;
		game.players = boats.map(boatDto => BoatMapper.fromDTO(boatDto));
		return game;
	}

	/**
	 * Convert Game to GameStateDTO
	 */
	static toStateDTO(game: Game): GameStateDTO {
		return {
			width: game.width,
			height: game.height,
			marks: game.marks.map(mark => GameMapper.markToDTO(mark)),
			wind: [...game.wind],
			turncount: game.turncount,
			isStart: game.isStart,
			name: game.name,
			currentStartPriority: game.currentStartPriority,
			playerIds: game.players.map((_, i) => `player-${i}`)
		};
	}

	/**
	 * Convert Mark to MarkDTO
	 */
	static markToDTO(mark: { x: number; y: number; type: number }): MarkDTO {
		return {
			x: mark.x,
			y: mark.y,
			type: mark.type
		};
	}

	/**
	 * Convert MarkDTO to Mark
	 */
	static markFromDTO(dto: MarkDTO): { x: number; y: number; type: number } {
		return {
			x: dto.x,
			y: dto.y,
			type: dto.type
		};
	}
}

