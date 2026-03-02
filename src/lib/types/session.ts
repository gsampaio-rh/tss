/**
 * Types for GPX-based training session replay.
 */

import type { Mark } from './game';

// --- Race Course Marks (placed on map in GPS coordinates) ---

export type CourseMarkType =
	| 'start-port'
	| 'start-starboard'
	| 'windward'
	| 'leeward'
	| 'gate-port'
	| 'gate-starboard';

export interface CourseMark {
	id: string;
	type: CourseMarkType;
	lat: number;
	lon: number;
	label: string;
}

export interface RaceCourse {
	marks: CourseMark[];
}

// --- Maneuver Detection ---

export type ManeuverType = 'tack' | 'gybe';

export interface Maneuver {
	type: ManeuverType;
	time: number; // unix ms at maneuver midpoint
	duration: number; // seconds
	headingBefore: number; // degrees
	headingAfter: number; // degrees
	headingChange: number; // absolute degrees
	speedBefore: number; // m/s
	speedMin: number; // m/s (speed lost during maneuver)
	speedAfter: number; // m/s
	distanceLost: number; // meters of VMG distance lost during maneuver
}

// --- Raw GPS data (parsed from GPX) ---

export interface GpsPoint {
	lat: number;
	lon: number;
	time: Date;
	elevation?: number;
}

// --- Projected track data (in game coordinate units) ---

export interface TrackPoint {
	x: number;
	y: number;
	time: number; // unix ms
	rotation: number; // heading in degrees (0 = north, clockwise)
	speed: number; // m/s
	tack: boolean; // port = true, starboard = false (inferred from heading vs wind)
}

export interface TrackStats {
	totalDistanceM: number;
	tackCount: number;
	durationS: number;
	avgSpeedKnots: number;
	maxSpeedKnots: number;
}

export interface SailorTrack {
	name: string;
	color: string;
	points: TrackPoint[];
	rawGps: GpsPoint[];
	stats: TrackStats;
}

// --- Wind timeline ---

export type WindSource = 'manual' | 'estimated' | 'api';

export interface WindEntry {
	time: number; // unix ms
	direction: number; // degrees true (where wind comes FROM)
	speed: number; // knots
}

export interface WindTimeline {
	source: WindSource;
	entries: WindEntry[];
}

// --- GPS bounding box ---

export interface GpsBounds {
	minLat: number;
	maxLat: number;
	minLon: number;
	maxLon: number;
}

// --- Training session (top-level model) ---

export interface TrainingSession {
	id: string;
	name: string;
	date: Date;
	tracks: SailorTrack[];
	bounds: GpsBounds;
	gameWidth: number;
	gameHeight: number;
	startTime: number; // earliest timestamp across all tracks (unix ms)
	endTime: number; // latest timestamp across all tracks (unix ms)
	wind: WindTimeline;
	marks: Mark[];
	raceCourse: RaceCourse;
}

// --- Leg Detection ---

export type LegType = 'upwind' | 'downwind' | 'reach';

export interface LegStats {
	avgSOG: number; // knots
	maxSOG: number; // knots
	avgVMG: number; // knots
	avgTWA: number; // degrees
	distance: number; // meters
	duration: number; // seconds
	tackCount: number;
	gybeCount: number;
}

export interface Leg {
	type: LegType;
	legNumber: number;
	startIdx: number;
	endIdx: number;
	startTime: number; // unix ms
	endTime: number; // unix ms
	stats: LegStats;
}

// --- Track Color Modes ---

export type TrackColorMode = 'boat' | 'speed' | 'favouredTack';

// --- Performance Scores ---

export interface PerformanceScore {
	sailorName: string;
	color: string;
	axes: number[]; // 6 values, 0-100
}

// --- Wind Shift Analysis ---

export interface WindShiftPoint {
	index: number;
	shiftDeg: number;
	side: 'left' | 'right';
}

export interface FavouredTackData {
	shiftPoints: WindShiftPoint[];
	meanTWA: number;
	rightSidePercent: number;
	leftSidePercent: number;
	rightShiftPercent: number;
	leftShiftPercent: number;
}

// --- App mode ---

export type AppMode = 'simulation' | 'replay';
