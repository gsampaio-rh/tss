/**
 * Server-side hooks for SvelteKit
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
		tracesSampleRate: config.tracesSampleRate
	});
}
*/

// Handle server-side errors
export const handleError = ({ error, event }: { error: unknown; event: unknown }) => {
	if (dev) {
		console.error('Server error:', error);
	}

	// Sentry will capture this automatically when initialized
	// Sentry.captureException(error, { contexts: { sveltekit: { event } } });

	return {
		message: 'An error occurred',
		errorId: Date.now().toString()
	};
};

