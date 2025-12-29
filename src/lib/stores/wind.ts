import { writable } from 'svelte/store';
import type { WindScenario } from '../types/wind';
import { logger } from '../infrastructure/logging/logger';

export const windScenarios = writable<WindScenario[]>([]);
export const selectedWindIndex = writable<number>(0);

export const selectedWind = writable<WindScenario | null>(null);

// Derived store for current wind scenario
export const currentWindScenario = writable<WindScenario | null>(null);

// Initialize with default presets
export function initializeWindScenarios(): WindScenario[] {
	return [
		{
			name: 'Random',
			name_ru: 'Случайный',
			count: [4, 4, 4, 3, 3, 2, 2, 1, 1],
			wind: [0, 5, -5, 10, -10, 15, -15, 20, -20],
			israndom: true,
			stepscount: 50,
			width: 40,
			height: 30,
			maxwindsetting: 20,
			type: 'Presets',
			startsize: 15
		},
		{
			name: 'Pendulum',
			name_ru: 'Маятник',
			type: 'Presets',
			wind: [0, 5, 10, 5, 0, -5, -10, -15, -20, -15, -10, -5],
			width: 40,
			height: 30,
			stepscount: 50,
			startsize: 15
		},
		{
			name: 'Random Moscow',
			name_ru: 'Случайный Московский',
			count: [3, 3, 3, 3, 3, 3, 3, 3, 3],
			wind: [5, 10, 15, 20, 0, -5, -10, -15, -20],
			israndom: true,
			stepscount: 50,
			maxwindsetting: 20,
			width: 40,
			height: 30,
			type: 'Presets',
			startsize: 15
		},
		{
			name: 'static +5',
			name_ru: 'Статичный +5',
			type: 'Presets',
			wind: [5],
			width: 40,
			height: 30,
			stepscount: 50,
			startsize: 15
		}
	];
}

export const windActions = {
	loadScenarios: (scenarios: WindScenario[]) => {
		logger.info(
			'[windActions] loadScenarios called',
			'windActions',
			{ 
				scenariosCount: scenarios.length,
				scenarioNames: scenarios.map(s => s.name)
			}
		);
		windScenarios.set(scenarios);
		if (scenarios.length > 0) {
			logger.debug(
				'[windActions] Setting default selected scenario',
				'windActions',
				{ 
					defaultScenario: scenarios[0].name 
				}
			);
			selectedWind.set(scenarios[0]);
			currentWindScenario.set(scenarios[0]);
		} else {
			logger.warn('[windActions] No scenarios to load', 'windActions');
		}
	},

	selectWind: (index: number) => {
		logger.debug('[windActions] selectWind called', 'windActions', { index });
		windScenarios.update(scenarios => {
			logger.debug(
				'[windActions] Updating wind selection',
				'windActions',
				{ 
					index, 
					totalScenarios: scenarios.length,
					isValid: index >= 0 && index < scenarios.length
				}
			);
			if (index >= 0 && index < scenarios.length) {
				const selectedScenario = scenarios[index];
				logger.info(
					'[windActions] Selecting wind scenario',
					'windActions',
					{
						index,
						scenarioName: selectedScenario.name,
						scenarioType: selectedScenario.type
					}
				);
				selectedWindIndex.set(index);
				selectedWind.set(selectedScenario);
				currentWindScenario.set(selectedScenario);
				logger.debug('[windActions] Wind selection updated successfully', 'windActions');
			} else {
				logger.warn(
					'[windActions] Invalid wind index',
					'windActions',
					{ 
						index, 
						totalScenarios: scenarios.length 
					}
				);
			}
			return scenarios;
		});
	},

	addScenario: (scenario: WindScenario) => {
		windScenarios.update(scenarios => {
			const updated = [...scenarios, scenario];
			windScenarios.set(updated);
			return updated;
		});
	},

	updateScenario: (index: number, scenario: WindScenario) => {
		windScenarios.update(scenarios => {
			const updated = [...scenarios];
			updated[index] = scenario;
			windScenarios.set(updated);
			return updated;
		});
	},

	deleteScenario: (index: number) => {
		windScenarios.update(scenarios => {
			const updated = scenarios.filter((_, i) => i !== index);
			selectedWindIndex.update(current => {
				if (current >= updated.length) {
					return Math.max(0, updated.length - 1);
				}
				return current;
			});
			return updated;
		});
	}
};
