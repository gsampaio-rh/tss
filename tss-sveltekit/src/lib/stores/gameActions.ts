/**
 * Game Actions - Delegates to Application Services
 * Thin action layer that delegates business logic to services
 */

import { get } from 'svelte/store';
import { game, players, turnCount, isStart, currentWindScenario } from './gameStore';
import { GameService } from '$lib/application/services/GameService';
import { PlayerService } from '$lib/application/services/PlayerService';
import { WindScenarioService } from '$lib/application/services/WindScenarioService';
import { gameLogs } from './gameLogs';
import { settings } from './settings';
import { COLORS } from '$lib/types/game';
import type { WindScenario } from '$lib/types/wind';
import { executeBoatTurn } from '$lib/utils/gameLogic';
import { TurnType } from '$lib/types/game';
import { logger } from '$lib/infrastructure/logging/logger';

export const gameActions = {
	/**
	 * Create a new game
	 */
	createGame: (playercount: number, windscenario: WindScenario, colors: string[] = COLORS) => {
		logger.info(
			'[gameActions] createGame called',
			'gameActions',
			{ 
				playerCount: playercount, 
				scenarioName: windscenario.name,
				scenarioType: windscenario.type,
				colorsCount: colors.length
			}
		);
		try {
			logger.debug('[gameActions] Calling GameService.createGame', 'gameActions');
			const newGame = GameService.createGame(playercount, windscenario, colors);
			logger.debug(
				'[gameActions] GameService.createGame completed',
				'gameActions',
				{
					gameName: newGame.name,
					gameWidth: newGame.width,
					gameHeight: newGame.height,
					playersCount: newGame.players?.length,
					windArrayLength: newGame.wind?.length
				}
			);
			
			logger.debug('[gameActions] Updating stores', 'gameActions');
			game.set(newGame);
			players.set(newGame.players);
			isStart.set(true);
			turnCount.set(0);
			currentWindScenario.set(windscenario);
			logger.debug('[gameActions] Stores updated', 'gameActions');

			// Start logging
			logger.debug('[gameActions] Starting game logs', 'gameActions');
			gameLogs.startLog(
				newGame.name || windscenario.name || 'Untitled Game',
				windscenario,
				newGame.players,
				newGame.width,
				newGame.height
			);
			logger.debug('[gameActions] Game logs started', 'gameActions');

			logger.info(
				'[gameActions] Game created successfully',
				'gameActions',
				{ 
					playerCount: playercount, 
					scenario: windscenario.name,
					gameName: newGame.name,
					playersCount: newGame.players.length
				}
			);
		} catch (error) {
			logger.error(
				'[gameActions] Failed to create game',
				error instanceof Error ? error : new Error(String(error)),
				'gameActions',
				{ 
					playercount, 
					scenario: windscenario.name
				}
			);
			throw error;
		}
	},

	/**
	 * Add a new player
	 */
	addPlayer: (colors: string[] = COLORS) => {
		const currentGame = get(game);
		if (!currentGame) return;

		try {
			const color = currentGame.findFreeColor(colors);
			if (!color) {
				logger.warn('Cannot add player: no free colors available', 'gameActions');
				return;
			}

			const newBoat = PlayerService.createPlayer(
				6,
				currentGame.height - 2,
				false,
				color,
				`Player ${currentGame.players.length + 1}`
			);
			newBoat.startPos = 1; // Default to middle
			newBoat.startPriority = currentGame.currentStartPriority++;

			currentGame.players.push(newBoat);
			currentGame.placeBoatsOnStart();

			game.set(currentGame);
			players.set(currentGame.players);
			logger.info('Player added', 'gameActions', { playerName: newBoat.name });
		} catch (error) {
			logger.error(
				'Failed to add player',
				error instanceof Error ? error : new Error(String(error)),
				'gameActions'
			);
			throw error;
		}
	},

	/**
	 * Update start position preference
	 */
	updateStartPriority: (playerIndex: number, startPos: number) => {
		const currentGame = get(game);
		if (!currentGame) return;

		const player = currentGame.players[playerIndex];
		if (!player) return;

		try {
			if (player.startPos !== startPos) {
				PlayerService.updateStartPosition(player, startPos);
				player.startPriority = currentGame.currentStartPriority++;
				// Clear custom position when changing startPos via buttons
				player.customStartX = undefined;
				currentGame.placeBoatsOnStart();

				game.set(currentGame);
				players.set(currentGame.players);
				logger.debug('Start priority updated', 'gameActions', { playerIndex, startPos });
			}
		} catch (error) {
			logger.error(
				'Failed to update start priority',
				error instanceof Error ? error : new Error(String(error)),
				'gameActions',
				{ playerIndex, startPos }
			);
			throw error;
		}
	},

	/**
	 * Update start position (drag-and-drop)
	 */
	updateStartPosition: (playerIndex: number, x: number) => {
		const currentGame = get(game);
		if (!currentGame || currentGame.isStart === false) return;

		const player = currentGame.players[playerIndex];
		if (!player) return;

		try {
			// Constrain X to be between the start marks
			const startMark1 = currentGame.marks[0];
			const startMark2 = currentGame.marks[1];
			if (!startMark1 || !startMark2) return;

			const minX = Math.min(startMark1.x, startMark2.x) + 0.5;
			const maxX = Math.max(startMark1.x, startMark2.x) - 0.5;
			const constrainedX = Math.max(minX, Math.min(maxX, x));

			PlayerService.setCustomStartX(player, constrainedX);
			player.x = constrainedX;
			player.y = currentGame.height - 2; // Keep on start line
			player.startPriority = currentGame.currentStartPriority++;

			// Re-position all boats (will preserve custom positions)
			currentGame.placeBoatsOnStart();

			game.set(currentGame);
			players.set(currentGame.players);
			logger.debug('Start position updated', 'gameActions', { playerIndex, x: constrainedX });
		} catch (error) {
			logger.error(
				'Failed to update start position',
				error instanceof Error ? error : new Error(String(error)),
				'gameActions',
				{ playerIndex, x }
			);
			throw error;
		}
	},

	/**
	 * Apply start (begin race)
	 */
	applyStart: () => {
		const currentGame = get(game);
		if (!currentGame) {
			logger.warn('[gameActions] Cannot start race: no game exists', 'gameActions');
			return;
		}

		try {
			logger.info(
				'[gameActions] Starting race',
				'gameActions',
				{
					playersCount: currentGame.players.length,
					currentIsStart: currentGame.isStart
				}
			);

			// Apply names and start positions
			for (const player of currentGame.players) {
				if (!player.name) {
					const index = currentGame.players.indexOf(player);
					player.name = `Player ${index + 1}`;
				}
				logger.debug('[gameActions] Applying player', 'gameActions', { playerName: player.name });
				player.apply();
			}

			currentGame.isStart = false;
			isStart.set(false);
			game.set(currentGame);
			players.set([...currentGame.players]); // Update players store to trigger reactivity
			
			logger.info(
				'[gameActions] Race started successfully',
				'gameActions',
				{
					isStart: currentGame.isStart,
					storeIsStart: get(isStart)
				}
			);
		} catch (error) {
			logger.error(
				'[gameActions] Failed to start race',
				error instanceof Error ? error : new Error(String(error)),
				'gameActions'
			);
			throw error;
		}
	},

	/**
	 * Remove a player
	 */
	removePlayer: (index: number) => {
		const currentGame = get(game);
		if (!currentGame) return;

		try {
			currentGame.players.splice(index, 1);
			currentGame.placeBoatsOnStart();

			game.set(currentGame);
			players.set(currentGame.players);
			logger.info('Player removed', 'gameActions', { index });
		} catch (error) {
			logger.error(
				'Failed to remove player',
				error instanceof Error ? error : new Error(String(error)),
				'gameActions',
				{ index }
			);
			throw error;
		}
	},

	/**
	 * Execute a turn
	 */
	turn: () => {
		const currentGame = get(game);
		if (!currentGame || currentGame.isStart) {
			logger.debug('Cannot turn - game is still in start phase', 'gameActions');
			return;
		}

		try {
			logger.info(`Executing turn ${currentGame.turncount + 1}`, 'gameActions');

			// Get current settings to check if dirty air effects are enabled
			const enableDirtyAirEffects = get(settings).enableDirtyAirEffects;

			// Execute turn using service
			GameService.executeTurn(currentGame, enableDirtyAirEffects);

			// Update stores
			players.set([...currentGame.players]); // Create new array reference for reactivity
			turnCount.set(currentGame.turncount);

			// Log this turn
			const currentWind = currentGame.getWind(currentGame.turncount);
			gameLogs.logTurn(currentGame.turncount, currentWind, currentGame.players);

			logger.info(`Turn ${currentGame.turncount} completed`, 'gameActions');
		} catch (error) {
			logger.error(
				'Failed to execute turn',
				error instanceof Error ? error : new Error(String(error)),
				'gameActions'
			);
			throw error;
		}
	},

	/**
	 * Undo last turn
	 */
	backTurn: () => {
		const currentGame = get(game);
		if (!currentGame) return;

		try {
			if (currentGame.turncount > 0) {
				GameService.backTurn(currentGame);

				players.set(currentGame.players);
				turnCount.set(currentGame.turncount);
				logger.info(`Reverted to turn ${currentGame.turncount}`, 'gameActions');
			} else {
				currentGame.isStart = true;
				isStart.set(true);
				game.set(currentGame);
				logger.info('Reverted to start phase', 'gameActions');
			}
		} catch (error) {
			logger.error(
				'Failed to revert turn',
				error instanceof Error ? error : new Error(String(error)),
				'gameActions'
			);
			throw error;
		}
	},

	/**
	 * Reset game to start
	 */
	reset: (addToCup: boolean = false) => {
		const currentGame = get(game);
		if (!currentGame) return;

		try {
			currentGame.turncount = 0;
			currentGame.isStart = true;

			for (const player of currentGame.players) {
				player.tack = false;
				player.rotation = -45;
				player.turns = [];
				player.isStart = true;
				player.finished = false;
				player.startPos = 1;
				player.startPriority = currentGame.currentStartPriority++;
			}

			currentGame.placeBoatsOnStart();

			turnCount.set(0);
			isStart.set(true);
			game.set(currentGame);
			players.set(currentGame.players);

			// TODO: Handle addToCup
			logger.info('Game reset to start', 'gameActions');
		} catch (error) {
			logger.error(
				'Failed to reset game',
				error instanceof Error ? error : new Error(String(error)),
				'gameActions'
			);
			throw error;
		}
	},

	/**
	 * Start race (alias for applyStart)
	 */
	startRace: () => {
		gameActions.applyStart();
	},

	/**
	 * Change wind scenario
	 */
	changeWind: (windscenario: WindScenario) => {
		const currentGame = get(game);
		if (!currentGame) return;

		try {
			WindScenarioService.setWindFromScenario(currentGame, windscenario);

			// Reset player positions
			for (const player of currentGame.players) {
				player.y = currentGame.height - 2;
			}
			currentGame.placeBoatsOnStart();

			currentWindScenario.set(windscenario);
			game.set(currentGame);
			players.set(currentGame.players);
			logger.info('Wind scenario changed', 'gameActions', { scenario: windscenario.name });
		} catch (error) {
			logger.error(
				'Failed to change wind scenario',
				error instanceof Error ? error : new Error(String(error)),
				'gameActions',
				{ scenario: windscenario.name }
			);
			throw error;
		}
	}
};

