/**
 * Game Repository Interface
 * Defines data access operations for Game entities
 */

import { GameEntity } from '../entities/Game';
import type { IRepository } from './IRepository';

/**
 * Repository interface for Game entities
 */
export interface IGameRepository extends IRepository<GameEntity, string> {
	/**
	 * Find games by name (partial match)
	 */
	findByName(name: string): Promise<GameEntity[]>;

	/**
	 * Find active games (not finished)
	 */
	findActive(): Promise<GameEntity[]>;

	/**
	 * Find finished games
	 */
	findFinished(): Promise<GameEntity[]>;

	/**
	 * Find games by wind scenario name
	 */
	findByWindScenario(scenarioName: string): Promise<GameEntity[]>;

	/**
	 * Find the most recent game
	 */
	findMostRecent(): Promise<GameEntity | null>;

	/**
	 * Delete all games
	 */
	deleteAll(): Promise<void>;
}

