/**
 * Wind Scenario Data Transfer Object
 * Used for serialization and API communication
 */

export interface WindScenarioDTO {
	name: string;
	nameRu?: string;
	wind: number[];
	width: number;
	height: number;
	stepscount?: number;
	startsize?: number;
	israndom?: boolean;
	count?: number[];
	maxwindsetting?: number;
	type?: string;
}

export interface WindPresetDTO {
	name: string;
	nameRu?: string;
	wind: number[];
	width: number;
	height: number;
	stepscount: number;
	startsize: number;
	israndom?: boolean;
	count?: number[];
	maxwindsetting?: number;
	type?: string;
}

