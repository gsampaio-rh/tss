/**
 * Boat Mapper
 * Converts between Boat entity and BoatDTO
 */

import { Boat } from '$lib/types/boat';
import type { BoatDTO, BoatTurnDTO, PointDTO } from '../dto/BoatDTO';
import type { PlayerStory } from '$lib/types/boat';

export class BoatMapper {
	/**
	 * Convert Boat entity to BoatDTO
	 */
	static toDTO(boat: Boat): BoatDTO {
		return {
			x: boat.x,
			y: boat.y,
			rotation: boat.rotation,
			tack: boat.tack,
			finished: boat.finished,
			isStart: boat.isStart,
			startPos: boat.startPos,
			startPriority: boat.startPriority,
			customStartX: boat.customStartX,
			color: boat.color,
			name: boat.name,
			turnType: boat.turntype,
			turns: boat.turns.map(turn => BoatMapper.turnToDTO(turn))
		};
	}

	/**
	 * Convert BoatDTO to Boat entity
	 */
	static fromDTO(dto: BoatDTO): Boat {
		const boat = new Boat(dto.x, dto.y, dto.tack, dto.color);
		boat.rotation = dto.rotation;
		boat.finished = dto.finished;
		boat.isStart = dto.isStart;
		boat.startPos = dto.startPos;
		boat.startPriority = dto.startPriority;
		boat.customStartX = dto.customStartX;
		boat.name = dto.name;
		boat.turntype = dto.turnType;
		boat.turns = dto.turns.map(turn => BoatMapper.turnFromDTO(turn));
		return boat;
	}

	/**
	 * Convert BoatTurn to BoatTurnDTO
	 */
	static turnToDTO(turn: PlayerStory): BoatTurnDTO {
		return {
			turnType: turn.turnType,
			points: turn.points.map(p => ({ x: p.x, y: p.y })),
			rotation: turn.rotation,
			tack: turn.tack,
			finished: turn.finished
		};
	}

	/**
	 * Convert BoatTurnDTO to BoatTurn
	 */
	static turnFromDTO(dto: BoatTurnDTO): PlayerStory {
		return {
			turnType: dto.turnType,
			points: dto.points.map(p => ({ x: p.x, y: p.y })),
			rotation: dto.rotation,
			tack: dto.tack,
			finished: dto.finished
		};
	}

	/**
	 * Convert Point to PointDTO
	 */
	static pointToDTO(point: { x: number; y: number }): PointDTO {
		return {
			x: point.x,
			y: point.y
		};
	}

	/**
	 * Convert PointDTO to Point
	 */
	static pointFromDTO(dto: PointDTO): { x: number; y: number } {
		return {
			x: dto.x,
			y: dto.y
		};
	}
}

