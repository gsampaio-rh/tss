/**
 * Generate sample GPX files simulating a barlavento-sotavento
 * (windward-leeward) 2-leg race at YCSA / Represa Guarapiranga.
 *
 * Course: Start → Windward Mark (upwind leg) → Leeward Mark (downwind leg)
 * Wind: South (180°) — boats beat north upwind, then run south downwind.
 *
 * Run: npx tsx scripts/generate-sample-gpx.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// --- Constants -----------------------------------------------------------

const CENTER_LAT = -23.7135;
const CENTER_LON = -46.7310;
const ELEVATION = 740;

const METERS_PER_DEG_LAT = 111_320;
const METERS_PER_DEG_LON = METERS_PER_DEG_LAT * Math.cos((CENTER_LAT * Math.PI) / 180);

const KNOTS_TO_MS = 0.51444;
const GPS_INTERVAL_S = 1;

// Wind from the south (180°) — blowing toward north
const BASE_WIND_DIR = 180;
const WIND_SHIFT_AMPLITUDE = 6;
const WIND_SHIFT_PERIOD_S = 120;

// Course geometry
const LEG_LENGTH_M = 500; // each leg: 500m
const COURSE_HALF_WIDTH_M = 100;
const START_SOUTH_OFFSET_M = -LEG_LENGTH_M / 2;
const WINDWARD_NORTH_M = LEG_LENGTH_M / 2;
const LEEWARD_SOUTH_M = START_SOUTH_OFFSET_M;

// Marks GPS positions (for reference in output)
const WINDWARD_MARK = offsetToLatLon(WINDWARD_NORTH_M, 0);
const LEEWARD_MARK = offsetToLatLon(LEEWARD_SOUTH_M, 0);

// --- Types ---------------------------------------------------------------

interface SailorConfig {
	name: string;
	filename: string;
	baseSpeedUpwind: number;
	baseSpeedDownwind: number;
	tackAngle: number;
	gybeAngle: number;
	tackIntervalBase: number;
	tackJitter: number;
	gybeIntervalBase: number;
	gybeJitter: number;
	startOffsetX: number;
	startDelay: number;
}

interface GpsPoint {
	lat: number;
	lon: number;
	ele: number;
	time: Date;
}

// --- Sailor configurations ------------------------------------------------

const SAILORS: SailorConfig[] = [
	{
		name: 'Bevy',
		filename: 'sailor_a.gpx',
		baseSpeedUpwind: 3.5,
		baseSpeedDownwind: 4.8,
		tackAngle: 43,
		gybeAngle: 30,
		tackIntervalBase: 50,
		tackJitter: 15,
		gybeIntervalBase: 70,
		gybeJitter: 20,
		startOffsetX: -20,
		startDelay: 0
	},
	{
		name: 'Maoli',
		filename: 'sailor_b.gpx',
		baseSpeedUpwind: 3.1,
		baseSpeedDownwind: 4.3,
		tackAngle: 45,
		gybeAngle: 28,
		tackIntervalBase: 60,
		tackJitter: 20,
		gybeIntervalBase: 80,
		gybeJitter: 15,
		startOffsetX: 0,
		startDelay: 3
	},
	{
		name: 'Olea',
		filename: 'sailor_c.gpx',
		baseSpeedUpwind: 3.3,
		baseSpeedDownwind: 4.5,
		tackAngle: 44,
		gybeAngle: 32,
		tackIntervalBase: 45,
		tackJitter: 12,
		gybeIntervalBase: 65,
		gybeJitter: 18,
		startOffsetX: 20,
		startDelay: 5
	}
];

// --- Helper functions -----------------------------------------------------

function windDirAtTime(elapsedS: number): number {
	const shift = WIND_SHIFT_AMPLITUDE * Math.sin((2 * Math.PI * elapsedS) / WIND_SHIFT_PERIOD_S);
	return BASE_WIND_DIR + shift;
}

function degToRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

function offsetToLatLon(northM: number, eastM: number): { lat: number; lon: number } {
	return {
		lat: CENTER_LAT + northM / METERS_PER_DEG_LAT,
		lon: CENTER_LON + eastM / METERS_PER_DEG_LON
	};
}

type Leg = 'upwind' | 'downwind' | 'rounding' | 'finished';

function generateTrack(sailor: SailorConfig, sessionStart: Date): GpsPoint[] {
	const points: GpsPoint[] = [];
	const upwindSpeedMs = sailor.baseSpeedUpwind * KNOTS_TO_MS;
	const downwindSpeedMs = sailor.baseSpeedDownwind * KNOTS_TO_MS;

	// Start at south end of course
	let northM = START_SOUTH_OFFSET_M;
	let eastM = sailor.startOffsetX;

	let leg: Leg = 'upwind';
	let onPortTack = true;
	let tackTimer = 0;
	let nextTackAt = sailor.tackIntervalBase + (Math.random() - 0.5) * sailor.tackJitter;
	let roundingTimer = 0;
	const ROUNDING_DURATION_S = 12;
	let roundingCenterEast = 0;
	let roundingStartHeading = 0;

	const MAX_DURATION_S = 20 * 60;

	for (let elapsed = 0; elapsed < MAX_DURATION_S; elapsed += GPS_INTERVAL_S) {
		// Pre-start drift
		if (elapsed < sailor.startDelay) {
			const driftSpeed = 0.3 * KNOTS_TO_MS;
			northM += driftSpeed * GPS_INTERVAL_S * 0.1;
			eastM += (Math.random() - 0.5) * 0.3;
			const pos = offsetToLatLon(northM, eastM);
			points.push({
				lat: pos.lat,
				lon: pos.lon,
				ele: ELEVATION,
				time: new Date(sessionStart.getTime() + elapsed * 1000)
			});
			continue;
		}

		const windDir = windDirAtTime(elapsed);

		if (leg === 'upwind') {
			// Wind from south (180°), upwind direction is north (0°)
			// Upwind heading = 0° +/- tackAngle
			const tackSign = onPortTack ? 1 : -1;
			const heading = tackSign * sailor.tackAngle; // relative to north (0°)
			const headingRad = degToRad(heading);

			const speedVariation = 0.88 + Math.random() * 0.24;
			const effectiveSpeed = upwindSpeedMs * speedVariation;

			northM += effectiveSpeed * GPS_INTERVAL_S * Math.cos(headingRad);
			eastM += effectiveSpeed * GPS_INTERVAL_S * Math.sin(headingRad);

			// Tacking logic
			tackTimer += GPS_INTERVAL_S;
			const hitBoundary =
				(eastM > COURSE_HALF_WIDTH_M && onPortTack) ||
				(eastM < -COURSE_HALF_WIDTH_M && !onPortTack);

			if (tackTimer >= nextTackAt || hitBoundary) {
				onPortTack = !onPortTack;
				tackTimer = 0;
				nextTackAt = sailor.tackIntervalBase + (Math.random() - 0.5) * sailor.tackJitter;
			}

			// Reached windward mark?
			if (northM >= WINDWARD_NORTH_M) {
				leg = 'rounding';
				roundingTimer = 0;
				roundingCenterEast = eastM;
				roundingStartHeading = onPortTack ? sailor.tackAngle : -sailor.tackAngle;
			}
		} else if (leg === 'rounding') {
			// Smooth rounding at the windward mark
			roundingTimer += GPS_INTERVAL_S;
			const t = roundingTimer / ROUNDING_DURATION_S;

			// Arc from upwind heading to downwind heading
			const endHeading = 180 + (Math.random() > 0.5 ? sailor.gybeAngle : -sailor.gybeAngle);
			const currentHeading = roundingStartHeading + (endHeading - roundingStartHeading) * Math.min(1, t);
			const headingRad = degToRad(currentHeading);

			const roundingSpeed = upwindSpeedMs * 0.6;
			northM += roundingSpeed * GPS_INTERVAL_S * Math.cos(headingRad);
			eastM += roundingSpeed * GPS_INTERVAL_S * Math.sin(headingRad);

			if (roundingTimer >= ROUNDING_DURATION_S) {
				leg = 'downwind';
				onPortTack = eastM > 0;
				tackTimer = 0;
				nextTackAt = sailor.gybeIntervalBase + (Math.random() - 0.5) * sailor.gybeJitter;
			}
		} else if (leg === 'downwind') {
			// Downwind: heading roughly 180° (south) +/- gybeAngle
			const gybeSign = onPortTack ? 1 : -1;
			const heading = 180 + gybeSign * sailor.gybeAngle;
			const headingRad = degToRad(heading);

			const speedVariation = 0.9 + Math.random() * 0.2;
			const effectiveSpeed = downwindSpeedMs * speedVariation;

			northM += effectiveSpeed * GPS_INTERVAL_S * Math.cos(headingRad);
			eastM += effectiveSpeed * GPS_INTERVAL_S * Math.sin(headingRad);

			// Gybing logic
			tackTimer += GPS_INTERVAL_S;
			const hitBoundary =
				(eastM > COURSE_HALF_WIDTH_M && onPortTack) ||
				(eastM < -COURSE_HALF_WIDTH_M && !onPortTack);

			if (tackTimer >= nextTackAt || hitBoundary) {
				onPortTack = !onPortTack;
				tackTimer = 0;
				nextTackAt = sailor.gybeIntervalBase + (Math.random() - 0.5) * sailor.gybeJitter;
			}

			// Reached leeward mark / finish?
			if (northM <= LEEWARD_SOUTH_M) {
				leg = 'finished';
			}
		} else {
			// Finished: drift slowly
			const driftSpeed = 0.5 * KNOTS_TO_MS;
			northM -= driftSpeed * GPS_INTERVAL_S * 0.1;
			eastM += (Math.random() - 0.5) * 0.2;
		}

		const pos = offsetToLatLon(northM, eastM);
		points.push({
			lat: pos.lat,
			lon: pos.lon,
			ele: ELEVATION + (Math.random() - 0.5) * 0.5,
			time: new Date(sessionStart.getTime() + elapsed * 1000)
		});

		if (leg === 'finished' && elapsed > sailor.startDelay + 30) {
			// Add a few more points after finish then stop
			const pointsAfterFinish = points.filter(
				(p) => p.time.getTime() > sessionStart.getTime() + (elapsed - 15) * 1000
			);
			if (pointsAfterFinish.length > 15) break;
		}
	}

	return points;
}

// --- GPX formatting -------------------------------------------------------

function formatGpx(name: string, points: GpsPoint[]): string {
	const trkpts = points
		.map((p) => {
			const timeStr = p.time.toISOString();
			return `      <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}">
        <ele>${p.ele.toFixed(1)}</ele>
        <time>${timeStr}</time>
      </trkpt>`;
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TSS Sample Generator"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${name} - YCSA Guarapiranga Training</name>
    <time>${points[0].time.toISOString()}</time>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

// --- Main -----------------------------------------------------------------

function main() {
	const outDir = join(process.cwd(), 'sample-gpx');
	if (!existsSync(outDir)) {
		mkdirSync(outDir, { recursive: true });
	}

	const sessionStart = new Date('2025-03-15T10:00:00-03:00');

	console.log('Generating barlavento-sotavento GPX files for YCSA / Represa Guarapiranga...');
	console.log(`  Center: ${CENTER_LAT}, ${CENTER_LON}`);
	console.log(`  Course: Windward-Leeward, ${LEG_LENGTH_M}m per leg`);
	console.log(`  Wind: South (${BASE_WIND_DIR}°) +/- ${WIND_SHIFT_AMPLITUDE}°`);
	console.log(`  Windward mark: ${WINDWARD_MARK.lat.toFixed(6)}, ${WINDWARD_MARK.lon.toFixed(6)}`);
	console.log(`  Leeward mark:  ${LEEWARD_MARK.lat.toFixed(6)}, ${LEEWARD_MARK.lon.toFixed(6)}`);
	console.log();

	for (const sailor of SAILORS) {
		const track = generateTrack(sailor, sessionStart);
		const gpx = formatGpx(sailor.name, track);
		const filepath = join(outDir, sailor.filename);
		writeFileSync(filepath, gpx, 'utf-8');

		const distKm = estimateDistance(track);
		console.log(
			`  ${sailor.name}: ${track.length} points, ~${distKm.toFixed(2)} km → ${sailor.filename}`
		);
	}

	console.log(`\nFiles written to ${outDir}/`);
}

function estimateDistance(points: GpsPoint[]): number {
	let totalM = 0;
	for (let i = 1; i < points.length; i++) {
		const dLat = (points[i].lat - points[i - 1].lat) * METERS_PER_DEG_LAT;
		const dLon = (points[i].lon - points[i - 1].lon) * METERS_PER_DEG_LON;
		totalM += Math.sqrt(dLat * dLat + dLon * dLon);
	}
	return totalM / 1000;
}

main();
