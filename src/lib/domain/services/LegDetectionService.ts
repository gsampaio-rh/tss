/**
 * Leg Detection Service
 *
 * Splits a sailor's track into race legs (upwind/downwind/reach)
 * based on course marks and wind direction.
 */

import type {
	SailorTrack,
	TrackPoint,
	RaceCourse,
	CourseMark,
	Leg,
	LegStats,
	LegType,
	Maneuver
} from '$lib/types/session';
import { detectManeuvers } from './ManeuverDetectionService';

const METERS_PER_DEG_LAT = 111_320;
const MS_TO_KNOTS = 1.94384;
const MARK_PROXIMITY_M = 80;

function gpsDistanceM(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const cosLat = Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
	const dLat = (lat2 - lat1) * METERS_PER_DEG_LAT;
	const dLon = (lon2 - lon1) * METERS_PER_DEG_LAT * cosLat;
	return Math.sqrt(dLat * dLat + dLon * dLon);
}

function angleDiff(a: number, b: number): number {
	let d = b - a;
	if (d > 180) d -= 360;
	if (d < -180) d += 360;
	return d;
}

function classifyLegByTWA(avgTWA: number): LegType {
	const abs = Math.abs(avgTWA);
	if (abs < 70) return 'upwind';
	if (abs > 110) return 'downwind';
	return 'reach';
}

function computeLegStats(
	points: TrackPoint[],
	startIdx: number,
	endIdx: number,
	windDirection: number,
	maneuvers: Maneuver[]
): LegStats {
	if (endIdx <= startIdx) {
		return {
			avgSOG: 0,
			maxSOG: 0,
			avgVMG: 0,
			avgTWA: 0,
			distance: 0,
			duration: 0,
			tackCount: 0,
			gybeCount: 0
		};
	}

	let sumSOG = 0;
	let maxSOG = 0;
	let sumTWA = 0;
	let sumVMG = 0;
	let totalDist = 0;
	let count = 0;

	for (let i = startIdx; i <= endIdx; i++) {
		const pt = points[i];
		const sogKnots = pt.speed * MS_TO_KNOTS;
		sumSOG += sogKnots;
		if (sogKnots > maxSOG) maxSOG = sogKnots;

		const twa = angleDiff(pt.rotation, windDirection);
		sumTWA += twa;

		const vmg = sogKnots * Math.cos((Math.abs(twa) * Math.PI) / 180);
		sumVMG += vmg;

		if (i > startIdx) {
			const prev = points[i - 1];
			const dx = pt.x - prev.x;
			const dy = pt.y - prev.y;
			totalDist += Math.sqrt(dx * dx + dy * dy);
		}

		count++;
	}

	const startTime = points[startIdx].time;
	const endTime = points[endIdx].time;
	const durationS = (endTime - startTime) / 1000;

	const legManeuvers = maneuvers.filter(
		(m) => m.time >= startTime && m.time <= endTime
	);

	return {
		avgSOG: count > 0 ? sumSOG / count : 0,
		maxSOG,
		avgVMG: count > 0 ? sumVMG / count : 0,
		avgTWA: count > 0 ? sumTWA / count : 0,
		distance: totalDist,
		duration: durationS,
		tackCount: legManeuvers.filter((m) => m.type === 'tack').length,
		gybeCount: legManeuvers.filter((m) => m.type === 'gybe').length
	};
}

/**
 * Find the track point index closest to a GPS mark.
 * Returns -1 if no point is within the proximity threshold.
 */
function findMarkRounding(
	track: SailorTrack,
	mark: CourseMark,
	searchFromIdx: number
): number {
	let bestIdx = -1;
	let bestDist = Infinity;

	const gps = track.rawGps;
	for (let i = searchFromIdx; i < gps.length; i++) {
		const d = gpsDistanceM(gps[i].lat, gps[i].lon, mark.lat, mark.lon);
		if (d < bestDist) {
			bestDist = d;
			bestIdx = i;
		}
	}

	return bestDist <= MARK_PROXIMITY_M ? bestIdx : -1;
}

/**
 * Detect legs using placed course marks.
 * Finds rounding moments at windward/leeward marks and splits the track.
 */
function detectLegsFromMarks(
	track: SailorTrack,
	raceCourse: RaceCourse,
	windDirection: number
): Leg[] {
	const windward = raceCourse.marks.find((m) => m.type === 'windward');
	const leeward = raceCourse.marks.find((m) => m.type === 'leeward');

	if (!windward && !leeward) return [];

	const marks: { mark: CourseMark; type: 'windward' | 'leeward' }[] = [];
	if (windward) marks.push({ mark: windward, type: 'windward' });
	if (leeward) marks.push({ mark: leeward, type: 'leeward' });

	const roundings: { idx: number; markType: 'windward' | 'leeward' }[] = [];

	for (const { mark, type } of marks) {
		let searchFrom = 0;
		while (searchFrom < track.rawGps.length) {
			const idx = findMarkRounding(track, mark, searchFrom);
			if (idx < 0) break;

			// Skip duplicate roundings at same mark (must be 60s+ apart)
			const lastOfType = roundings.filter((r) => r.markType === type);
			const lastIdx = lastOfType.length > 0 ? lastOfType[lastOfType.length - 1].idx : -1;
			if (lastIdx >= 0) {
				const timeDiff =
					track.rawGps[idx].time.getTime() -
					track.rawGps[lastIdx].time.getTime();
				if (timeDiff < 60_000) {
					searchFrom = idx + 30;
					continue;
				}
			}

			roundings.push({ idx, markType: type });
			searchFrom = idx + 30;
		}
	}

	if (roundings.length === 0) return [];

	roundings.sort((a, b) => a.idx - b.idx);

	const maneuvers = detectManeuvers(track, windDirection);
	const legs: Leg[] = [];
	let prevIdx = 0;

	for (let i = 0; i <= roundings.length; i++) {
		const endIdx =
			i < roundings.length ? roundings[i].idx : track.points.length - 1;
		if (endIdx <= prevIdx) continue;

		const stats = computeLegStats(
			track.points,
			prevIdx,
			endIdx,
			windDirection,
			maneuvers
		);
		const legType = classifyLegByTWA(stats.avgTWA);

		legs.push({
			type: legType,
			legNumber: legs.length + 1,
			startIdx: prevIdx,
			endIdx,
			startTime: track.points[prevIdx].time,
			endTime: track.points[endIdx].time,
			stats
		});

		prevIdx = endIdx;
	}

	return legs;
}

/**
 * Fallback: detect legs by TWA transitions when no course marks are placed.
 * Groups consecutive points with similar TWA classification.
 */
function detectLegsByTWA(
	track: SailorTrack,
	windDirection: number
): Leg[] {
	const { points } = track;
	if (points.length < 20) return [];

	const maneuvers = detectManeuvers(track, windDirection);
	const legs: Leg[] = [];
	const WINDOW = 30;

	let currentType: LegType | null = null;
	let legStart = 0;

	for (let i = 0; i < points.length; i += WINDOW) {
		const end = Math.min(i + WINDOW, points.length - 1);
		let sumTWA = 0;
		let count = 0;
		for (let j = i; j <= end; j++) {
			sumTWA += angleDiff(points[j].rotation, windDirection);
			count++;
		}
		const avgTWA = count > 0 ? sumTWA / count : 0;
		const segType = classifyLegByTWA(avgTWA);

		if (currentType === null) {
			currentType = segType;
			legStart = i;
		} else if (segType !== currentType) {
			const stats = computeLegStats(
				points,
				legStart,
				i - 1,
				windDirection,
				maneuvers
			);
			legs.push({
				type: currentType,
				legNumber: legs.length + 1,
				startIdx: legStart,
				endIdx: i - 1,
				startTime: points[legStart].time,
				endTime: points[i - 1].time,
				stats
			});
			currentType = segType;
			legStart = i;
		}
	}

	if (currentType !== null && legStart < points.length - 1) {
		const stats = computeLegStats(
			points,
			legStart,
			points.length - 1,
			windDirection,
			maneuvers
		);
		legs.push({
			type: currentType,
			legNumber: legs.length + 1,
			startIdx: legStart,
			endIdx: points.length - 1,
			startTime: points[legStart].time,
			endTime: points[points.length - 1].time,
			stats
		});
	}

	return legs.filter((l) => l.stats.duration > 30);
}

/**
 * Main entry point: detect legs for a track.
 * Uses course marks if available, otherwise falls back to TWA-based detection.
 */
export function detectLegs(
	track: SailorTrack,
	raceCourse: RaceCourse,
	windDirection: number
): Leg[] {
	const hasMarks =
		raceCourse.marks.some((m) => m.type === 'windward') ||
		raceCourse.marks.some((m) => m.type === 'leeward');

	if (hasMarks) {
		const legs = detectLegsFromMarks(track, raceCourse, windDirection);
		if (legs.length > 0) return legs;
	}

	return detectLegsByTWA(track, windDirection);
}
