/**
 * Dirty Air Zone Constants
 *
 * Single source of truth for all dirty air zone parameters.
 * Two sets exist: VISUAL (rendering/particles) and DETECTION (game effect calculations).
 *
 * Visual zones are tighter to avoid visual clutter; detection zones are broader
 * because aerodynamic effects extend beyond the visible wake.
 */

export const BOAT_LENGTH = 1.0;

/** Visual constants -- used by DirtyAirZones.svelte and WindParticleSystem */
export const VISUAL = {
	BLANKET_LENGTH: 4 * BOAT_LENGTH,
	BLANKET_ANGLE_SPREAD: 15,

	BACKWIND_LENGTH: 10 * BOAT_LENGTH,
	BACKWIND_ANGLE_SPREAD: 30,
} as const;

/** Detection constants -- used by DirtyAirService for game-effect calculations */
export const DETECTION = {
	BLANKET_LENGTH: 8,
	BLANKET_WIDTH_START: 0.3,
	BLANKET_WIDTH_END: 3.5,
	BLANKET_ANGLE_SPREAD: 30,

	BACKWIND_LENGTH: 10,
	BACKWIND_WIDTH_START: 0.5,
	BACKWIND_WIDTH_END: 5.0,
	BACKWIND_ANGLE_SPREAD: 45,
	BACKWIND_CURVE_FACTOR: 0.3,
} as const;
