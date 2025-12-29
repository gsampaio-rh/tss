/**
 * Centralized error handling utilities
 */

import type { AppError } from './ErrorTypes';
import { logError } from '../logging/logger';
import { captureException, isSentryEnabled } from './sentry';

/**
 * Wraps an async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
	fn: T,
	errorMessage?: string
): T {
	return (async (...args: Parameters<T>) => {
		try {
			return await fn(...args);
		} catch (error) {
			handleError(error, errorMessage);
			throw error;
		}
	}) as T;
}

/**
 * Handles an error by logging it and optionally reporting to error tracking service
 */
export function handleError(error: unknown, context?: string): void {
	const errorMessage = context || 'An error occurred';

	if (error instanceof Error) {
		logError(errorMessage, error, 'ErrorHandler');

		// Report to Sentry if enabled
		if (isSentryEnabled()) {
			const errorContext = isAppError(error)
				? {
						category: error.category,
						severity: error.severity,
						code: error.code,
						...error.context
					}
				: { context: errorMessage };

			captureException(error, errorContext);
		}
	} else {
		const stringError = new Error(String(error));
		logError(errorMessage, stringError, 'ErrorHandler');

		// Report to Sentry if enabled
		if (isSentryEnabled()) {
			captureException(stringError, { context: errorMessage, originalError: String(error) });
		}
	}
}

/**
 * Checks if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
	return (
		typeof error === 'object' &&
		error !== null &&
		'severity' in error &&
		'category' in error &&
		'timestamp' in error
	);
}

/**
 * Creates a safe error handler for promises
 */
export function createErrorHandler(context: string) {
	return (error: unknown) => {
		handleError(error, context);
	};
}

