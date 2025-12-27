/**
 * useTactical Hook
 * Provides tactical analysis operations
 */

import { get } from 'svelte/store';
import { game, turnCount, players } from '$lib/stores/game';
import { TacticalInsightsService } from '$lib/application/services/TacticalInsightsService';
import type { TacticalInsight } from '$lib/application/services/TacticalInsightsService';
import type { Boat } from '$lib/types/boat';

export function useTactical() {
	return {
		// Get tactical insight for a boat
		getInsight(boat: Boat): TacticalInsight | null {
			const currentGame = get(game);
			const currentTurnCount = get(turnCount);
			if (!currentGame) return null;
			return TacticalInsightsService.getTacticalInsight(boat, currentGame, currentTurnCount);
		},

		// Get all tactical insights
		get allInsights(): TacticalInsight[] {
			const currentGame = get(game);
			const currentTurnCount = get(turnCount);
			if (!currentGame) return [];
			return TacticalInsightsService.getAllTacticalInsights(currentGame, currentTurnCount);
		},

		// Get insights for specific boats
		getInsightsForBoats(boatIndices: number[]): TacticalInsight[] {
			const allPlayers = get(players);
			const currentGame = get(game);
			const currentTurnCount = get(turnCount);
			if (!currentGame) return [];

			return boatIndices
				.map(index => allPlayers[index])
				.filter(Boolean)
				.map(boat => TacticalInsightsService.getTacticalInsight(boat, currentGame, currentTurnCount));
		}
	};
}


