/**
 * DTO Validators
 * Validation functions for DTOs
 */

import type { GameDTO } from './GameDTO';
import type { BoatDTO } from './BoatDTO';
import type { WindScenarioDTO } from './WindScenarioDTO';

export class DTOValidators {
	/**
	 * Validate GameDTO
	 */
	static validateGameDTO(dto: GameDTO): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!dto.name || dto.name.trim() === '') {
			errors.push('Game name is required');
		}

		if (dto.width <= 0 || dto.height <= 0) {
			errors.push('Width and height must be positive');
		}

		if (!dto.marks || dto.marks.length === 0) {
			errors.push('At least one mark is required');
		}

		if (!dto.wind || dto.wind.length === 0) {
			errors.push('Wind array cannot be empty');
		}

		if (dto.turnCount < 0) {
			errors.push('Turn count cannot be negative');
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * Validate BoatDTO
	 */
	static validateBoatDTO(dto: BoatDTO): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!dto.name || dto.name.trim() === '') {
			errors.push('Boat name is required');
		}

		if (!dto.color || dto.color.trim() === '') {
			errors.push('Boat color is required');
		}

		if (!Number.isFinite(dto.x) || !Number.isFinite(dto.y)) {
			errors.push('Boat position must be finite numbers');
		}

		if (!Number.isFinite(dto.rotation)) {
			errors.push('Boat rotation must be a finite number');
		}

		if (dto.startPos < 0 || dto.startPos > 2) {
			errors.push('Start position must be 0, 1, or 2');
		}

		if (dto.startPriority < 0) {
			errors.push('Start priority cannot be negative');
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * Validate WindScenarioDTO
	 */
	static validateWindScenarioDTO(dto: WindScenarioDTO): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!dto.name || dto.name.trim() === '') {
			errors.push('Scenario name is required');
		}

		if (!dto.wind || dto.wind.length === 0) {
			errors.push('Wind array cannot be empty');
		}

		if (dto.width <= 0 || dto.height <= 0) {
			errors.push('Width and height must be positive');
		}

		if (dto.stepscount && dto.stepscount <= 0) {
			errors.push('Steps count must be positive');
		}

		if (dto.startsize && dto.startsize <= 0) {
			errors.push('Start size must be positive');
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}
}

