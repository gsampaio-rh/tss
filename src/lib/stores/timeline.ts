/**
 * Timeline Store
 *
 * Manages playback state for training session replay:
 * current time, play/pause, playback speed, and the rAF loop.
 */

import { writable, derived, get } from 'svelte/store';
import { session } from './session';
import { Boat } from '$lib/types/boat';
import { interpolatePosition } from '$lib/domain/services/TrackInterpolator';

// --- Playback state ---

export interface TimelineState {
	currentTime: number; // unix ms
	isPlaying: boolean;
	playbackSpeed: number; // 1 = real-time, 2 = 2x, etc.
}

const initialState: TimelineState = {
	currentTime: 0,
	isPlaying: false,
	playbackSpeed: 1
};

export const timeline = writable<TimelineState>(initialState);

// --- Derived: replay boats (Boat instances for the renderer) ---

export const replayBoats = derived([timeline, session], ([$timeline, $session]) => {
	if (!$session || $timeline.currentTime === 0) return [];

	return $session.tracks.map((track) => {
		const pos = interpolatePosition(track, $timeline.currentTime);
		const boat = new Boat(pos?.x ?? 0, pos?.y ?? 0, pos?.tack ?? false, track.color);
		boat.name = track.name;
		boat.rotation = pos?.rotation ?? 0;
		boat.isStart = false;
		boat.finished = false;
		return boat;
	});
});

// --- Playback loop (rAF) ---

let animFrameId: number | null = null;
let lastFrameTime: number | null = null;

function tick(now: number) {
	const state = get(timeline);
	const sess = get(session);

	if (!state.isPlaying || !sess) {
		animFrameId = null;
		lastFrameTime = null;
		return;
	}

	if (lastFrameTime !== null) {
		const wallDt = now - lastFrameTime; // ms of wall time
		const simDt = wallDt * state.playbackSpeed;
		const newTime = state.currentTime + simDt;

		if (newTime >= sess.endTime) {
			timeline.update((s) => ({ ...s, currentTime: sess.endTime, isPlaying: false }));
			animFrameId = null;
			lastFrameTime = null;
			return;
		}

		timeline.update((s) => ({ ...s, currentTime: newTime }));
	}

	lastFrameTime = now;
	animFrameId = requestAnimationFrame(tick);
}

function startLoop() {
	if (animFrameId !== null) return;
	lastFrameTime = null;
	animFrameId = requestAnimationFrame(tick);
}

function stopLoop() {
	if (animFrameId !== null) {
		cancelAnimationFrame(animFrameId);
		animFrameId = null;
	}
	lastFrameTime = null;
}

// --- Actions ---

export const timelineActions = {
	play() {
		const sess = get(session);
		if (!sess) return;

		timeline.update((s) => {
			let time = s.currentTime;
			// If at the end or not started, reset to start
			if (time >= sess.endTime || time === 0) {
				time = sess.startTime;
			}
			return { ...s, currentTime: time, isPlaying: true };
		});
		startLoop();
	},

	pause() {
		timeline.update((s) => ({ ...s, isPlaying: false }));
		stopLoop();
	},

	togglePlayPause() {
		const state = get(timeline);
		if (state.isPlaying) {
			this.pause();
		} else {
			this.play();
		}
	},

	seek(timeMs: number) {
		const sess = get(session);
		if (!sess) return;
		const clamped = Math.max(sess.startTime, Math.min(sess.endTime, timeMs));
		timeline.update((s) => ({ ...s, currentTime: clamped }));
	},

	setSpeed(speed: number) {
		timeline.update((s) => ({ ...s, playbackSpeed: speed }));
	},

	reset() {
		stopLoop();
		timeline.set(initialState);
	}
};

// Auto-reset timeline when session changes
session.subscribe((sess) => {
	if (sess) {
		timeline.set({
			currentTime: sess.startTime,
			isPlaying: false,
			playbackSpeed: 1
		});
	} else {
		timelineActions.reset();
	}
});
