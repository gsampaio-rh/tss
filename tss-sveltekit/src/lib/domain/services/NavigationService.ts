/**
 * Navigation Service
 * Handles navigation calculations: bearings, course axis, distances
 */

import { Position } from '../value-objects/Position';
import { Angle } from '../value-objects/Angle';

export class NavigationService {
	/**
	 * Calculate rotation angle between two points (bearing from point1 to point2)
	 * Returns angle in degrees, 0° = north, clockwise positive
	 */
	static getRotateAngle(from: Position, to: Position): Angle {
		return Angle.fromRadians(
			Math.atan2(to.x - from.x, -(to.y - from.y))
		);
	}

	/**
	 * Calculate course axis (bearing from boat to mark)
	 */
	static getCourseAxis(boatPosition: Position, markPosition: Position): Angle {
		return NavigationService.getRotateAngle(boatPosition, markPosition);
	}

	/**
	 * Calculate distance between two positions
	 */
	static distance(pos1: Position, pos2: Position): number {
		return pos1.distanceTo(pos2);
	}

	/**
	 * Calculate distance to a line
	 */
	static distanceToLine(
		point: Position,
		linePoint: Position,
		lineAngle: Angle
	): number {
		// Convert coordinate system
		const adjustedAngle = lineAngle.degrees - 90;
		const adjustedY = -point.y;
		const adjustedLY = -linePoint.y;

		const angleRad = (adjustedAngle * Math.PI) / 180;
		const dx = point.x - linePoint.x;
		const dy = adjustedY - adjustedLY;

		const perpAngle = angleRad + Math.PI / 2;
		const perpDist = Math.abs(dx * Math.cos(perpAngle) - dy * Math.sin(perpAngle));

		return perpDist;
	}
}


