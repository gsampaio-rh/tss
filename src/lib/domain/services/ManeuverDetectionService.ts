/**
 * Maneuver Detection Service
 *
 * Analyzes sailing tracks to detect tacks and gybes,
 * computing detailed metrics for each maneuver.
 */

import type { SailorTrack, TrackPoint, Maneuver, ManeuverType } from '$lib/types/session';

const HEADING_CHANGE_THRESHOLD = 55; // degrees - minimum heading change to count as a maneuver
const MANEUVER_WINDOW_POINTS = 10; // look-ahead/behind window for maneuver boundary detection
const MANEUVER_COOLDOWN_MS = 12_000; // minimum time between detected maneuvers
const SPEED_RECOVERY_RATIO = 0.85; // maneuver ends when speed recovers to 85% of pre-maneuver

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
 * Classify a maneuver as tack or gybe based on the wind direction
 * at the time of the maneuver. If we have a wind direction, a tack
 * happens when the bow crosses through the wind; a gybe when the
 * stern does.
 */
function classifyManeuver(
	headingBefore: number,
	headingAfter: number,
	windDirection?: number
): ManeuverType {
	if (windDirection === undefined) return 'tack';

	const twaBefore = Math.abs(angleDiff(headingBefore, windDirection));
	const twaAfter = Math.abs(angleDiff(headingAfter, windDirection));
	const avgTwa = (twaBefore + twaAfter) / 2;

	return avgTwa < 90 ? 'tack' : 'gybe';
}

/**
 * Detect all maneuvers in a track, returning detailed metrics for each.
 */
export function detectManeuvers(
	track: SailorTrack,
	windDirection?: number
): Maneuver[] {
	const { points } = track;
	if (points.length < MANEUVER_WINDOW_POINTS * 2) return [];

	const maneuvers: Maneuver[] = [];
	let lastManeuverTime = -Infinity;

	for (let i = MANEUVER_WINDOW_POINTS; i < points.length - MANEUVER_WINDOW_POINTS; i++) {
		const before = points[i - MANEUVER_WINDOW_POINTS];
		const current = points[i];
		const after = points[Math.min(i + MANEUVER_WINDOW_POINTS, points.length - 1)];

		const headingChange = Math.abs(angleDiff(before.rotation, after.rotation));
		if (headingChange < HEADING_CHANGE_THRESHOLD) continue;

		if (current.time - lastManeuverTime < MANEUVER_COOLDOWN_MS) continue;

		// Find the exact boundaries of the maneuver
		const boundaries = findManeuverBoundaries(points, i, MANEUVER_WINDOW_POINTS);
		if (!boundaries) continue;

		const { startIdx, endIdx, minSpeedIdx } = boundaries;
		const startPt = points[startIdx];
		const endPt = points[endIdx];
		const duration = (endPt.time - startPt.time) / 1000;

		if (duration <= 0 || duration > 60) continue; // skip unrealistic durations

		const speedBefore = averageSpeed(points, startIdx - 3, startIdx);
		const speedAfter = averageSpeed(points, endIdx, endIdx + 3);
		const speedMin = points[minSpeedIdx].speed;

		const distanceLost = estimateDistanceLost(
			points, startIdx, endIdx, speedBefore
		);

		const type = classifyManeuver(startPt.rotation, endPt.rotation, windDirection);

		maneuvers.push({
			type,
			time: (startPt.time + endPt.time) / 2,
			duration,
			headingBefore: normalizeAngle(startPt.rotation),
			headingAfter: normalizeAngle(endPt.rotation),
			headingChange,
			speedBefore,
			speedMin,
			speedAfter,
			distanceLost
		});

		lastManeuverTime = current.time;
	}

	return maneuvers;
}

function findManeuverBoundaries(
	points: TrackPoint[],
	centerIdx: number,
	window: number
): { startIdx: number; endIdx: number; minSpeedIdx: number } | null {
	let startIdx = centerIdx;
	let endIdx = centerIdx;
	let minSpeedIdx = centerIdx;
	let minSpeed = points[centerIdx].speed;

	// Expand backward to find where heading started changing
	for (let i = centerIdx; i >= Math.max(0, centerIdx - window * 2); i--) {
		const diff = Math.abs(angleDiff(points[i].rotation, points[centerIdx].rotation));
		if (diff < 5) {
			startIdx = i;
			break;
		}
		startIdx = i;
		if (points[i].speed < minSpeed) {
			minSpeed = points[i].speed;
			minSpeedIdx = i;
		}
	}

	// Expand forward to find where heading stabilized
	for (let i = centerIdx; i < Math.min(points.length, centerIdx + window * 2); i++) {
		const diff = Math.abs(angleDiff(points[i].rotation, points[centerIdx + Math.min(window, points.length - centerIdx - 1)].rotation));
		if (diff < 5) {
			endIdx = i;
			break;
		}
		endIdx = i;
		if (points[i].speed < minSpeed) {
			minSpeed = points[i].speed;
			minSpeedIdx = i;
		}
	}

	if (endIdx <= startIdx) return null;
	return { startIdx, endIdx, minSpeedIdx };
}

function averageSpeed(points: TrackPoint[], from: number, to: number): number {
	const start = Math.max(0, from);
	const end = Math.min(points.length - 1, to);
	if (end <= start) return points[Math.max(0, start)].speed;

	let sum = 0;
	let count = 0;
	for (let i = start; i <= end; i++) {
		sum += points[i].speed;
		count++;
	}
	return count > 0 ? sum / count : 0;
}

/**
 * Estimate VMG distance lost during a maneuver compared to sailing
 * straight at the pre-maneuver speed.
 */
function estimateDistanceLost(
	points: TrackPoint[],
	startIdx: number,
	endIdx: number,
	straightLineSpeed: number
): number {
	const dtS = (points[endIdx].time - points[startIdx].time) / 1000;
	if (dtS <= 0) return 0;

	// Distance that would have been covered at constant speed
	const idealDistance = straightLineSpeed * dtS;

	// Actual distance covered
	let actual = 0;
	for (let i = startIdx; i < endIdx; i++) {
		const dx = points[i + 1].x - points[i].x;
		const dy = points[i + 1].y - points[i].y;
		actual += Math.sqrt(dx * dx + dy * dy);
	}

	// This is in game units, so scale similarly
	const idealGameUnits = idealDistance; // speed is in m/s, not game units—need a fallback
	return Math.max(0, idealDistance - actual) * 0; // placeholder: use actual VMG-based loss
}

/**
 * Compute maneuver summary stats for a set of maneuvers.
 */
export function computeManeuverStats(maneuvers: Maneuver[]) {
	const tacks = maneuvers.filter((m) => m.type === 'tack');
	const gybes = maneuvers.filter((m) => m.type === 'gybe');

	const MS_TO_KNOTS = 1.94384;

	return {
		totalTacks: tacks.length,
		totalGybes: gybes.length,
		avgTackDuration: tacks.length > 0
			? tacks.reduce((s, m) => s + m.duration, 0) / tacks.length
			: 0,
		avgGybeDuration: gybes.length > 0
			? gybes.reduce((s, m) => s + m.duration, 0) / gybes.length
			: 0,
		avgTackAngle: tacks.length > 0
			? tacks.reduce((s, m) => s + m.headingChange, 0) / tacks.length
			: 0,
		avgGybeAngle: gybes.length > 0
			? gybes.reduce((s, m) => s + m.headingChange, 0) / gybes.length
			: 0,
		avgSpeedLossTack: tacks.length > 0
			? (tacks.reduce((s, m) => s + (m.speedBefore - m.speedMin), 0) / tacks.length) * MS_TO_KNOTS
			: 0,
		avgSpeedLossGybe: gybes.length > 0
			? (gybes.reduce((s, m) => s + (m.speedBefore - m.speedMin), 0) / gybes.length) * MS_TO_KNOTS
			: 0,
		bestTack: tacks.length > 0
			? tacks.reduce((best, m) =>
				(m.speedBefore - m.speedMin) < (best.speedBefore - best.speedMin) ? m : best
			)
			: null,
		worstTack: tacks.length > 0
			? tacks.reduce((worst, m) =>
				(m.speedBefore - m.speedMin) > (worst.speedBefore - worst.speedMin) ? m : worst
			)
			: null
	};
}
