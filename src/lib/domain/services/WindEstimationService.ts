/**
 * Wind Estimation Service
 *
 * Infers wind direction from sailing track data by detecting tacks
 * and computing the bisector of port and starboard headings.
 *
 * For upwind legs: wind direction = bisector of the two close-hauled headings.
 * For downwind legs: similar approach with gybe angles.
 */

import type { SailorTrack, TrackPoint, WindEntry } from '$lib/types/session';

const TACK_HEADING_CHANGE_THRESHOLD = 60; // degrees
const TACK_TIME_WINDOW_MS = 10_000; // max time for a heading change to count as a tack
const MIN_TACKS_FOR_ESTIMATION = 2;

interface TackEvent {
	time: number;
	headingBefore: number;
	headingAfter: number;
	bisector: number;
}

/**
 * Detect tack events in a track.
 * A tack is a heading change > threshold over a short time window.
 */
function detectTacks(points: TrackPoint[]): TackEvent[] {
	const tacks: TackEvent[] = [];
	if (points.length < 10) return tacks;

	// Use a sliding window approach: compare heading over every N-point span
	const WINDOW = 8; // points (at 1Hz GPS = 8 seconds)

	for (let i = WINDOW; i < points.length; i++) {
		const before = points[i - WINDOW];
		const after = points[i];

		const dt = after.time - before.time;
		if (dt > TACK_TIME_WINDOW_MS || dt <= 0) continue;

		const headingDiff = angleDiff(before.rotation, after.rotation);
		if (Math.abs(headingDiff) < TACK_HEADING_CHANGE_THRESHOLD) continue;

		// Avoid duplicate detections: skip if we already detected a tack within 15s
		const lastTack = tacks[tacks.length - 1];
		if (lastTack && after.time - lastTack.time < 15_000) continue;

		const bisector = computeBisector(before.rotation, after.rotation);
		tacks.push({
			time: (before.time + after.time) / 2,
			headingBefore: before.rotation,
			headingAfter: after.rotation,
			bisector
		});
	}

	return tacks;
}

/**
 * Compute the wind direction from tack bisectors.
 *
 * For upwind sailing, the wind comes FROM the bisector direction.
 * The bisector of port and starboard close-hauled headings points upwind.
 */
function computeBisector(heading1: number, heading2: number): number {
	const h1 = normalizeAngle(heading1);
	const h2 = normalizeAngle(heading2);

	// Compute the average angle (handling wraparound)
	let diff = h2 - h1;
	if (diff > 180) diff -= 360;
	if (diff < -180) diff += 360;

	let bisector = h1 + diff / 2;

	// The wind comes FROM the upwind direction, which is 180° from the boat's upwind heading
	// The bisector gives the upwind heading direction; wind comes from the opposite
	bisector = normalizeAngle(bisector + 180);

	return bisector;
}

function angleDiff(a: number, b: number): number {
	let d = b - a;
	if (d > 180) d -= 360;
	if (d < -180) d += 360;
	return d;
}

function normalizeAngle(a: number): number {
	return ((a % 360) + 360) % 360;
}

/**
 * Average a list of angles (in degrees), handling wraparound.
 */
function averageAngles(angles: number[]): number {
	if (angles.length === 0) return 0;

	let sinSum = 0;
	let cosSum = 0;
	for (const a of angles) {
		const rad = (a * Math.PI) / 180;
		sinSum += Math.sin(rad);
		cosSum += Math.cos(rad);
	}

	const avgRad = Math.atan2(sinSum / angles.length, cosSum / angles.length);
	return normalizeAngle((avgRad * 180) / Math.PI);
}

/**
 * Estimate wind direction from one or more sailing tracks.
 *
 * Returns a WindEntry array with estimated wind direction at detected tack times.
 * Falls back to a single average if there aren't enough tacks.
 */
export function estimateWindFromTracks(tracks: SailorTrack[]): WindEntry[] {
	const allTacks: TackEvent[] = [];

	for (const track of tracks) {
		const tacks = detectTacks(track.points);
		allTacks.push(...tacks);
	}

	if (allTacks.length < MIN_TACKS_FOR_ESTIMATION) {
		// Not enough tacks to estimate; return empty
		return [];
	}

	// Sort by time
	allTacks.sort((a, b) => a.time - b.time);

	// Group tacks into time windows and average the bisectors
	const WINDOW_MS = 60_000; // 1-minute windows
	const entries: WindEntry[] = [];
	let windowStart = allTacks[0].time;
	let windowBisectors: number[] = [];

	for (const tack of allTacks) {
		if (tack.time - windowStart > WINDOW_MS && windowBisectors.length > 0) {
			entries.push({
				time: windowStart + WINDOW_MS / 2,
				direction: Math.round(averageAngles(windowBisectors)),
				speed: 0 // speed not estimable from heading alone
			});
			windowStart = tack.time;
			windowBisectors = [];
		}
		windowBisectors.push(tack.bisector);
	}

	// Final window
	if (windowBisectors.length > 0) {
		entries.push({
			time: windowStart + WINDOW_MS / 2,
			direction: Math.round(averageAngles(windowBisectors)),
			speed: 0
		});
	}

	return entries;
}

/**
 * Get estimated wind direction as a simple average across all detected tacks.
 */
export function estimateAverageWindDirection(tracks: SailorTrack[]): number | null {
	const entries = estimateWindFromTracks(tracks);
	if (entries.length === 0) return null;

	return Math.round(averageAngles(entries.map((e) => e.direction)));
}
