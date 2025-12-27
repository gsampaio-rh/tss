/**
 * Tactical Analysis Service
 * Handles tactical calculations: VMG, Lift/Header, optimal headings
 */

import { Angle } from '../value-objects/Angle';
import { Position } from '../value-objects/Position';
import { NavigationService } from './NavigationService';

// Constants for polar model
export const OPT_UPWIND_ANGLE = 45; // Optimal upwind angle (degrees)
export const OPT_DOWNWIND_ANGLE = 155; // Optimal downwind angle (degrees)

export interface LiftHeaderResult {
	isLift: boolean;
	isHeader: boolean;
	errorChange: number;
	errorBefore: number;
	errorAfter: number;
}

export class TacticalAnalysisService {
	/**
	 * Calculate shortest signed angle difference between two angles
	 * Returns value in range [-180°, +180°]
	 */
	static angleDiff(a: Angle, b: Angle): number {
		return a.angleDiff(b);
	}

	/**
	 * Calculate optimal heading for a given tack and wind direction
	 */
	static getOptimalHeading(
		tack: boolean,
		windDirection: Angle,
		isUpwind: boolean = true
	): Angle {
		const optAngle = isUpwind ? OPT_UPWIND_ANGLE : OPT_DOWNWIND_ANGLE;
		const optAngleObj = Angle.fromDegrees(optAngle);

		if (tack) {
			// Port tack: wind comes from starboard, sail at +optAngle relative to wind
			return windDirection.add(optAngleObj);
		} else {
			// Starboard tack: wind comes from port, sail at -optAngle relative to wind
			return windDirection.subtract(optAngleObj);
		}
	}

	/**
	 * Calculate lift/header for a wind shift
	 * Returns: { isLift, isHeader, errorChange, errorBefore, errorAfter }
	 *
	 * According to spec: Lift = wind shift allows boat to sail closer to mark
	 * Header = wind shift forces boat away from mark
	 *
	 * This is calculated relative to course axis, NOT boat's current angle
	 */
	static calculateLiftHeader(
		boatPosition: Position,
		markPosition: Position,
		tack: boolean,
		windDirPrev: Angle,
		windDirNow: Angle,
		isUpwind: boolean = true
	): LiftHeaderResult {
		// Calculate course axis (bearing to mark)
		const courseAxis = NavigationService.getCourseAxis(boatPosition, markPosition);

		// Calculate optimal headings before and after wind shift
		const optHeadingBefore = TacticalAnalysisService.getOptimalHeading(
			tack,
			windDirPrev,
			isUpwind
		);
		const optHeadingAfter = TacticalAnalysisService.getOptimalHeading(
			tack,
			windDirNow,
			isUpwind
		);

		// Calculate error angles (deviation from course axis)
		const errorBefore = TacticalAnalysisService.angleDiff(courseAxis, optHeadingBefore);
		const errorAfter = TacticalAnalysisService.angleDiff(courseAxis, optHeadingAfter);

		// Lift = error decreases (closer to course axis)
		// Header = error increases (farther from course axis)
		const errorChange = errorAfter - errorBefore;
		const isLift = Math.abs(errorAfter) < Math.abs(errorBefore);
		const isHeader = Math.abs(errorAfter) > Math.abs(errorBefore);

		return {
			isLift,
			isHeader,
			errorChange,
			errorBefore,
			errorAfter
		};
	}

	/**
	 * Calculate VMG (Velocity Made Good) toward a target
	 */
	static calculateVMG(
		boatPosition: Position,
		targetPosition: Position,
		boatSpeed: number,
		heading: Angle
	): number {
		const courseAxis = NavigationService.getCourseAxis(boatPosition, targetPosition);
		const angleDiff = TacticalAnalysisService.angleDiff(courseAxis, heading);
		return boatSpeed * Math.cos((angleDiff * Math.PI) / 180);
	}

	/**
	 * Calculate VMG efficiency (VMG / optimal VMG)
	 */
	static calculateVMGEfficiency(
		boatPosition: Position,
		targetPosition: Position,
		boatSpeed: number,
		heading: Angle,
		optimalSpeed: number = 1.0
	): number {
		const vmg = TacticalAnalysisService.calculateVMG(
			boatPosition,
			targetPosition,
			boatSpeed,
			heading
		);
		const optimalVMG = optimalSpeed; // Assuming optimal speed = optimal VMG when heading correctly
		return optimalVMG > 0 ? vmg / optimalVMG : 0;
	}
}

