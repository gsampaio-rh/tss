/**
 * Clock Position Utilities
 * 
 * Helper functions for calculating clock-style positions around a center point.
 * Used for positioning tactical indicators around boats.
 */

/**
 * Convert hour position (0-11) to x,y offset from center
 * @param hour - Hour position (0 = 12 o'clock, 1 = 1 o'clock, etc.)
 * @param radius - Distance from center in pixels
 * @returns Object with x and y offsets
 */
export function getClockPosition(hour: number, radius: number): { x: number; y: number } {
	const angle = ((hour * 30 - 90) * Math.PI) / 180; // Convert to radians, -90 to start at top
	return {
		x: Math.cos(angle) * radius,
		y: Math.sin(angle) * radius
	};
}

/**
 * Calculate multiple clock positions at once
 * @param hours - Array of hour positions (0-11)
 * @param radius - Distance from center in pixels
 * @returns Object mapping hour to position { x, y }
 */
export function getClockPositions(
	hours: number[],
	radius: number
): Record<number, { x: number; y: number }> {
	const positions: Record<number, { x: number; y: number }> = {};
	for (const hour of hours) {
		positions[hour] = getClockPosition(hour, radius);
	}
	return positions;
}

