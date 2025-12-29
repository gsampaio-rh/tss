/**
 * Client-side hooks for SvelteKit
 * Initialize Sentry here when package is installed
 */

import { dev } from '$app/environment';
import { getSentryConfig } from '$lib/infrastructure/errors/sentry';

// Sentry initialization (commented out until @sentry/sveltekit is installed)
// Uncomment and configure when Sentry package is installed:
/*
import * as Sentry from '@sentry/sveltekit';

const config = getSentryConfig();

if (config.enabled) {
	Sentry.init({
		dsn: config.dsn,
		environment: config.environment,
		tracesSampleRate: config.tracesSampleRate,
		replaysSessionSampleRate: config.replaysSessionSampleRate,
		replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
		integrations: [
			Sentry.browserTracingIntegration(),
			Sentry.replayIntegration({
				maskAllText: true,
				blockAllMedia: true
			})
		]
	});
}
*/

// Placeholder for Sentry error handling
if (typeof window !== 'undefined') {
	window.Sentry = null; // Will be set when Sentry is initialized

	// Global error handler
	window.addEventListener('error', (event) => {
		if (dev) {
			console.error('Unhandled error:', event.error);
		}
		// Sentry will capture this automatically when initialized
	});

	// Unhandled promise rejection handler
	window.addEventListener('unhandledrejection', (event) => {
		if (dev) {
			console.error('Unhandled promise rejection:', event.reason);
		}
		// Sentry will capture this automatically when initialized
	});
}

