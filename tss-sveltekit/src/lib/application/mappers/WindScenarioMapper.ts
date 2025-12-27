/**
 * Wind Scenario Mapper
 * Converts between WindScenario entity and WindScenarioDTO
 */

import type { WindScenario, WindPreset } from '$lib/types/wind';
import type { WindScenarioDTO, WindPresetDTO } from '../dto/WindScenarioDTO';

export class WindScenarioMapper {
	/**
	 * Convert WindScenario to WindScenarioDTO
	 */
	static toDTO(scenario: WindScenario): WindScenarioDTO {
		return {
			name: scenario.name,
			nameRu: scenario.name_ru,
			wind: [...scenario.wind],
			width: scenario.width,
			height: scenario.height,
			stepscount: scenario.stepscount,
			startsize: scenario.startsize,
			israndom: scenario.israndom,
			count: scenario.count ? [...scenario.count] : undefined,
			maxwindsetting: scenario.maxwindsetting,
			type: scenario.type
		};
	}

	/**
	 * Convert WindScenarioDTO to WindScenario
	 */
	static fromDTO(dto: WindScenarioDTO): WindScenario {
		return {
			name: dto.name,
			name_ru: dto.nameRu,
			wind: [...dto.wind],
			width: dto.width,
			height: dto.height,
			stepscount: dto.stepscount,
			startsize: dto.startsize,
			israndom: dto.israndom,
			count: dto.count ? [...dto.count] : undefined,
			maxwindsetting: dto.maxwindsetting,
			type: dto.type
		};
	}

	/**
	 * Convert WindPreset to WindPresetDTO
	 */
	static presetToDTO(preset: WindPreset): WindPresetDTO {
		return {
			name: preset.name,
			nameRu: preset.name_ru,
			wind: [...preset.wind],
			width: preset.width,
			height: preset.height,
			stepscount: preset.stepscount,
			startsize: preset.startsize,
			israndom: preset.israndom,
			count: preset.count ? [...preset.count] : undefined,
			maxwindsetting: preset.maxwindsetting,
			type: preset.type
		};
	}

	/**
	 * Convert WindPresetDTO to WindPreset
	 */
	static presetFromDTO(dto: WindPresetDTO): WindPreset {
		return {
			name: dto.name,
			name_ru: dto.nameRu,
			wind: [...dto.wind],
			width: dto.width,
			height: dto.height,
			stepscount: dto.stepscount,
			startsize: dto.startsize,
			israndom: dto.israndom,
			count: dto.count ? [...dto.count] : undefined,
			maxwindsetting: dto.maxwindsetting,
			type: dto.type
		};
	}
}


