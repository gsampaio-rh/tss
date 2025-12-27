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
	 */
	static createWindFromScenario(windscenario: WindScenario): number[] {
		const wind: number[] = [];
		const stepscount = windscenario.stepscount || 50;
		const firstWindValue = windscenario.wind.length > 0 ? windscenario.wind[0] : 0;

		// First turn always has wind = 0
		wind[0] = 0;

		// Subsequent turns use relative shifts from the scenario
		for (let i = 1; i < stepscount; i++) {
			const scenarioIndex = i % windscenario.wind.length;
			const scenarioWind = windscenario.wind[scenarioIndex];
			// Calculate relative shift from first value
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


