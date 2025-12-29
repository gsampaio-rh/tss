/**
 * Boat Repository Interface
 * Defines data access operations for Boat entities
 * 
 * Note: Boats are typically managed as part of a Game aggregate,
 * but this interface provides direct boat access when needed
 */

import { BoatEntity } from '../entities/Boat';
import type { IRepository } from './IRepository';

/**
 * Repository interface for Boat entities
 */
export interface IBoatRepository extends IRepository<BoatEntity, string> {
	/**
	 * Find boats by game ID
	 */
	findByGameId(gameId: string): Promise<BoatEntity[]>;

	/**
	 * Find boats by color
	 */
	findByColor(color: string): Promise<BoatEntity[]>;

	/**
	 * Find finished boats
	 */
	findFinished(): Promise<BoatEntity[]>;

	/**
	 * Find active boats (not finished)
	 */
	findActive(): Promise<BoatEntity[]>;

	/**
	 * Find boats by name (partial match)
	 */
	findByName(name: string): Promise<BoatEntity[]>;

	/**
	 * Delete all boats for a specific game
	 */
	deleteByGameId(gameId: string): Promise<void>;
}

