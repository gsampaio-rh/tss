/**
 * Game Store - Core State Only
 * Thin store that holds only game state, no business logic
 */

import { writable, derived } from 'svelte/store';
import type { Game } from '$lib/types/game';
import type { Boat } from '$lib/types/boat';
import type { WindScenario } from '$lib/types/wind';

// Core state stores
export const game = writable<Game | null>(null);
export const players = writable<Boat[]>([]);
export const turnCount = writable<number>(0);
export const isStart = writable<boolean>(true);
export const currentWindScenario = writable<WindScenario | null>(null);

// Derived stores
export const currentWind = derived([game, turnCount], ([$game, $turnCount]) => {
	if (!$game) return 0;
	// Use turnCount directly (not +1) so wind[0] is shown at start
	return $game.getWind($turnCount);
});

// Track previous wind for shift detection
export const previousWind = derived([game, turnCount], ([$game, $turnCount]) => {
	if (!$game || $turnCount === 0) return 0;
	return $game.getWind($turnCount - 1);
});

export const gameWidth = derived(game, $game => $game?.width ?? 0);
export const gameHeight = derived(game, $game => $game?.height ?? 0);
export const marks = derived(game, $game => $game?.marks ?? []);

