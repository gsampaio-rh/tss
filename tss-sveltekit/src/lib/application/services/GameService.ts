/**
 * Game Service
 * Orchestrates game operations using domain services
 */

import { GameEngineService } from '$lib/domain/services/GameEngineService';
import { WindCalculationService } from '$lib/domain/services/WindCalculationService';
import { Game, COLORS } from '$lib/types/game';
import type { WindScenario } from '$lib/types/wind';
import { Boat } from '$lib/types/boat';
import { logger } from '$lib/infrastructure/logging/logger';

export class GameService {
	/**
	 * Create a new game from a wind scenario
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

		logger.debug('[GameService] Creating new Game instance', 'GameService');
		const game = new Game();
		game.players = [];
		
		logger.debug('[GameService] Setting wind from scenario', 'GameService');
		game.setWindFromScenario(windScenario);
		logger.debug(
			'[GameService] Wind set',
			'GameService',
			{
				windArrayLength: game.wind?.length,
				firstWindValue: game.wind?.[0],
				gameWidth: game.width,
				gameHeight: game.height,
				marksCount: game.marks?.length
			}
		);
		
		game.name = windScenario.name;
		game.currentStartPriority = 0;
		logger.debug(
			'[GameService] Game initialized',
			'GameService',
			{
				gameName: game.name,
				currentStartPriority: game.currentStartPriority
			}
		);

		logger.debug('[GameService] Creating initial players', 'GameService', { playerCount });
		// Create initial players
		for (let i = 0; i < playerCount; i++) {
			const color = game.findFreeColor(colors) || colors[i % colors.length];
			logger.debug(
				'[GameService] Creating player',
				'GameService',
				{ index: i, color, name: `Player ${i + 1}` }
			);
			const boat = new Boat(0, 0, false, color);
			boat.name = `Player ${i + 1}`;
			boat.startPos = 1; // Middle
			boat.startPriority = i;
			game.players.push(boat);
		}
		logger.debug(
			'[GameService] Players created',
			'GameService',
			{
				playersCount: game.players.length,
				players: game.players.map(p => ({ name: p.name, color: p.color, startPos: p.startPos }))
			}
		);

		logger.debug('[GameService] Placing boats on start line', 'GameService');
		game.placeBoatsOnStart();
		logger.debug(
			'[GameService] Boats placed',
			'GameService',
			{
				boats: game.players.map(p => ({ name: p.name, x: p.x, y: p.y }))
			}
		);
		
		logger.info(
			'[GameService] Game created successfully',
			'GameService',
			{
				gameName: game.name,
				playersCount: game.players.length,
				gameWidth: game.width,
				gameHeight: game.height
			}
		);
		
		return game;
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

