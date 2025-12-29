/**
 * useModal Hook
 * Provides modal state management
 */

import { writable } from 'svelte/store';

export interface UseModalReturn {
	isOpen: {
		subscribe: (callback: (value: boolean) => void) => () => void;
	};
	open: () => void;
	close: () => void;
	toggle: () => void;
}

/**
 * Hook for managing modal state
 */
export function useModal(initialState: boolean = false): UseModalReturn {
	const isOpen = writable(initialState);

	return {
		isOpen: {
			subscribe: isOpen.subscribe
		},
		open: () => isOpen.set(true),
		close: () => isOpen.set(false),
		toggle: () => isOpen.update(v => !v)
	};
}

