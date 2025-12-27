/**
 * Wind Scenario Service
 * Manages wind scenarios and presets
 */

import type { WindScenario, WindPreset } from '$lib/types/wind';
import { WindCalculationService } from '$lib/domain/services/WindCalculationService';

export class WindScenarioService {
	/**
	 * Create wind array from scenario
	 */
	static createWindFromScenario(windScenario: WindScenario): number[] {
		return WindCalculationService.createWindFromScenario(windScenario);
	}

	/**
	 * Create random wind array from scenario
	 */
	static createRandomWindFromScenario(windScenario: WindScenario): number[] {
		return WindCalculationService.createRandomWindFromScenario(windScenario);
	}

	/**
	 * Validate wind scenario
	 */
	static validateScenario(scenario: WindScenario): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!scenario.name || scenario.name.trim() === '') {
			errors.push('Scenario name is required');
		}

		if (!scenario.wind || scenario.wind.length === 0) {
			errors.push('Wind array cannot be empty');
		}

		if (scenario.width <= 0 || scenario.height <= 0) {
			errors.push('Width and height must be positive');
		}

		if (scenario.stepscount && scenario.stepscount <= 0) {
			errors.push('Steps count must be positive');
		}

		if (scenario.startsize && scenario.startsize <= 0) {
			errors.push('Start size must be positive');
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * Create a default wind scenario
	 */
	static createDefaultScenario(): WindScenario {
		return {
			name: 'Default',
			wind: [0],
			width: 50,
			height: 50,
			stepscount: 50,
			startsize: 15
		};
	}

	/**
	 * Clone a wind scenario
	 */
	static cloneScenario(scenario: WindScenario): WindScenario {
		return {
			...scenario,
			wind: [...scenario.wind]
		};
	}

	/**
	 * Set wind from scenario on a game object
	 */
	static setWindFromScenario(game: any, windScenario: WindScenario): void {
		if (windScenario.israndom) {
			const windArray = WindScenarioService.createRandomWindFromScenario(windScenario);
			game.wind = windArray;
		} else {
			const windArray = WindScenarioService.createWindFromScenario(windScenario);
			game.wind = windArray;
		}
		if (game.setMapData) {
			game.setMapData(windScenario);
		}
	}
}

