import type { Readable } from 'svelte/store';

export interface MetricHistoryEntry<T> {
	turn: number;
	value: T;
	timestamp: number;
}

export interface UseMetricHistoryOptions {
	maxTurns?: number;
}

/**
 * Creates a reactive history tracker for a metric.
 * 
 * This is a helper function that returns the initial state and a function
 * to update the history. Use it in Svelte components like this:
 * 
 * ```svelte
 * <script>
 *   import { useMetricHistory } from './composables/useMetricHistory';
 *   import { turnCount } from '$lib/stores/game';
 *   
 *   export let vmg = 0;
 *   
 *   const { history, track } = useMetricHistory(() => vmg, { maxTurns: 60 });
 *   let lastTrackedTurn = -1;
 *   
 *   // Track history when turn changes
 *   $: if ($turnCount !== undefined && $turnCount !== lastTrackedTurn) {
 *     track($turnCount, vmg);
 *     lastTrackedTurn = $turnCount;
 *   }
 * </script>
 * ```
 */
export function useMetricHistory<T>(
	getValue: () => T,
	options: UseMetricHistoryOptions = {}
): {
	history: MetricHistoryEntry<T>[];
	track: (turn: number, value: T) => void;
	clear: () => void;
} {
	const { maxTurns = 60 } = options;
	const history: MetricHistoryEntry<T>[] = [];

	function track(turn: number, value: T) {
		if (value !== null && value !== undefined) {
			history.push({
				turn,
				value,
				timestamp: Date.now()
			});

			// Keep only last maxTurns entries
			if (history.length > maxTurns) {
				history.splice(0, history.length - maxTurns);
			}
		}
	}

	function clear() {
		history.length = 0;
	}

	return {
		history,
		track,
		clear
	};
}
