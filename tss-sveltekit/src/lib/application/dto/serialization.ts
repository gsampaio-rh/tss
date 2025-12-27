/**
 * Serialization utilities for DTOs
 */

import type { GameDTO } from './GameDTO';
import type { BoatDTO } from './BoatDTO';
import type { WindScenarioDTO } from './WindScenarioDTO';

export class SerializationUtils {
	/**
	 * Serialize GameDTO to JSON string
	 */
	static serializeGame(gameDTO: GameDTO): string {
		return JSON.stringify(gameDTO, null, 2);
	}

	/**
	 * Deserialize JSON string to GameDTO
	 */
	static deserializeGame(json: string): GameDTO {
		return JSON.parse(json) as GameDTO;
	}

	/**
	 * Serialize BoatDTO to JSON string
	 */
	static serializeBoat(boatDTO: BoatDTO): string {
		return JSON.stringify(boatDTO, null, 2);
	}

	/**
	 * Deserialize JSON string to BoatDTO
	 */
	static deserializeBoat(json: string): BoatDTO {
		return JSON.parse(json) as BoatDTO;
	}

	/**
	 * Serialize WindScenarioDTO to JSON string
	 */
	static serializeWindScenario(scenarioDTO: WindScenarioDTO): string {
		return JSON.stringify(scenarioDTO, null, 2);
	}

	/**
	 * Deserialize JSON string to WindScenarioDTO
	 */
	static deserializeWindScenario(json: string): WindScenarioDTO {
		return JSON.parse(json) as WindScenarioDTO;
	}

	/**
	 * Serialize multiple boats to JSON array
	 */
	static serializeBoats(boats: BoatDTO[]): string {
		return JSON.stringify(boats, null, 2);
	}

	/**
	 * Deserialize JSON array to BoatDTO array
	 */
	static deserializeBoats(json: string): BoatDTO[] {
		return JSON.parse(json) as BoatDTO[];
	}
}

