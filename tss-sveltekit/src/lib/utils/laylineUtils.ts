/**
 * Layline Calculation Utilities
 * 
 * Helper functions for calculating layline positions and angles.
 */

import type { MarkEntity } from '$lib/domain/entities/Mark';

export interface LaylineConfig {
	currentWind: number; // Wind angle in game units
	upMark: MarkEntity | null;
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

