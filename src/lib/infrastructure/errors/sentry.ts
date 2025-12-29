/**
 * Sentry Error Tracking Integration
 * Provides error tracking capabilities using Sentry
 */

import type { AppError, ErrorSeverity } from './ErrorTypes';

/**
 * Sentry SDK interface (will be available when @sentry/sveltekit is installed)
 */
interface SentrySDK {
	captureException: (error: Error, options?: unknown) => void;
	captureMessage: (message: string, options?: unknown) => void;
	setUser: (user: { id: string; email?: string; username?: string }) => void;
	addBreadcrumb: (breadcrumb: {
		message: string;
		category: string;
		level: 'info' | 'warning' | 'error';
		data?: Record<string, unknown>;
	}) => void;
}

declare global {
	interface Window {
		Sentry?: SentrySDK | null;
	}
}

/**
 * Sentry configuration interface
 */
export interface SentryConfig {
	dsn: string;
	environment: string;
	enabled: boolean;
	tracesSampleRate?: number;
	replaysSessionSampleRate?: number;
	replaysOnErrorSampleRate?: number;
}

/**
 * Initialize Sentry (called from app initialization)
 * This will be implemented when @sentry/sveltekit is installed
 */
export function initializeSentry(config: SentryConfig): void {
	if (!config.enabled || !config.dsn) {
		return;
	}

	// Sentry initialization will be done in src/hooks.client.ts
	// This function is a placeholder for future use
}

/**
 * Capture an exception to Sentry
 */
export function captureException(error: Error | AppError, context?: Record<string, unknown>): void {
	if (typeof window === 'undefined') {
		// Server-side: Sentry will be initialized via hooks.server.ts
		return;
	}

	// Client-side: Sentry will capture via hooks.client.ts
	// This is a placeholder - actual implementation will use Sentry SDK
	try {
		if (window.Sentry) {
			window.Sentry.captureException(error, {
				contexts: {
					custom: context || {}
				},
				tags: {
					category: 'appError' in error ? (error as AppError).category : 'unknown',
					severity: 'appError' in error ? (error as AppError).severity : 'medium'
				}
			});
		}
	} catch (e) {
		// Silently fail if Sentry is not available
		console.warn('Sentry not available:', e);
	}
}

/**
 * Capture a message to Sentry
 */
export function captureMessage(
	message: string,
	level: 'info' | 'warning' | 'error' = 'info',
	context?: Record<string, unknown>
): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		if (window.Sentry) {
			window.Sentry.captureMessage(message, {
				level,
				contexts: {
					custom: context || {}
				}
			});
		}
	} catch (e) {
		// Silently fail if Sentry is not available
		console.warn('Sentry not available:', e);
	}
}

/**
 * Set user context for Sentry
 */
export function setUserContext(userId: string, email?: string, username?: string): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		if (window.Sentry) {
			window.Sentry.setUser({
				id: userId,
				email,
				username
			});
		}
	} catch (e) {
		// Silently fail if Sentry is not available
		console.warn('Sentry not available:', e);
	}
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
	message: string,
	category: string,
	level: 'info' | 'warning' | 'error' = 'info',
	data?: Record<string, unknown>
): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		if (window.Sentry) {
			window.Sentry.addBreadcrumb({
				message,
				category,
				level,
				data
			});
		}
	} catch (e) {
		// Silently fail if Sentry is not available
		console.warn('Sentry not available:', e);
	}
}

/**
 * Check if Sentry is enabled and configured
 */
export function isSentryEnabled(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	try {
		return !!window.Sentry;
	} catch {
		return false;
	}
}

/**
 * Get Sentry configuration from environment variables
 */
export function getSentryConfig(): SentryConfig {
	return {
		dsn: import.meta.env.VITE_SENTRY_DSN || '',
		environment: import.meta.env.MODE || 'development',
		enabled: import.meta.env.VITE_SENTRY_ENABLED === 'true' && !!import.meta.env.VITE_SENTRY_DSN,
		tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
		replaysSessionSampleRate: parseFloat(
			import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'
		),
		replaysOnErrorSampleRate: parseFloat(
			import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0'
		)
	};
}

