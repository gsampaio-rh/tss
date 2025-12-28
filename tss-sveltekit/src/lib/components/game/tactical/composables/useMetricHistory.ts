import { writable } from 'svelte/store';

export interface MetricHistoryEntry<T> {
	turn: number;
	value: T;
	timestamp: number;
}

export interface UseMetricHistoryOptions {
	maxTurns?: number;
}

/**
 * Creates a reactive history tracker for a metric using a Svelte store.
 * 
 * This is a helper function that returns a reactive store and a function
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
	history: ReturnType<typeof writable<MetricHistoryEntry<T>[]>>;
	track: (turn: number, value: T) => void;
	clear: () => void;
} {
	const { maxTurns = 60 } = options;
	const history = writable<MetricHistoryEntry<T>[]>([]);

	function track(turn: number, value: T) {
		console.log('[useMetricHistory] track called', { turn, value });
		if (value !== null && value !== undefined) {
			history.update((current) => {
				const updated = [
					...current,
					{
						turn,
						value,
						timestamp: Date.now()
					}
				];

				// Keep only last maxTurns entries
				const final = updated.length > maxTurns ? updated.slice(-maxTurns) : updated;
				console.log('[useMetricHistory] history updated', { turn, historyLength: final.length, lastEntry: final[final.length - 1] });
				return final;
			});
		} else {
			console.log('[useMetricHistory] value is null/undefined, skipping', { value });
		}
	}

	function clear() {
		history.set([]);
	}

	return {
		history,
		track,
		clear
	};
}
