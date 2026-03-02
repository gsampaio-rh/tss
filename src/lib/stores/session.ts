/**
 * Session Store
 *
 * Manages the training session state for GPX replay mode,
 * including the app mode toggle (simulation vs replay).
 */

import { writable, derived } from 'svelte/store';
import type { TrainingSession, SailorTrack, AppMode } from '$lib/types/session';
import { parseGpxFile, mergeBounds, type GpxParseResult } from '$lib/infrastructure/gpx/GpxParser';
import {
	createTransformer,
	projectTrack,
	computeTrackStats
} from '$lib/domain/services/CoordinateTransformService';
import { COLORS } from '$lib/types/game';

// --- App mode ---

export const appMode = writable<AppMode>('simulation');

// --- Session state ---

export const session = writable<TrainingSession | null>(null);

// --- Derived stores for replay mode ---

export const replayTracks = derived(session, ($session) =>
	$session ? $session.tracks : []
);

export const replayBounds = derived(session, ($session) =>
	$session ? $session.bounds : null
);

export const sessionDuration = derived(session, ($session) =>
	$session ? ($session.endTime - $session.startTime) / 1000 : 0
);

// --- Default game dimensions for replay ---

const REPLAY_GAME_WIDTH = 40;
const REPLAY_GAME_HEIGHT = 30;
const REPLAY_PADDING = 2;

// --- Actions ---

export const sessionActions = {
	/**
	 * Import multiple GPX files and create a TrainingSession.
	 */
	async importGpxFiles(files: File[]): Promise<TrainingSession> {
		const parseResults: GpxParseResult[] = [];

		for (const file of files) {
			const result = await parseGpxFile(file);
			parseResults.push(result);
		}

		const combinedBounds = mergeBounds(parseResults);
		const transformer = createTransformer({
			bounds: combinedBounds,
			gameWidth: REPLAY_GAME_WIDTH,
			gameHeight: REPLAY_GAME_HEIGHT,
			padding: REPLAY_PADDING
		});

		const tracks: SailorTrack[] = parseResults.map((result, i) => {
			const projected = projectTrack(result.points, transformer);
			const stats = computeTrackStats(projected, transformer.metersPerGameUnit);

			return {
				name: result.name,
				color: COLORS[i % COLORS.length],
				points: projected,
				rawGps: result.points,
				stats
			};
		});

		// Compute session time bounds
		let startTime = Infinity;
		let endTime = -Infinity;
		for (const track of tracks) {
			if (track.points.length > 0) {
				const first = track.points[0].time;
				const last = track.points[track.points.length - 1].time;
				if (first < startTime) startTime = first;
				if (last > endTime) endTime = last;
			}
		}

		const newSession: TrainingSession = {
			id: crypto.randomUUID(),
			name: `Training ${new Date(startTime).toLocaleDateString()}`,
			date: new Date(startTime),
			tracks,
			bounds: combinedBounds,
			gameWidth: REPLAY_GAME_WIDTH,
			gameHeight: REPLAY_GAME_HEIGHT,
			startTime,
			endTime,
			wind: {
				source: 'manual',
				entries: [{ time: startTime, direction: 0, speed: 8 }]
			},
			marks: [],
			raceCourse: { marks: [] }
		};

		session.set(newSession);
		appMode.set('replay');

		return newSession;
	},

	/**
	 * Update the color of a specific sailor track.
	 */
	setSailorColor(trackIndex: number, color: string) {
		session.update(($session) => {
			if (!$session || trackIndex < 0 || trackIndex >= $session.tracks.length) return $session;
			const tracks = [...$session.tracks];
			tracks[trackIndex] = { ...tracks[trackIndex], color };
			return { ...$session, tracks };
		});
	},

	/**
	 * Clear the current session and return to simulation mode.
	 */
	clearSession() {
		session.set(null);
		appMode.set('simulation');
	}
};
