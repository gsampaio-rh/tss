/**
 * Dirty Air Service
 * Handles dirty air zone calculations and effects
 */

import { Position } from '../value-objects/Position';
import { Angle } from '../value-objects/Angle';
import { WindDirection } from '../value-objects/WindDirection';
import { TacticalAnalysisService } from './TacticalAnalysisService';
import type { Boat } from '../../types/boat';

export interface DirtyAirZoneResult {
	inZone: boolean;
	intensity: number;
}

export interface DirtyAirEffectResult {
	inDirtyAir: boolean;
	intensity: number;
	affectedBy: number[];
}

export class DirtyAirService {
	/**
	 * Check if a point is within a dirty air zone
	 */
	static isPointInDirtyAirZone(
		point: Position,
		sourceBoatPosition: Position,
		windDirection: WindDirection | Angle,
		zoneLength: number = 8,
		zoneWidthStart: number = 1.5,
		zoneWidthEnd: number = 4,
		angleSpread: number = 35
	): DirtyAirZoneResult {
		// Convert WindDirection to Angle if needed
		const windAngle = windDirection instanceof WindDirection ? windDirection.angle : windDirection;
		
		// Calculate leeward direction (opposite to wind)
		const leewardAngle = windAngle.add(Angle.fromDegrees(180));

		// Vector from source boat to point
		const dx = point.x - sourceBoatPosition.x;
		const dy = point.y - sourceBoatPosition.y;

		// Distance from source boat
		const dist = Math.sqrt(dx * dx + dy * dy);

		// If point is too far, it's not in the zone
		if (dist > zoneLength * 1.2) {
			return { inZone: false, intensity: 0 };
		}

		// Angle from source boat to point
		const pointAngle = Angle.fromRadians(Math.atan2(dx, -dy));
		const angleDiffValue = Math.abs(
			TacticalAnalysisService.angleDiff(pointAngle, leewardAngle)
		);

		// Check if point is within the angular spread
		if (angleDiffValue > angleSpread) {
			return { inZone: false, intensity: 0 };
		}

		// Calculate zone width at this distance
		const t = Math.min(dist / zoneLength, 1); // Normalized distance (0 to 1)
		const zoneWidth = zoneWidthStart + (zoneWidthEnd - zoneWidthStart) * t;

		// Check if point is within the width (perpendicular distance from center line)
		const centerLineAngle = leewardAngle;
		const perpAngle = centerLineAngle.add(Angle.fromDegrees(90));
		const perpRad = perpAngle.radians;

		// Project point onto perpendicular line
		const perpDist = Math.abs(dx * Math.sin(perpRad) - dy * Math.cos(perpRad));

		if (perpDist > zoneWidth / 2) {
			return { inZone: false, intensity: 0 };
		}

		// Calculate intensity based on distance and position
		// Closer to source boat = higher intensity
		// Closer to center line = higher intensity
		const distanceFactor = 1 - dist / zoneLength; // 1 at boat, 0 at end
		const centerFactor = 1 - perpDist / (zoneWidth / 2); // 1 at center, 0 at edge
		const intensity = Math.max(0, Math.min(1, distanceFactor * centerFactor));

		return { inZone: true, intensity };
	}

	/**
	 * Check if a boat is in dirty air from any other boat
	 * Returns the maximum intensity of dirty air affecting the boat
	 */
	static getDirtyAirEffect(
		boat: Boat,
		boatPosition: Position,
		allBoats: Boat[],
		windDirection: WindDirection | Angle
	): DirtyAirEffectResult {
		let maxIntensity = 0;
		const affectedBy: number[] = [];

		for (let i = 0; i < allBoats.length; i++) {
			const otherBoat = allBoats[i];

			// Skip self
			if (otherBoat === boat) continue;

			const otherBoatPosition = new Position(otherBoat.x, otherBoat.y);

			// Check leeward zone (main dirty air zone)
			const leewardCheck = DirtyAirService.isPointInDirtyAirZone(
				boatPosition,
				otherBoatPosition,
				windDirection,
				8, // zoneLength
				1.5, // zoneWidthStart
				4, // zoneWidthEnd
				35 // angleSpread
			);

			// Check windward zone (smaller, affects boats ahead)
			const windwardCheck = DirtyAirService.isPointInDirtyAirZone(
				boatPosition,
				otherBoatPosition,
				windDirection,
				3, // zoneLength (shorter)
				1, // zoneWidthStart
				2, // zoneWidthEnd
				25 // angleSpread (narrower)
			);

			const intensity = Math.max(leewardCheck.intensity, windwardCheck.intensity);

			if (leewardCheck.inZone || windwardCheck.inZone) {
				if (intensity > maxIntensity) {
					maxIntensity = intensity;
				}
				affectedBy.push(i);
			}
		}

		return {
			inDirtyAir: maxIntensity > 0,
			intensity: maxIntensity,
			affectedBy
		};
	}
}

