/**
 * useCollapse Hook
 * Provides collapse/expand state management
 */

import { writable } from 'svelte/store';

export interface UseCollapseReturn {
	isCollapsed: {
		subscribe: (callback: (value: boolean) => void) => () => void;
	};
	collapse: () => void;
	expand: () => void;
	toggle: () => void;
}

/**
 * Hook for managing collapse/expand state
 */
export function useCollapse(initialState: boolean = false): UseCollapseReturn {
	const isCollapsed = writable(initialState);

	return {
		isCollapsed: {
			subscribe: isCollapsed.subscribe
		},
		collapse: () => isCollapsed.set(true),
		expand: () => isCollapsed.set(false),
		toggle: () => isCollapsed.update(v => !v)
	};
}

