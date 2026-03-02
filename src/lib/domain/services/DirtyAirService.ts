/**
 * Dirty Air Service
 * Handles dirty air zone calculations and effects
 */

import { Position } from '../value-objects/Position';
import { Angle } from '../value-objects/Angle';
import { WindDirection } from '../value-objects/WindDirection';
import { TacticalAnalysisService } from './TacticalAnalysisService';
import { DETECTION } from '../constants/dirtyAir';
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
	 * Check if a point is within the Blanket Zone (leeward, triangular)
	 * Based on reference diagrams: direct wind shadow of the sails
	 */
	static isPointInBlanketZone(
		point: Position,
		sourceBoatPosition: Position,
		windDirection: WindDirection | Angle
	): DirtyAirZoneResult {
		const windAngle = windDirection instanceof WindDirection ? windDirection.angle : windDirection;
		const leewardAngle = windAngle.add(Angle.fromDegrees(180));
		
		const dx = point.x - sourceBoatPosition.x;
		const dy = point.y - sourceBoatPosition.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		
		// Must be downwind
		const leewardRad = leewardAngle.radians;
		const downwindDist = dx * Math.sin(leewardRad) - dy * Math.cos(leewardRad);
		if (downwindDist < 0 || downwindDist > DETECTION.BLANKET_LENGTH) {
			return { inZone: false, intensity: 0 };
		}
		
		// Perpendicular distance (negative = leeward side)
		const perpRad = leewardRad + Math.PI / 2;
		const perpDist = dx * Math.sin(perpRad) - dy * Math.cos(perpRad);
		
		// Must be on leeward side (negative perpDist)
		if (perpDist > 0) {
			return { inZone: false, intensity: 0 };
		}
		
		// Triangular width at this distance
		const t = downwindDist / DETECTION.BLANKET_LENGTH;
		const halfWidth = (DETECTION.BLANKET_WIDTH_START + 
			(DETECTION.BLANKET_WIDTH_END - DETECTION.BLANKET_WIDTH_START) * t) / 2;
		
		if (Math.abs(perpDist) > halfWidth) {
			return { inZone: false, intensity: 0 };
		}
		
		// Angle check
		const pointAngle = Angle.fromRadians(Math.atan2(dx, -dy));
		const angleDiffValue = Math.abs(TacticalAnalysisService.angleDiff(pointAngle, leewardAngle));
		if (angleDiffValue > DETECTION.BLANKET_ANGLE_SPREAD) {
			return { inZone: false, intensity: 0 };
		}
		
		// Intensity: stronger near boat and center
		const distanceFactor = 1 - t;
		const centerFactor = 1 - Math.abs(perpDist) / halfWidth;
		const intensity = Math.max(0, Math.min(1, distanceFactor * centerFactor * 0.9));
		
		return { inZone: true, intensity };
	}

	/**
	 * Check if a point is within the Backwind Zone (windward, irregular/curved)
	 * Based on reference diagrams: deflection of wind by sails
	 */
	static isPointInBackwindZone(
		point: Position,
		sourceBoatPosition: Position,
		windDirection: WindDirection | Angle
	): DirtyAirZoneResult {
		const windAngle = windDirection instanceof WindDirection ? windDirection.angle : windDirection;
		const leewardAngle = windAngle.add(Angle.fromDegrees(180));
		
		const dx = point.x - sourceBoatPosition.x;
		const dy = point.y - sourceBoatPosition.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		
		// Must be downwind
		const leewardRad = leewardAngle.radians;
		const downwindDist = dx * Math.sin(leewardRad) - dy * Math.cos(leewardRad);
		if (downwindDist < 0 || downwindDist > DETECTION.BACKWIND_LENGTH) {
			return { inZone: false, intensity: 0 };
		}
		
		// Perpendicular distance (positive = windward side)
		const perpRad = leewardRad + Math.PI / 2;
		const perpDist = dx * Math.sin(perpRad) - dy * Math.cos(perpRad);
		
		// Must be on windward side (positive perpDist)
		if (perpDist < 0) {
			return { inZone: false, intensity: 0 };
		}
		
		// Irregular width with curvature
		const t = downwindDist / DETECTION.BACKWIND_LENGTH;
		const baseWidth = DETECTION.BACKWIND_WIDTH_START + 
			(DETECTION.BACKWIND_WIDTH_END - DETECTION.BACKWIND_WIDTH_START) * t;
		const curveOffset = Math.sin(t * Math.PI) * DETECTION.BACKWIND_CURVE_FACTOR * DETECTION.BACKWIND_WIDTH_END;
		const halfWidth = (baseWidth + curveOffset) / 2;
		
		if (perpDist > halfWidth) {
			return { inZone: false, intensity: 0 };
		}
		
		// Angle check (wider spread)
		const pointAngle = Angle.fromRadians(Math.atan2(dx, -dy));
		const windwardAngle = leewardAngle.add(Angle.fromDegrees(180));
		const angleDiffValue = Math.abs(TacticalAnalysisService.angleDiff(pointAngle, windwardAngle));
		if (angleDiffValue > DETECTION.BACKWIND_ANGLE_SPREAD) {
			return { inZone: false, intensity: 0 };
		}
		
		// Intensity: stronger at curved edges
		const distanceFactor = 1 - t;
		const centerFactor = 1 - perpDist / halfWidth;
		const edgeFactor = 1.0 + (curveOffset / baseWidth) * 0.2;
		const intensity = Math.max(0, Math.min(1, distanceFactor * centerFactor * edgeFactor));
		
		return { inZone: true, intensity };
	}

	/**
	 * Check if a point is within a dirty air zone (legacy method for compatibility)
	 * Now checks both blanket and backwind zones
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
		// Check both zones and return the maximum intensity
		const blanketCheck = DirtyAirService.isPointInBlanketZone(point, sourceBoatPosition, windDirection);
		const backwindCheck = DirtyAirService.isPointInBackwindZone(point, sourceBoatPosition, windDirection);
		
		if (blanketCheck.inZone || backwindCheck.inZone) {
			return {
				inZone: true,
				intensity: Math.max(blanketCheck.intensity, backwindCheck.intensity)
			};
		}
		
		return { inZone: false, intensity: 0 };
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

			// Check Blanket Zone (leeward, triangular)
			const blanketCheck = DirtyAirService.isPointInBlanketZone(
				boatPosition,
				otherBoatPosition,
				windDirection
			);

			// Check Backwind Zone (windward, irregular)
			const backwindCheck = DirtyAirService.isPointInBackwindZone(
				boatPosition,
				otherBoatPosition,
				windDirection
			);

			const intensity = Math.max(blanketCheck.intensity, backwindCheck.intensity);

			if (blanketCheck.inZone || backwindCheck.inZone) {
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

