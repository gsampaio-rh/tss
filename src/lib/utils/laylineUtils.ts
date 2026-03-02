/**
 * Layline Calculation Utilities
 * 
 * Helper functions for calculating layline positions and angles.
 */

import type { Mark } from '$lib/types/game';

export interface LaylineConfig {
	currentWind: number; // Wind angle in game units
	upMark: Mark | null;
	gameWidth: number;
	gameHeight: number;
}

export interface LaylineAngles {
	port: number;
	starboard: number;
}

export interface LaylineEndpoints {
	port: { x: number; y: number };
	starboard: { x: number; y: number };
}

/**
 * Calculate layline angles
 * These are the angles boats sail at when on the layline: -45-wind (port) and 45-wind (starboard)
 */
export function calculateLaylineAngles(currentWind: number): LaylineAngles {
	return {
		port: -45 - currentWind,
		starboard: 45 - currentWind
	};
}

/**
 * Calculate layline endpoints
 * Laylines extend FROM the mark BACKWARD (downwind) toward the start area
 */
export function calculateLaylineEndpoints(config: LaylineConfig): LaylineEndpoints {
	const { currentWind, upMark, gameWidth, gameHeight } = config;

	if (!upMark) {
		return {
			port: { x: 0, y: 0 },
			starboard: { x: 0, y: 0 }
		};
	}

	const angles = calculateLaylineAngles(currentWind);
	const laylineLength = Math.max(gameWidth, gameHeight) * 1.5;

	// Extend laylines from mark backward along the layline angles
	const portLaylineEndX =
		upMark.x + Math.sin(((angles.port + 180) * Math.PI) / 180) * laylineLength;
	const portLaylineEndY =
		upMark.y - Math.cos(((angles.port + 180) * Math.PI) / 180) * laylineLength;
	const starboardLaylineEndX =
		upMark.x + Math.sin(((angles.starboard + 180) * Math.PI) / 180) * laylineLength;
	const starboardLaylineEndY =
		upMark.y - Math.cos(((angles.starboard + 180) * Math.PI) / 180) * laylineLength;

	return {
		port: { x: portLaylineEndX, y: portLaylineEndY },
		starboard: { x: starboardLaylineEndX, y: starboardLaylineEndY }
	};
}

export interface LaylineProximity {
	isNear: boolean;
	rotationAngle: number;
	opacity: number;
}

/**
 * Check if a boat is near a layline and return rendering parameters.
 * @param boatX - Boat X position
 * @param boatY - Boat Y position
 * @param markX - Windward mark X
 * @param markY - Windward mark Y
 * @param currentWind - Wind angle in game units
 * @param proximityThreshold - Degrees within which a boat is "near" a layline (default 8)
 */
export function calculateLaylineProximity(
	boatX: number,
	boatY: number,
	markX: number,
	markY: number,
	currentWind: number,
	proximityThreshold: number = 8
): LaylineProximity {
	const distToMark = Math.sqrt(Math.pow(boatX - markX, 2) + Math.pow(boatY - markY, 2));

	if (distToMark >= 12 || distToMark <= 2) {
		return { isNear: false, rotationAngle: 0, opacity: 0 };
	}

	const angleToMark = (Math.atan2(markY - boatY, markX - boatX) * 180) / Math.PI;
	const windAngle = currentWind * 2;
	const laylineAngle1 = windAngle - 45;
	const laylineAngle2 = windAngle + 45;
	const angleDiff1 = Math.abs(((angleToMark - laylineAngle1 + 180) % 360) - 180);
	const angleDiff2 = Math.abs(((angleToMark - laylineAngle2 + 180) % 360) - 180);
	const isNear = angleDiff1 < proximityThreshold || angleDiff2 < proximityThreshold;

	if (!isNear) {
		return { isNear: false, rotationAngle: 0, opacity: 0 };
	}

	const rotationAngle = angleDiff1 < angleDiff2
		? laylineAngle1 - angleToMark
		: laylineAngle2 - angleToMark;
	const opacity = Math.max(0.3, 0.7 - distToMark / 20);

	return { isNear, rotationAngle, opacity };
}

