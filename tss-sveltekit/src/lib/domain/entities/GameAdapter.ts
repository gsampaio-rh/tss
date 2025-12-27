/**
 * Game Adapter
 * Converts between GameEntity and legacy Game class for backward compatibility
 */

import { GameEntity } from './Game';
import { MarkEntity } from './Mark';
import { Position } from '../value-objects/Position';
import { Game } from '../../types/game';
import type { Boat } from '../../types/boat';
import type { WindScenario } from '../../types/wind';
import { WindCalculationService } from '../services/WindCalculationService';

/**
 * Convert GameEntity to legacy Game class
 * This maintains backward compatibility with existing code
 */
export function gameEntityToLegacyGame(gameEntity: GameEntity): Game {
	const legacy = new Game();
	const entityData = gameEntity.toLegacyGame();
	
	// Copy all properties
	legacy.players = entityData.players;
	legacy.width = entityData.width;
	legacy.height = entityData.height;
	legacy.marks = entityData.marks;
	legacy.wind = entityData.wind;
	legacy.currentStartPriority = entityData.currentStartPriority;
	legacy.turncount = entityData.turncount;
	legacy.isStart = entityData.isStart;
	legacy.name = entityData.name;
	
	return legacy;
}

/**
 * Convert legacy Game class to GameEntity
 */
export function legacyGameToGameEntity(legacyGame: Game): GameEntity {
	const gameEntity = new GameEntity();
	
	// Copy properties
	gameEntity.setName(legacyGame.name);
	gameEntity.setDimensions(legacyGame.width, legacyGame.height);
	gameEntity.setWind([...legacyGame.wind]);
	gameEntity.setTurnCount(legacyGame.turncount);
	gameEntity.setIsStart(legacyGame.isStart);
	gameEntity.setCurrentStartPriority(legacyGame.currentStartPriority);
	gameEntity.setPlayers([...legacyGame.players]);
	
	// Convert marks
	gameEntity.setMarks(
		legacyGame.marks.map(m => 
			new MarkEntity(new Position(m.x, m.y), m.type)
		)
	);
	
	return gameEntity;
}

/**
 * Create a GameEntity from a wind scenario
 */
export function createGameEntityFromScenario(
	playerCount: number,
	windScenario: WindScenario,
	colors: string[],
	players: Boat[]
): GameEntity {
	const gameEntity = new GameEntity();
	
	// Create wind array
	const windArray = WindCalculationService.createWindFromScenario(windScenario);
	
	// Initialize from scenario (this will publish GameCreatedEvent)
	gameEntity.initializeFromScenario(windScenario, windArray);
	
	// Set players
	gameEntity.setPlayers(players);
	
	// Place boats on start
	gameEntity.placeBoatsOnStart();
	
	return gameEntity;
}

