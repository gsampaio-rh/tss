/**
 * Store Composition Pattern
 * Utilities for composing multiple stores together
 */

import { derived, type Readable } from 'svelte/store';

/**
 * Compose multiple stores into a single derived store
 */
export function composeStores<T extends Record<string, Readable<unknown>>>(
	stores: T
): Readable<{ [K in keyof T]: T[K] extends Readable<infer V> ? V : never }> {
	const keys = Object.keys(stores) as Array<keyof T>;
	const storeArray = keys.map(key => stores[key]);

	return derived(storeArray, (values) => {
		const result = {} as { [K in keyof T]: T[K] extends Readable<infer V> ? V : never };
		keys.forEach((key, index) => {
			result[key] = values[index] as never;
		});
		return result;
	});
}

/**
 * Create a store that combines multiple stores with a selector function
 */
export function combineStores<T, R>(
	stores: Readable<unknown>[],
	selector: (...values: unknown[]) => R
): Readable<R> {
	return derived(stores, (values) => selector(...values));
}

/**
 * Create a store that selects a specific property from an object store
 */
export function selectStore<T, K extends keyof T>(
	store: Readable<T>,
	key: K
): Readable<T[K]> {
	return derived(store, (value) => value[key]);
}

/**
 * Create a store that filters values based on a predicate
 */
export function filterStore<T>(
	store: Readable<T[]>,
	predicate: (value: T) => boolean
): Readable<T[]> {
	return derived(store, (values) => values.filter(predicate));
}

/**
 * Create a store that maps values using a transform function
 */
export function mapStore<T, R>(
	store: Readable<T[]>,
	transform: (value: T) => R
): Readable<R[]> {
	return derived(store, (values) => values.map(transform));
}

