/**
 * Wind Shift Analysis Service
 *
 * Analyzes wind shifts relative to mean TWD to determine
 * favoured tack at each point along a track.
 */

import type {
	SailorTrack,
	WindTimeline,
	WindShiftPoint,
	FavouredTackData
} from '$lib/types/session';

function angleDiff(a: number, b: number): number {
	let d = b - a;
	if (d > 180) d -= 360;
	if (d < -180) d += 360;
	return d;
}

function getWindDirAtTime(windTimeline: WindTimeline, timeMs: number): number {
	const entries = windTimeline.entries;
	if (entries.length === 0) return 0;
	if (entries.length === 1) return entries[0].direction;
	for (let i = entries.length - 1; i >= 0; i--) {
		if (entries[i].time <= timeMs) return entries[i].direction;
	}
	return entries[0].direction;
}

/**
 * Compute mean TWD across the session duration.
 */
function computeMeanTWD(windTimeline: WindTimeline): number {
	const entries = windTimeline.entries;
	if (entries.length === 0) return 0;
	if (entries.length === 1) return entries[0].direction;

	let sinSum = 0;
	let cosSum = 0;
	for (const e of entries) {
		const rad = (e.direction * Math.PI) / 180;
		sinSum += Math.sin(rad);
		cosSum += Math.cos(rad);
	}

	const meanRad = Math.atan2(sinSum / entries.length, cosSum / entries.length);
	return ((meanRad * 180) / Math.PI + 360) % 360;
}

/**
 * Compute wind shift data for a track.
 * Shift is the difference between instantaneous TWD and mean TWD.
 * Positive = right shift (favours starboard tack), negative = left shift (favours port).
 */
export function computeFavouredTackData(
	track: SailorTrack,
	windTimeline: WindTimeline
): FavouredTackData {
	const { points } = track;
	if (points.length === 0) {
		return {
			shiftPoints: [],
			meanTWA: 0,
			rightSidePercent: 50,
			leftSidePercent: 50,
			rightShiftPercent: 50,
			leftShiftPercent: 50
		};
	}

	const meanTWD = computeMeanTWD(windTimeline);
	const shiftPoints: WindShiftPoint[] = [];
	let sumTWA = 0;
	let rightSideCount = 0;
	let leftSideCount = 0;
	let rightShiftCount = 0;
	let leftShiftCount = 0;

	for (let i = 0; i < points.length; i++) {
		const pt = points[i];
		const instantTWD = getWindDirAtTime(windTimeline, pt.time);
		const shift = angleDiff(meanTWD, instantTWD);
		const twa = angleDiff(pt.rotation, instantTWD);
		sumTWA += Math.abs(twa);

		const side: 'left' | 'right' = shift >= 0 ? 'right' : 'left';
		shiftPoints.push({ index: i, shiftDeg: shift, side });

		if (twa > 0) {
			rightSideCount++;
		} else {
			leftSideCount++;
		}

		if (shift >= 0) {
			rightShiftCount++;
		} else {
			leftShiftCount++;
		}
	}

	const total = points.length;
	const meanTWA = total > 0 ? sumTWA / total : 0;

	return {
		shiftPoints,
		meanTWA,
		rightSidePercent: total > 0 ? (rightSideCount / total) * 100 : 50,
		leftSidePercent: total > 0 ? (leftSideCount / total) * 100 : 50,
		rightShiftPercent: total > 0 ? (rightShiftCount / total) * 100 : 50,
		leftShiftPercent: total > 0 ? (leftShiftCount / total) * 100 : 50
	};
}
