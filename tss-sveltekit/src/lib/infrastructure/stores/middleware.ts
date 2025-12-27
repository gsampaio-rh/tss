/**
 * Store Middleware
 * Provides middleware functionality for Svelte stores (logging, persistence, error handling)
 */

import { get, writable, type Writable, type Readable } from 'svelte/store';
import { logger } from '../logging/logger';
import { handleError } from '../errors/errorHandler';
import type { AppError } from '../errors/ErrorTypes';

export interface StoreMiddleware<T> {
	beforeUpdate?: (current: T, next: T) => T | void;
	afterUpdate?: (value: T) => void;
	onError?: (error: unknown) => void;
}

/**
 * Creates a writable store with middleware support
 */
export function createStoreWithMiddleware<T>(
	initialValue: T,
	middlewares: StoreMiddleware<T>[] = []
): Writable<T> {
	const { subscribe, set, update } = writable(initialValue);

	const enhancedSet = (value: T): void => {
		try {
			const current = get({ subscribe });
			let processedValue = value;

			// Run beforeUpdate middlewares
			for (const middleware of middlewares) {
				if (middleware.beforeUpdate) {
					const result = middleware.beforeUpdate(current, processedValue);
					if (result !== undefined) {
						processedValue = result;
					}
				}
			}

			set(processedValue);

			// Run afterUpdate middlewares
			for (const middleware of middlewares) {
				if (middleware.afterUpdate) {
					middleware.afterUpdate(processedValue);
				}
			}
		} catch (error) {
			handleError(error, 'createStoreWithMiddleware.set');
			for (const middleware of middlewares) {
				if (middleware.onError) {
					middleware.onError(error);
				}
			}
			throw error;
		}
	};

	const enhancedUpdate = (updater: (value: T) => T): void => {
		try {
			const current = get({ subscribe });
			let processedValue = updater(current);

			// Run beforeUpdate middlewares
			for (const middleware of middlewares) {
				if (middleware.beforeUpdate) {
					const result = middleware.beforeUpdate(current, processedValue);
					if (result !== undefined) {
						processedValue = result;
					}
				}
			}

			set(processedValue);

			// Run afterUpdate middlewares
			for (const middleware of middlewares) {
				if (middleware.afterUpdate) {
					middleware.afterUpdate(processedValue);
				}
			}
		} catch (error) {
			handleError(error, 'createStoreWithMiddleware.update');
			for (const middleware of middlewares) {
				if (middleware.onError) {
					middleware.onError(error);
				}
			}
			throw error;
		}
	};

	return {
		subscribe,
		set: enhancedSet,
		update: enhancedUpdate
	};
}

/**
 * Logging middleware - logs all store updates
 */
export function createLoggingMiddleware<T>(storeName: string): StoreMiddleware<T> {
	return {
		beforeUpdate: (current, next) => {
			logger.debug(`[Store: ${storeName}] Updating`, 'StoreMiddleware', { current, next });
			return undefined; // Don't modify the value
		},
		afterUpdate: (value) => {
			logger.debug(`[Store: ${storeName}] Updated`, 'StoreMiddleware', { value });
		},
		onError: (error) => {
			logger.error(`[Store: ${storeName}] Error`, error instanceof Error ? error : new Error(String(error)), 'StoreMiddleware');
		}
	};
}

/**
 * Persistence middleware - persists store value to localStorage
 */
export function createPersistenceMiddleware<T>(
	key: string,
	serialize: (value: T) => string = JSON.stringify,
	deserialize: (value: string) => T = JSON.parse
): StoreMiddleware<T> {
	// Load initial value from localStorage if available
	try {
		const stored = localStorage.getItem(key);
		if (stored !== null) {
			const parsed = deserialize(stored);
			return {
				afterUpdate: (value) => {
					try {
						localStorage.setItem(key, serialize(value));
					} catch (error) {
						logger.warn(`[Persistence: ${key}] Failed to persist`, 'StoreMiddleware', { error });
					}
				}
			};
		}
	} catch (error) {
		logger.warn(`[Persistence: ${key}] Failed to load`, 'StoreMiddleware', { error });
	}

	return {
		afterUpdate: (value) => {
			try {
				localStorage.setItem(key, serialize(value));
			} catch (error) {
				logger.warn(`[Persistence: ${key}] Failed to persist`, 'StoreMiddleware', { error });
			}
		}
	};
}

/**
 * Error handling middleware - catches and handles errors
 */
export function createErrorHandlingMiddleware<T>(): StoreMiddleware<T> {
	return {
		onError: (error) => {
			handleError(error, 'errorHandling');
		}
	};
}

