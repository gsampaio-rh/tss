/**
 * Course Detection Service
 *
 * Auto-detects race course features from GPS track data:
 * - Start line: where all boats converge at the beginning
 * - Windward mark: the highest point (most upwind) where boats round
 * - Leeward mark: the lowest point (most downwind) where boats round
 */

import type { SailorTrack, GpsPoint, CourseMark } from '$lib/types/session';

const CONVERGENCE_RADIUS_M = 50; // meters - boats within this radius are considered "converged"
const METERS_PER_DEG_LAT = 111_320;

/**
 * Compute distance in meters between two GPS points.
 */
function gpsDistanceM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
	const cosLat = Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
	const dLat = (b.lat - a.lat) * METERS_PER_DEG_LAT;
	const dLon = (b.lon - a.lon) * METERS_PER_DEG_LAT * cosLat;
	return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Compute the centroid of a set of GPS points.
 */
function centroid(points: { lat: number; lon: number }[]): { lat: number; lon: number } {
	let lat = 0, lon = 0;
	for (const p of points) {
		lat += p.lat;
		lon += p.lon;
	}
	return { lat: lat / points.length, lon: lon / points.length };
}

/**
 * Find the GPS point where a track reaches its most extreme latitude
 * in a given direction (north = windward for southern hemisphere sailing
 * in typical conditions, but we detect based on track geometry).
 */
function findExtremePoint(
	track: SailorTrack,
	direction: 'max-lat' | 'min-lat' | 'max-lon' | 'min-lon'
): GpsPoint | null {
	if (track.rawGps.length === 0) return null;

	let best = track.rawGps[0];
	for (const pt of track.rawGps) {
		switch (direction) {
			case 'max-lat': if (pt.lat > best.lat) best = pt; break;
			case 'min-lat': if (pt.lat < best.lat) best = pt; break;
			case 'max-lon': if (pt.lon > best.lon) best = pt; break;
			case 'min-lon': if (pt.lon < best.lon) best = pt; break;
		}
	}
	return best;
}

/**
 * Detect the start area by finding where boats are most clustered
 * at the beginning of their tracks.
 */
export function detectStartArea(tracks: SailorTrack[]): { lat: number; lon: number } | null {
	if (tracks.length < 2) {
		// With only one track, use the first point
		if (tracks.length === 1 && tracks[0].rawGps.length > 0) {
			return { lat: tracks[0].rawGps[0].lat, lon: tracks[0].rawGps[0].lon };
		}
		return null;
	}

	// Look at the first N seconds of each track
	const WINDOW_S = 60;
	const startPoints: GpsPoint[][] = tracks.map((t) => {
		if (t.rawGps.length === 0) return [];
		const startTime = t.rawGps[0].time.getTime();
		return t.rawGps.filter((p) => p.time.getTime() - startTime < WINDOW_S * 1000);
	});

	// Find the time window where boats are closest to each other
	let bestSpread = Infinity;
	let bestCenter = { lat: 0, lon: 0 };

	// Sample every 5 seconds within the first minute
	const allStartTimes = tracks.map((t) => t.rawGps[0]?.time.getTime() ?? 0);
	const globalStart = Math.min(...allStartTimes);

	for (let offset = 0; offset < WINDOW_S * 1000; offset += 5000) {
		const positions: { lat: number; lon: number }[] = [];

		for (const pts of startPoints) {
			if (pts.length === 0) continue;
			const targetTime = globalStart + offset;
			// Find closest point
			let closest = pts[0];
			let minDt = Math.abs(pts[0].time.getTime() - targetTime);
			for (const p of pts) {
				const dt = Math.abs(p.time.getTime() - targetTime);
				if (dt < minDt) {
					minDt = dt;
					closest = p;
				}
			}
			positions.push({ lat: closest.lat, lon: closest.lon });
		}

		if (positions.length < 2) continue;

		const center = centroid(positions);
		const maxDist = Math.max(...positions.map((p) => gpsDistanceM(p, center)));

		if (maxDist < bestSpread) {
			bestSpread = maxDist;
			bestCenter = center;
		}
	}

	return bestSpread < 500 ? bestCenter : null;
}

/**
 * Detect the windward mark by finding where boats round at the
 * most upwind position. We look for points that are:
 * 1. Far from the start
 * 2. Where heading changes significantly (rounding)
 * 3. Common across multiple tracks
 */
export function detectWindwardMark(
	tracks: SailorTrack[],
	windDirection?: number
): { lat: number; lon: number } | null {
	if (tracks.length === 0) return null;

	// Strategy: Find the extreme point in the upwind direction
	// If we know the wind, use that. Otherwise, find the point
	// farthest from the start cluster where boats turn.

	// Find rounding points per track (large heading changes away from start)
	const roundingPoints: { lat: number; lon: number }[] = [];

	for (const track of tracks) {
		const gps = track.rawGps;
		if (gps.length < 20) continue;

		// Skip the first 20% (start area) and look for heading reversals
		const skipCount = Math.floor(gps.length * 0.2);
		let bestExtreme: GpsPoint | null = null;

		if (windDirection !== undefined) {
			// Find the point farthest upwind
			const windRad = (windDirection * Math.PI) / 180;
			const windDirX = Math.sin(windRad);
			const windDirY = -Math.cos(windRad); // north = -y in lat space

			let maxUpwind = -Infinity;
			const startPt = gps[0];

			for (let i = skipCount; i < gps.length; i++) {
				const dLat = gps[i].lat - startPt.lat;
				const dLon = (gps[i].lon - startPt.lon) * Math.cos((startPt.lat * Math.PI) / 180);
				const upwindDist = dLat * windDirY + dLon * windDirX;

				if (upwindDist > maxUpwind) {
					maxUpwind = upwindDist;
					bestExtreme = gps[i];
				}
			}
		} else {
			// Without wind info, find the point farthest from start
			const startPt = gps[0];
			let maxDist = 0;

			for (let i = skipCount; i < gps.length; i++) {
				const dist = gpsDistanceM(startPt, gps[i]);
				if (dist > maxDist) {
					maxDist = dist;
					bestExtreme = gps[i];
				}
			}
		}

		if (bestExtreme) {
			roundingPoints.push({ lat: bestExtreme.lat, lon: bestExtreme.lon });
		}
	}

	if (roundingPoints.length === 0) return null;

	return centroid(roundingPoints);
}

/**
 * Auto-detect and return course marks.
 */
export function autoDetectCourse(
	tracks: SailorTrack[],
	windDirection?: number
): CourseMark[] {
	const marks: CourseMark[] = [];

	const startArea = detectStartArea(tracks);
	if (startArea) {
		// Place two start marks roughly perpendicular to wind direction, ~30m apart
		const offset = 0.00015; // ~15m in lat degrees
		const windRad = windDirection !== undefined
			? ((windDirection + 90) * Math.PI) / 180
			: (Math.PI / 2);

		const cosLat = Math.cos((startArea.lat * Math.PI) / 180);
		const dLat = Math.cos(windRad) * offset;
		const dLon = Math.sin(windRad) * offset / cosLat;

		marks.push({
			id: crypto.randomUUID(),
			type: 'start-port',
			lat: startArea.lat - dLat,
			lon: startArea.lon - dLon,
			label: 'Start (Port)'
		});

		marks.push({
			id: crypto.randomUUID(),
			type: 'start-starboard',
			lat: startArea.lat + dLat,
			lon: startArea.lon + dLon,
			label: 'Start (Stbd)'
		});
	}

	const windward = detectWindwardMark(tracks, windDirection);
	if (windward) {
		marks.push({
			id: crypto.randomUUID(),
			type: 'windward',
			lat: windward.lat,
			lon: windward.lon,
			label: 'Windward Mark'
		});
	}

	return marks;
}
