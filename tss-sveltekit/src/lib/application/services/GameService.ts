/**
 * Game Service
 * 
 * Orchestrates game operations using domain services.
 * This is an application service that coordinates between the domain layer
 * and the presentation layer.
 * 
 * @module Application/Services
 */

import { GameEngineService } from '$lib/domain/services/GameEngineService';
import { WindCalculationService } from '$lib/domain/services/WindCalculationService';
import { GameEntity } from '$lib/domain/entities/Game';
import { gameEntityToLegacyGame } from '$lib/domain/entities/GameAdapter';
import { Game, COLORS } from '$lib/types/game';
import type { WindScenario } from '$lib/types/wind';
import { Boat } from '$lib/types/boat';
import { logger } from '$lib/infrastructure/logging/logger';

/**
 * Game Service
 * 
 * Provides high-level game operations by orchestrating domain services.
 * Converts between domain entities (GameEntity) and legacy Game objects
 * for backward compatibility.
 */
export class GameService {
	/**
	 * Create a new game from a wind scenario
	 * 
	 * Creates a GameEntity, initializes it with the wind scenario,
	 * creates initial players, places boats on the start line, and
	 * converts to legacy Game format for backward compatibility.
	 * 
	 * @param playerCount - Number of players to create (default: 2)
	 * @param windScenario - Wind scenario to use for the game
	 * @param colors - Array of color names to assign to players
	 * @returns A new Game instance ready to play
	 * 
	 * @example
	 * ```typescript
	 * const windScenario = { name: 'Pendulum', wind: [0, 5, 10, ...] };
	 * const game = GameService.createGame(2, windScenario);
	 * ```
	 */
	static createGame(
		playerCount: number,
		windScenario: WindScenario,
		colors: string[] = []
	): Game {
		logger.info(
			'[GameService] createGame called',
			'GameService',
			{
				playerCount,
				scenarioName: windScenario.name,
				scenarioWidth: windScenario.width,
				scenarioHeight: windScenario.height,
				colorsAvailable: colors.length
			}
		);

		logger.debug('[GameService] Creating new GameEntity', 'GameService');
		const gameEntity = new GameEntity();
		
		// Create wind array
		const windArray = WindCalculationService.createWindFromScenario(windScenario);
		
		// Initialize game entity from scenario (this publishes GameCreatedEvent)
		gameEntity.initializeFromScenario(windScenario, windArray);
		
		logger.debug(
			'[GameService] GameEntity initialized',
			'GameService',
			{
				gameId: gameEntity.id,
				gameName: gameEntity.name,
				gameWidth: gameEntity.width,
				gameHeight: gameEntity.height,
				marksCount: gameEntity.marks.length,
				windArrayLength: gameEntity.wind.length
			}
		);

		logger.debug('[GameService] Creating initial players', 'GameService', { playerCount });
		// Create initial players
		const players: Boat[] = [];
		for (let i = 0; i < playerCount; i++) {
			// Find a color that hasn't been used yet in the players array we're building
			let color: string | null = null;
			for (const availableColor of colors) {
				if (!players.find(p => p.color === availableColor)) {
					color = availableColor;
					break;
				}
			}
			// Fallback to cycling through colors if all are used
			if (!color) {
				color = colors[i % colors.length];
			}
			logger.debug(
				'[GameService] Creating player',
				'GameService',
				{ index: i, color, name: `Player ${i + 1}` }
			);
			const boat = new Boat(0, 0, false, color);
			boat.name = `Player ${i + 1}`;
			boat.startPos = 1; // Middle
			boat.startPriority = i;
			players.push(boat);
		}
		
		// Set players on game entity
		gameEntity.setPlayers(players);
		
		logger.debug(
			'[GameService] Players created',
			'GameService',
			{
				playersCount: players.length,
				players: players.map(p => ({ name: p.name, color: p.color, startPos: p.startPos }))
			}
		);

		logger.debug('[GameService] Placing boats on start line', 'GameService');
		gameEntity.placeBoatsOnStart();
		logger.debug(
			'[GameService] Boats placed',
			'GameService',
			{
				boats: players.map(p => ({ name: p.name, x: p.x, y: p.y }))
			}
		);
		
		// Convert to legacy Game format for backward compatibility
		const legacyGame = gameEntityToLegacyGame(gameEntity);
		
		logger.info(
			'[GameService] Game created successfully',
			'GameService',
			{
				gameId: gameEntity.id,
				gameName: legacyGame.name,
				playersCount: legacyGame.players.length,
				gameWidth: legacyGame.width,
				gameHeight: legacyGame.height
			}
		);
		
		return legacyGame;
	}

	/**
	 * Execute a game turn
	 */
	static executeTurn(game: Game, enableDirtyAirEffects: boolean = false): void {
		GameEngineService.executeTurn(game, enableDirtyAirEffects);
	}

	/**
	 * Undo last turn
	 */
	static backTurn(game: Game): void {
		GameEngineService.backTurn(game);
	}

	/**
	 * Reset game to start
	 */
	static resetToStart(game: Game): void {
		GameEngineService.resetToStart(game);
	}

	/**
	 * Get current game state summary
	 */
	static getGameState(game: Game) {
		return GameEngineService.getGameState(game);
	}

	/**
	 * Check if game is finished
	 */
	static isGameFinished(game: Game): boolean {
		return GameEngineService.isGameFinished(game);
	}

	/**
	 * Set wind from scenario
	 */
	static setWindFromScenario(game: Game, windScenario: WindScenario): void {
		const windArray = WindCalculationService.createWindFromScenario(windScenario);
		game.wind = windArray;
		game.setMapData(windScenario);
	}

	/**
	 * Set random wind from scenario
	 */
	static setRandomWindFromScenario(game: Game, windScenario: WindScenario): void {
		const windArray = WindCalculationService.createRandomWindFromScenario(windScenario);
		game.wind = windArray;
		game.setMapData(windScenario);
	}

	/**
	 * Get wind direction for current turn
	 */
	static getCurrentWind(game: Game): number {
		return game.getWind(game.turncount);
	}

	/**
	 * Get wind direction for a specific turn
	 */
	static getWindForTurn(game: Game, turnIndex: number): number {
		return game.getWind(turnIndex);
	}
}

