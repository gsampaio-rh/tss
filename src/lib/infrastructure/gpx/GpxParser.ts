/**
 * GPX Parser
 *
 * Parses GPX 1.1 XML files into GpsPoint arrays using the browser-native DOMParser.
 * Handles multiple tracks/segments, extracts lat, lon, time, and optional elevation.
 */

import type { GpsPoint, GpsBounds } from '$lib/types/session';

export interface GpxParseResult {
	name: string;
	points: GpsPoint[];
	bounds: GpsBounds;
}

/**
 * Parse a GPX XML string into structured data.
 * Extracts all trackpoints from all tracks and segments.
 */
export function parseGpx(xmlString: string): GpxParseResult {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xmlString, 'application/xml');

	const parseError = doc.querySelector('parsererror');
	if (parseError) {
		throw new Error(`Invalid GPX XML: ${parseError.textContent}`);
	}

	const name = extractTrackName(doc);
	const points = extractTrackPoints(doc);

	if (points.length === 0) {
		throw new Error('GPX file contains no trackpoints');
	}

	const bounds = computeBounds(points);

	return { name, points, bounds };
}

/**
 * Parse a GPX file (File object from file input / drag-and-drop).
 */
export async function parseGpxFile(file: File): Promise<GpxParseResult> {
	const text = await file.text();
	const result = parseGpx(text);

	if (!result.name || result.name === 'Unknown Track') {
		result.name = file.name.replace(/\.gpx$/i, '');
	}

	return result;
}

function extractTrackName(doc: Document): string {
	// Try <trk><name>, then <metadata><name>
	const trkName = doc.querySelector('trk > name');
	if (trkName?.textContent) return trkName.textContent.trim();

	const metaName = doc.querySelector('metadata > name');
	if (metaName?.textContent) return metaName.textContent.trim();

	return 'Unknown Track';
}

function extractTrackPoints(doc: Document): GpsPoint[] {
	const points: GpsPoint[] = [];
	const trkpts = doc.getElementsByTagName('trkpt');

	for (let i = 0; i < trkpts.length; i++) {
		const el = trkpts[i];
		const lat = parseFloat(el.getAttribute('lat') || '');
		const lon = parseFloat(el.getAttribute('lon') || '');

		if (isNaN(lat) || isNaN(lon)) continue;

		const timeEl = el.getElementsByTagName('time')[0];
		const eleEl = el.getElementsByTagName('ele')[0];

		const time = timeEl?.textContent ? new Date(timeEl.textContent.trim()) : new Date(0);
		const elevation = eleEl?.textContent ? parseFloat(eleEl.textContent.trim()) : undefined;

		points.push({ lat, lon, time, elevation });
	}

	// Sort by time (some devices may not guarantee order)
	points.sort((a, b) => a.time.getTime() - b.time.getTime());

	return points;
}

function computeBounds(points: GpsPoint[]): GpsBounds {
	let minLat = Infinity;
	let maxLat = -Infinity;
	let minLon = Infinity;
	let maxLon = -Infinity;

	for (const p of points) {
		if (p.lat < minLat) minLat = p.lat;
		if (p.lat > maxLat) maxLat = p.lat;
		if (p.lon < minLon) minLon = p.lon;
		if (p.lon > maxLon) maxLon = p.lon;
	}

	return { minLat, maxLat, minLon, maxLon };
}

/**
 * Merge bounds from multiple parse results into one.
 */
export function mergeBounds(results: GpxParseResult[]): GpsBounds {
	const all = results.map((r) => r.bounds);
	return {
		minLat: Math.min(...all.map((b) => b.minLat)),
		maxLat: Math.max(...all.map((b) => b.maxLat)),
		minLon: Math.min(...all.map((b) => b.minLon)),
		maxLon: Math.max(...all.map((b) => b.maxLon))
	};
}
