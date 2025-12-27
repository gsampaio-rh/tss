/**
 * Tactical Insights Service
 * Provides tactical analysis and insights for players
 */

import { TacticalAnalysisService } from '$lib/domain/services/TacticalAnalysisService';
import { NavigationService } from '$lib/domain/services/NavigationService';
import { DirtyAirService } from '$lib/domain/services/DirtyAirService';
import { Position } from '$lib/domain/value-objects/Position';
import { Angle } from '$lib/domain/value-objects/Angle';
import { WindDirection } from '$lib/domain/value-objects/WindDirection';
import type { Boat } from '$lib/types/boat';
import type { Game } from '$lib/types/game';

export interface TacticalInsight {
	boatId: string;
	boatName: string;
	atw: number; // Angle to wind
	vmg: number; // Velocity made good
	vmgEfficiency: number; // VMG efficiency percentage
	liftHeader: {
		isLift: boolean;
		isHeader: boolean;
		errorChange: number;
	};
	targetHeading: number;
	currentHeading: number;
	speed: number;
	mode: 'upwind' | 'downwind';
	tack: 'port' | 'starboard';
	dirtyAir: {
		inDirtyAir: boolean;
		intensity: number;
	};
}

export class TacticalInsightsService {
	/**
	 * Get tactical insights for a boat
	 */
	static getTacticalInsight(
		boat: Boat,
		game: Game,
		turnIndex: number
	): TacticalInsight {
		const boatPosition = new Position(boat.x, boat.y);
		const markPosition = new Position(game.marks[2].x, game.marks[2].y);
		const currentWind = Angle.fromDegrees(game.getWind(turnIndex));
		const windDirection = WindDirection.fromDegrees(game.getWind(turnIndex));
		const boatHeading = Angle.fromDegrees(boat.rotation);

		// Calculate ATW (Angle to Wind)
		const atw = Math.abs(TacticalAnalysisService.angleDiff(windDirection.angle, boatHeading));

		// Calculate VMG
		const vmg = TacticalAnalysisService.calculateVMG(
			boatPosition,
			markPosition,
			1.0, // Assuming base speed of 1.0
			boatHeading
		);

		// Calculate VMG efficiency
		const vmgEfficiency = TacticalAnalysisService.calculateVMGEfficiency(
			boatPosition,
			markPosition,
			1.0,
			boatHeading
		);

		// Calculate Lift/Header
		const previousWind = turnIndex > 0 
			? Angle.fromDegrees(game.getWind(turnIndex - 1))
			: currentWind;
		
		const liftHeader = TacticalAnalysisService.calculateLiftHeader(
			boatPosition,
			markPosition,
			boat.tack,
			previousWind,
			currentWind,
			true // Assuming upwind
		);

		// Get optimal heading
		const optimalHeading = TacticalAnalysisService.getOptimalHeading(
			boat.tack,
			currentWind,
			true // Assuming upwind
		);

		// Check dirty air
		const dirtyAirEffect = DirtyAirService.getDirtyAirEffect(
			boat,
			boatPosition,
			game.players,
			windDirection
		);

		return {
			boatId: boat.name, // Using name as ID for now
			boatName: boat.name,
			atw,
			vmg,
			vmgEfficiency: vmgEfficiency * 100, // Convert to percentage
			liftHeader: {
				isLift: liftHeader.isLift,
				isHeader: liftHeader.isHeader,
				errorChange: liftHeader.errorChange
			},
			targetHeading: optimalHeading.degrees,
			currentHeading: boatHeading.degrees,
			speed: 1.0, // Base speed
			mode: 'upwind', // Could be calculated based on position relative to mark
			tack: boat.tack ? 'port' : 'starboard',
			dirtyAir: {
				inDirtyAir: dirtyAirEffect.inDirtyAir,
				intensity: dirtyAirEffect.intensity
			}
		};
	}

	/**
	 * Get tactical insights for all boats
	 */
	static getAllTacticalInsights(game: Game, turnIndex: number): TacticalInsight[] {
		return game.players.map(boat => 
			TacticalInsightsService.getTacticalInsight(boat, game, turnIndex)
		);
	}
}

