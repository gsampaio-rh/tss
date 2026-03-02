/**
 * Coordinate Transform Service
 *
 * Projects GPS coordinates (lat/lon) to game-unit coordinates (x, y)
 * using an equirectangular projection centered on the track midpoint.
 *
 * The projection is accurate within a few kilometers, which is more than
 * sufficient for a sailing race course.
 */

import type { GpsPoint, GpsBounds, TrackPoint } from '$lib/types/session';

const METERS_PER_DEG_LAT = 111_320;
const MS_TO_KNOTS = 1.94384;

export interface TransformConfig {
	bounds: GpsBounds;
	gameWidth: number;
	gameHeight: number;
	padding: number; // game-unit padding around edges
}

export interface CoordinateTransformer {
	toGameUnits: (lat: number, lon: number) => { x: number; y: number };
	metersPerGameUnit: number;
	centerLat: number;
	centerLon: number;
}

/**
 * Create a coordinate transformer from GPS bounds to game units.
 *
 * The transformer:
 * - Centers the projection on the bounds midpoint
 * - Fits the GPS extent into gameWidth x gameHeight while preserving aspect ratio
 * - Inverts the Y axis (GPS: north = +lat, Game: north = small y)
 * - Applies padding so tracks don't touch the edges
 */
export function createTransformer(config: TransformConfig): CoordinateTransformer {
	const { bounds, gameWidth, gameHeight, padding } = config;

	const centerLat = (bounds.minLat + bounds.maxLat) / 2;
	const centerLon = (bounds.minLon + bounds.maxLon) / 2;
	const cosLat = Math.cos((centerLat * Math.PI) / 180);
	const metersPerDegLon = METERS_PER_DEG_LAT * cosLat;

	// Extent in meters
	const extentNorthM = (bounds.maxLat - bounds.minLat) * METERS_PER_DEG_LAT;
	const extentEastM = (bounds.maxLon - bounds.minLon) * metersPerDegLon;

	// Available game area (after padding)
	const availW = gameWidth - 2 * padding;
	const availH = gameHeight - 2 * padding;

	// Scale: pick the axis that constrains, so the course fits with preserved aspect ratio
	const scaleX = extentEastM > 0 ? availW / extentEastM : 1;
	const scaleY = extentNorthM > 0 ? availH / extentNorthM : 1;
	const scale = Math.min(scaleX, scaleY);

	const metersPerGameUnit = 1 / scale;

	function toGameUnits(lat: number, lon: number): { x: number; y: number } {
		const dNorthM = (lat - centerLat) * METERS_PER_DEG_LAT;
		const dEastM = (lon - centerLon) * metersPerDegLon;

		// Center in game area; invert Y so north (positive lat) maps to smaller y
		const x = gameWidth / 2 + dEastM * scale;
		const y = gameHeight / 2 - dNorthM * scale;

		return { x, y };
	}

	return { toGameUnits, metersPerGameUnit, centerLat, centerLon };
}

/**
 * Project an array of GpsPoints to TrackPoints using a transformer.
 * Computes heading and speed from consecutive points.
 */
export function projectTrack(
	gpsPoints: GpsPoint[],
	transformer: CoordinateTransformer
): TrackPoint[] {
	const trackPoints: TrackPoint[] = [];

	for (let i = 0; i < gpsPoints.length; i++) {
		const gps = gpsPoints[i];
		const { x, y } = transformer.toGameUnits(gps.lat, gps.lon);
		const time = gps.time.getTime();

		let rotation = 0;
		let speed = 0;

		if (i > 0) {
			const prev = trackPoints[i - 1];
			const dt = (time - prev.time) / 1000;

			if (dt > 0) {
				const dx = x - prev.x;
				const dy = y - prev.y;
				// Heading: 0=north, clockwise. atan2(dx, -dy) matches the game convention
				rotation = (Math.atan2(dx, -dy) * 180) / Math.PI;

				const distGameUnits = Math.sqrt(dx * dx + dy * dy);
				const distMeters = distGameUnits * transformer.metersPerGameUnit;
				speed = distMeters / dt; // m/s
			} else {
				rotation = prev.rotation;
			}
		} else if (gpsPoints.length > 1) {
			// First point: use heading toward second point
			const next = transformer.toGameUnits(gpsPoints[1].lat, gpsPoints[1].lon);
			const dx = next.x - x;
			const dy = next.y - y;
			rotation = (Math.atan2(dx, -dy) * 180) / Math.PI;
		}

		trackPoints.push({
			x,
			y,
			time,
			rotation,
			speed,
			tack: false // will be set by wind analysis later
		});
	}

	return trackPoints;
}

/**
 * Compute stats for a projected track.
 */
export function computeTrackStats(
	points: TrackPoint[],
	metersPerGameUnit: number
): { totalDistanceM: number; tackCount: number; durationS: number; avgSpeedKnots: number; maxSpeedKnots: number } {
	let totalDistanceM = 0;
	let maxSpeed = 0;
	let tackCount = 0;

	for (let i = 1; i < points.length; i++) {
		const dx = points[i].x - points[i - 1].x;
		const dy = points[i].y - points[i - 1].y;
		totalDistanceM += Math.sqrt(dx * dx + dy * dy) * metersPerGameUnit;

		if (points[i].speed > maxSpeed) maxSpeed = points[i].speed;

		// Detect tack: heading change > 60 degrees between consecutive points
		const headingDiff = Math.abs(points[i].rotation - points[i - 1].rotation);
		const normalizedDiff = headingDiff > 180 ? 360 - headingDiff : headingDiff;
		if (normalizedDiff > 60) tackCount++;
	}

	const durationS = points.length > 1
		? (points[points.length - 1].time - points[0].time) / 1000
		: 0;
	const avgSpeedMs = durationS > 0 ? totalDistanceM / durationS : 0;

	return {
		totalDistanceM,
		tackCount,
		durationS,
		avgSpeedKnots: avgSpeedMs * MS_TO_KNOTS,
		maxSpeedKnots: maxSpeed * MS_TO_KNOTS
	};
}
