/**
 * useWind Hook
 * Provides wind operations
 */

import { get } from 'svelte/store';
import { game, currentWind, previousWind } from '$lib/stores/game';
import { WindScenarioService } from '$lib/application/services/WindScenarioService';
import { WindCalculationService } from '$lib/domain/services/WindCalculationService';
import type { WindScenario } from '$lib/types/wind';

export function useWind() {
	return {
		// State
		get currentWind() {
			return get(currentWind);
		},
		get previousWind() {
			return get(previousWind);
		},

		// Calculate wind shift
		get windShift(): number {
			return this.currentWind - this.previousWind;
		},

		// Set wind from scenario
		setWindFromScenario(windScenario: WindScenario) {
			const currentGame = get(game);
			if (!currentGame) return;
			WindScenarioService.createWindFromScenario(windScenario);
			currentGame.setWindFromScenario(windScenario);
			game.set(currentGame);
		},

		// Validate scenario
		validateScenario(scenario: WindScenario) {
			return WindScenarioService.validateScenario(scenario);
		},

		// Get wind direction for turn
		getWindForTurn(turnIndex: number) {
			const currentGame = get(game);
			if (!currentGame) return 0;
			return WindCalculationService.getWindDirection(currentGame.wind, turnIndex);
		}
	};
}


