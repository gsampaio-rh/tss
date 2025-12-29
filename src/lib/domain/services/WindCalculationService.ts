/**
 * Wind Calculation Service
 * Handles wind-related calculations and transformations
 */

import { WindDirection } from '../value-objects/WindDirection';
import { Angle } from '../value-objects/Angle';
import type { WindScenario } from '../../types/wind';

export class WindCalculationService {
	/**
	 * Convert wind direction from internal format to display format
	 * Internal: 0-180 degrees (half circle)
	 * Display: 0-360 degrees (full circle)
	 */
	static toDisplayAngle(internalAngle: number): number {
		return internalAngle * 2;
	}

	/**
	 * Convert wind direction from display format to internal format
	 */
	static fromDisplayAngle(displayAngle: number): number {
		return displayAngle / 2;
	}

	/**
	 * Create wind array from scenario
	 * Wind always starts at 0 degrees
	 * Preserves the relative pattern of the scenario
	 */
	static createWindFromScenario(windscenario: WindScenario): number[] {
		const wind: number[] = [];
		const stepscount = windscenario.stepscount || 50;
		
		if (windscenario.wind.length === 0) {
			// No wind values, return all zeros
			return new Array(stepscount).fill(0);
		}

		// First turn always has wind = 0
		wind[0] = 0;

		// Handle single-value scenarios (static wind)
		// For "static +5" with wind=[5], we want all turns to be +5, not 0
		if (windscenario.wind.length === 1) {
			const staticValue = windscenario.wind[0];
			// If the static value is 0, all turns stay 0
			// Otherwise, apply the offset starting from turn 1
			for (let i = 1; i < stepscount; i++) {
				wind[i] = staticValue;
			}
			return wind;
		}

		// Multi-value scenarios: preserve the pattern relative to first value
		const firstWindValue = windscenario.wind[0];
		for (let i = 1; i < stepscount; i++) {
			// Use (i-1) to start from scenario index 0 for turn 1
			const scenarioIndex = (i - 1) % windscenario.wind.length;
			const scenarioWind = windscenario.wind[scenarioIndex];
			// Calculate relative shift from first value
			// This ensures wind always starts at 0, but preserves the pattern
			wind[i] = scenarioWind - firstWindValue;
		}

		return wind;
	}

	/**
	 * Create random wind array from scenario
	 */
	static createRandomWindFromScenario(windscenario: WindScenario): number[] {
		const wind: number[] = [];
		const firstWindValue = windscenario.wind.length > 0 ? windscenario.wind[0] : 0;

		// First turn always has wind = 0
		wind.push(0);

		if (!windscenario.count) {
			return wind;
		}

		while (wind.length < 50) {
			const cards: number[] = [];
			for (let i = 0; i < windscenario.count.length; i++) {
				for (let j = 0; j < windscenario.count[i]; j++) {
					cards.push(windscenario.wind[i]);
				}
			}
			while (cards.length > 0 && wind.length < 50) {
				const index = Math.floor(Math.random() * cards.length);
				const scenarioWind = cards[index];
				// Calculate relative shift from first value
				wind.push(scenarioWind - firstWindValue);
				cards.splice(index, 1);
			}
		}

		return wind;
	}

	/**
	 * Get wind direction for a specific turn
	 */
	static getWindDirection(windArray: number[], turnIndex: number): WindDirection {
		const windValue = windArray[turnIndex % windArray.length];
		return WindDirection.fromDegrees(windValue);
	}

	/**
	 * Calculate wind shift between two turns
	 */
	static calculateWindShift(
		windArray: number[],
		turnIndex1: number,
		turnIndex2: number
	): number {
		const wind1 = windArray[turnIndex1 % windArray.length];
		const wind2 = windArray[turnIndex2 % windArray.length];
		return wind2 - wind1;
	}
}


