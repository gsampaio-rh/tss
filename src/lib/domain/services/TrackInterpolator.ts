/**
 * Track Interpolator
 *
 * Given a SailorTrack and a timestamp, returns the interpolated position,
 * rotation, and speed via binary search + linear interpolation.
 */

import type { TrackPoint, GpsPoint, SailorTrack } from '$lib/types/session';

export interface InterpolatedPosition {
	x: number;
	y: number;
	rotation: number;
	speed: number;
	tack: boolean;
}

/**
 * Binary-search for the index of the last point with time <= target.
 */
function findIndex(points: TrackPoint[], time: number): number {
	let lo = 0;
	let hi = points.length - 1;

	if (time <= points[0].time) return 0;
	if (time >= points[hi].time) return hi;

	while (lo < hi - 1) {
		const mid = (lo + hi) >> 1;
		if (points[mid].time <= time) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	return lo;
}

/**
 * Interpolate a sailor's position at a given timestamp.
 * Returns null if the track has no data or the time is outside the track range.
 */
export function interpolatePosition(
	track: SailorTrack,
	timeMs: number
): InterpolatedPosition | null {
	const { points } = track;
	if (points.length === 0) return null;

	if (timeMs <= points[0].time) {
		return {
			x: points[0].x,
			y: points[0].y,
			rotation: points[0].rotation,
			speed: points[0].speed,
			tack: points[0].tack
		};
	}

	const last = points[points.length - 1];
	if (timeMs >= last.time) {
		return {
			x: last.x,
			y: last.y,
			rotation: last.rotation,
			speed: last.speed,
			tack: last.tack
		};
	}

	const i = findIndex(points, timeMs);
	const a = points[i];
	const b = points[i + 1];

	const dt = b.time - a.time;
	const t = dt > 0 ? (timeMs - a.time) / dt : 0;

	return {
		x: a.x + (b.x - a.x) * t,
		y: a.y + (b.y - a.y) * t,
		rotation: interpolateAngle(a.rotation, b.rotation, t),
		speed: a.speed + (b.speed - a.speed) * t,
		tack: t < 0.5 ? a.tack : b.tack
	};
}

/**
 * Interpolate between two angles (in degrees), taking the shortest path.
 */
function interpolateAngle(a: number, b: number, t: number): number {
	let diff = b - a;
	if (diff > 180) diff -= 360;
	if (diff < -180) diff += 360;
	return a + diff * t;
}

// --- GPS-level interpolation (lat/lon) ---

export interface InterpolatedGpsPosition {
	lat: number;
	lon: number;
	rotation: number; // heading degrees
	speed: number; // m/s
}

const METERS_PER_DEG_LAT = 111_320;

/**
 * Binary-search for the index of the last GPS point with time <= target.
 */
function findGpsIndex(points: GpsPoint[], timeMs: number): number {
	let lo = 0;
	let hi = points.length - 1;

	const firstMs = points[0].time.getTime();
	const lastMs = points[hi].time.getTime();

	if (timeMs <= firstMs) return 0;
	if (timeMs >= lastMs) return hi;

	while (lo < hi - 1) {
		const mid = (lo + hi) >> 1;
		if (points[mid].time.getTime() <= timeMs) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	return lo;
}

/**
 * Compute heading (degrees, 0=north, clockwise) and speed (m/s) between two GPS points.
 */
function gpsHeadingAndSpeed(
	a: GpsPoint,
	b: GpsPoint
): { rotation: number; speed: number } {
	const dtS = (b.time.getTime() - a.time.getTime()) / 1000;
	if (dtS <= 0) return { rotation: 0, speed: 0 };

	const cosLat = Math.cos(((a.lat + b.lat) / 2 * Math.PI) / 180);
	const dNorthM = (b.lat - a.lat) * METERS_PER_DEG_LAT;
	const dEastM = (b.lon - a.lon) * METERS_PER_DEG_LAT * cosLat;

	const rotation = (Math.atan2(dEastM, dNorthM) * 180) / Math.PI;
	const distM = Math.sqrt(dNorthM * dNorthM + dEastM * dEastM);

	return { rotation: ((rotation % 360) + 360) % 360, speed: distM / dtS };
}

/**
 * Interpolate a sailor's GPS position at a given timestamp.
 * Works directly on rawGps (lat/lon/Date), returning lat/lon coordinates
 * suitable for Leaflet map rendering.
 */
export function interpolateGpsPosition(
	track: SailorTrack,
	timeMs: number
): InterpolatedGpsPosition | null {
	const { rawGps } = track;
	if (rawGps.length === 0) return null;

	const firstMs = rawGps[0].time.getTime();
	const lastMs = rawGps[rawGps.length - 1].time.getTime();

	if (timeMs <= firstMs) {
		const hs = rawGps.length > 1 ? gpsHeadingAndSpeed(rawGps[0], rawGps[1]) : { rotation: 0, speed: 0 };
		return { lat: rawGps[0].lat, lon: rawGps[0].lon, ...hs };
	}

	if (timeMs >= lastMs) {
		const last = rawGps[rawGps.length - 1];
		const hs = rawGps.length > 1
			? gpsHeadingAndSpeed(rawGps[rawGps.length - 2], last)
			: { rotation: 0, speed: 0 };
		return { lat: last.lat, lon: last.lon, ...hs };
	}

	const i = findGpsIndex(rawGps, timeMs);
	const a = rawGps[i];
	const b = rawGps[i + 1];

	const aMs = a.time.getTime();
	const bMs = b.time.getTime();
	const dt = bMs - aMs;
	const t = dt > 0 ? (timeMs - aMs) / dt : 0;

	const hs = gpsHeadingAndSpeed(a, b);

	return {
		lat: a.lat + (b.lat - a.lat) * t,
		lon: a.lon + (b.lon - a.lon) * t,
		rotation: hs.rotation,
		speed: hs.speed
	};
}
