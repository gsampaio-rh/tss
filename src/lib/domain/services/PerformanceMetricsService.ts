/**
 * Performance Metrics Service
 *
 * Computes normalized (0-100%) performance scores across 6 axes
 * for each sailor, enabling radar chart comparison.
 */

import type {
	SailorTrack,
	Leg,
	Maneuver,
	PerformanceScore
} from '$lib/types/session';
import { computeManeuverStats } from './ManeuverDetectionService';

const MS_TO_KNOTS = 1.94384;

export const PERFORMANCE_AXES = [
	'Boat Speed',
	'VMG',
	'Tack Efficiency',
	'Gybe Efficiency',
	'Heading Consistency',
	'Distance Efficiency'
] as const;

interface SailorRawMetrics {
	avgSOG: number;
	avgVMG: number;
	tackEfficiency: number;
	gybeEfficiency: number;
	headingConsistency: number;
	distanceEfficiency: number;
}

function angleDiff(a: number, b: number): number {
	let d = b - a;
	if (d > 180) d -= 360;
	if (d < -180) d += 360;
	return d;
}

function computeRawMetrics(
	track: SailorTrack,
	legs: Leg[],
	maneuvers: Maneuver[],
	windDirection: number,
	legFilter?: 'upwind' | 'downwind'
): SailorRawMetrics {
	const filteredLegs = legFilter
		? legs.filter((l) => l.type === legFilter)
		: legs;

	// Boat speed & VMG
	let sumSOG = 0;
	let sumVMG = 0;
	let pointCount = 0;

	for (const leg of filteredLegs) {
		for (let i = leg.startIdx; i <= leg.endIdx && i < track.points.length; i++) {
			const pt = track.points[i];
			const sogKts = pt.speed * MS_TO_KNOTS;
			sumSOG += sogKts;
			const twa = Math.abs(angleDiff(pt.rotation, windDirection));
			sumVMG += sogKts * Math.cos((twa * Math.PI) / 180);
			pointCount++;
		}
	}

	const avgSOG = pointCount > 0 ? sumSOG / pointCount : 0;
	const avgVMG = pointCount > 0 ? Math.abs(sumVMG / pointCount) : 0;

	// Tack & Gybe efficiency from maneuver stats
	const stats = computeManeuverStats(maneuvers);
	const tackEfficiency =
		stats.totalTacks > 0
			? maneuvers
					.filter((m) => m.type === 'tack')
					.reduce((acc, m) => {
						const retained = m.speedBefore > 0 ? m.speedAfter / m.speedBefore : 1;
						return acc + retained;
					}, 0) / stats.totalTacks
			: 1;

	const gybeEfficiency =
		stats.totalGybes > 0
			? maneuvers
					.filter((m) => m.type === 'gybe')
					.reduce((acc, m) => {
						const retained = m.speedBefore > 0 ? m.speedAfter / m.speedBefore : 1;
						return acc + retained;
					}, 0) / stats.totalGybes
			: 1;

	// Heading consistency: lower variance = better
	let sumHeadingSq = 0;
	let headingCount = 0;
	let prevHeading = -1;
	for (const leg of filteredLegs) {
		for (let i = leg.startIdx; i <= leg.endIdx && i < track.points.length; i++) {
			const h = track.points[i].rotation;
			if (prevHeading >= 0) {
				const delta = angleDiff(prevHeading, h);
				sumHeadingSq += delta * delta;
				headingCount++;
			}
			prevHeading = h;
		}
	}
	const headingVariance = headingCount > 0 ? sumHeadingSq / headingCount : 0;
	const headingConsistency = Math.max(0, 1 - Math.sqrt(headingVariance) / 30);

	// Distance efficiency: straight-line vs actual
	let actualDist = 0;
	let straightDist = 0;
	for (const leg of filteredLegs) {
		if (leg.endIdx <= leg.startIdx || leg.endIdx >= track.points.length) continue;
		const start = track.points[leg.startIdx];
		const end = track.points[leg.endIdx];
		const dx = end.x - start.x;
		const dy = end.y - start.y;
		straightDist += Math.sqrt(dx * dx + dy * dy);

		for (let i = leg.startIdx; i < leg.endIdx; i++) {
			const a = track.points[i];
			const b = track.points[i + 1];
			const adx = b.x - a.x;
			const ady = b.y - a.y;
			actualDist += Math.sqrt(adx * adx + ady * ady);
		}
	}
	const distanceEfficiency = actualDist > 0 ? straightDist / actualDist : 1;

	return {
		avgSOG,
		avgVMG,
		tackEfficiency: Math.min(1, tackEfficiency),
		gybeEfficiency: Math.min(1, gybeEfficiency),
		headingConsistency: Math.min(1, headingConsistency),
		distanceEfficiency: Math.min(1, distanceEfficiency)
	};
}

function normalizeScores(
	allMetrics: { name: string; color: string; metrics: SailorRawMetrics }[]
): PerformanceScore[] {
	if (allMetrics.length === 0) return [];

	const keys: (keyof SailorRawMetrics)[] = [
		'avgSOG',
		'avgVMG',
		'tackEfficiency',
		'gybeEfficiency',
		'headingConsistency',
		'distanceEfficiency'
	];

	// Find max per axis across fleet
	const maxPerAxis: Record<string, number> = {};
	for (const key of keys) {
		maxPerAxis[key] = Math.max(
			...allMetrics.map((m) => m.metrics[key]),
			0.001
		);
	}

	return allMetrics.map(({ name, color, metrics }) => ({
		sailorName: name,
		color,
		axes: keys.map((key) => {
			const raw = metrics[key];
			const max = maxPerAxis[key];
			return Math.round(Math.min(100, (raw / max) * 100));
		})
	}));
}

/**
 * Compute performance scores for all sailors.
 */
export function computePerformanceScores(
	tracks: SailorTrack[],
	allManeuvers: Map<string, Maneuver[]>,
	allLegs: Map<string, Leg[]>,
	windDirection: number,
	legFilter?: 'upwind' | 'downwind'
): PerformanceScore[] {
	const allMetrics = tracks.map((track) => ({
		name: track.name,
		color: track.color,
		metrics: computeRawMetrics(
			track,
			allLegs.get(track.name) ?? [],
			allManeuvers.get(track.name) ?? [],
			windDirection,
			legFilter
		)
	}));

	return normalizeScores(allMetrics);
}
