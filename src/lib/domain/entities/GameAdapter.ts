/**
 * Game Adapter
 * Converts between GameEntity (domain) and Game (application data type)
 */

import { GameEntity } from './Game';
import { MarkEntity } from './Mark';
import { Position } from '../value-objects/Position';
import { Game } from '../../types/game';
import type { Boat } from '../../types/boat';
import type { WindScenario } from '../../types/wind';
import { WindCalculationService } from '../services/WindCalculationService';

/**
 * Convert GameEntity to Game data type
 * Converts domain entity to application data type for use in stores and services
 */
export function gameEntityToGame(gameEntity: GameEntity): Game {
	const game = new Game();
	const entityData = gameEntity.toGameData();
	
	// Copy all properties
	game.players = entityData.players;
	game.width = entityData.width;
	game.height = entityData.height;
	game.marks = entityData.marks;
	game.wind = entityData.wind;
	game.currentStartPriority = entityData.currentStartPriority;
	game.turncount = entityData.turncount;
	game.isStart = entityData.isStart;
	game.name = entityData.name;
	
	return game;
}

/**
 * Convert Game data type to GameEntity
 */
export function gameToGameEntity(gameData: Game): GameEntity {
	const gameEntity = new GameEntity();
	
	// Copy properties
	gameEntity.setName(gameData.name);
	gameEntity.setDimensions(gameData.width, gameData.height);
	gameEntity.setWind([...gameData.wind]);
	gameEntity.setTurnCount(gameData.turncount);
	gameEntity.setIsStart(gameData.isStart);
	gameEntity.setCurrentStartPriority(gameData.currentStartPriority);
	gameEntity.setPlayers([...gameData.players]);
	
	// Convert marks
	gameEntity.setMarks(
		gameData.marks.map(m => 
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

