/**
 * Track Rendering Utilities
 * 
 * Helper functions for rendering boat tracks.
 */

import type { Boat } from '$lib/types/boat';

/**
 * Generate SVG polyline points string from player turns
 */
export function getTrackPoints(player: Boat, turnCount: number): string {
	if (!player || !player.turns) return '';

	let points = '';
	for (let i = 0; i < player.turns.length && i < turnCount + 1; i++) {
		for (let j = 0; j < player.turns[i].points.length; j++) {
			const pt = player.turns[i].points[j];
			points += ' ' + pt.x.toFixed(3) + ',' + pt.y.toFixed(3);
		}
	}
	return points;
}

