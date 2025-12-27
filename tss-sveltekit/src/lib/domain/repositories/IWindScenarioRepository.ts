/**
 * Wind Scenario Repository Interface
 * Defines data access operations for Wind Scenarios
 * 
 * Wind scenarios are typically read-only presets, so this extends
 * IReadOnlyRepository, but includes save for custom scenarios
 */

import type { WindScenario } from '../../types/wind';
import type { IReadOnlyRepository } from './IRepository';

/**
 * Repository interface for Wind Scenario entities
 */
export interface IWindScenarioRepository extends IReadOnlyRepository<WindScenario, string> {
	/**
	 * Find scenario by name (exact match)
	 */
	findByName(name: string): Promise<WindScenario | null>;

	/**
	 * Find scenarios by type
	 */
	findByType(type: string): Promise<WindScenario[]>;

	/**
	 * Find all preset scenarios
	 */
	findPresets(): Promise<WindScenario[]>;

	/**
	 * Find all custom scenarios
	 */
	findCustom(): Promise<WindScenario[]>;

	/**
	 * Save a custom scenario (create or update)
	 */
	save(scenario: WindScenario): Promise<WindScenario>;

	/**
	 * Delete a custom scenario
	 */
	delete(id: string): Promise<void>;
}

