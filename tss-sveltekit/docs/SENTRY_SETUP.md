# Sentry Error Tracking Setup

This document explains how to set up Sentry error tracking for the TSS application.

## Installation

1. Install the Sentry SvelteKit SDK:
```bash
npm install @sentry/sveltekit
```

2. Run the Sentry wizard to configure your project:
```bash
npx @sentry/wizard@latest -i sveltekit
```

Or manually configure:

## Manual Configuration

### 1. Environment Variables

Create a `.env` file (or add to existing) with your Sentry configuration:

```env
VITE_SENTRY_DSN=your-sentry-dsn-here
VITE_SENTRY_ENABLED=true
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

### 2. Enable Sentry in Hooks

Uncomment the Sentry initialization code in:
- `src/hooks.client.ts` - Client-side initialization
- `src/hooks.server.ts` - Server-side initialization

### 3. Get Your DSN

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project (select SvelteKit)
3. Copy your DSN from the project settings
4. Add it to your `.env` file

## Configuration Options

- `VITE_SENTRY_DSN`: Your Sentry project DSN (required)
- `VITE_SENTRY_ENABLED`: Enable/disable Sentry (default: false)
- `VITE_SENTRY_TRACES_SAMPLE_RATE`: Performance monitoring sample rate (0.0-1.0)
- `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`: Session replay sample rate (0.0-1.0)
- `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`: Error replay sample rate (0.0-1.0)

## Usage

Sentry is automatically integrated with the error handler. All errors caught by `handleError()` will be sent to Sentry if enabled.

### Manual Error Reporting

```typescript
import { captureException, captureMessage } from '$lib/infrastructure/errors/sentry';

// Capture an exception
try {
  // some code
} catch (error) {
  captureException(error, { context: 'additional data' });
}

// Capture a message
captureMessage('Something important happened', 'info', { userId: '123' });
```

### Adding Breadcrumbs

```typescript
import { addBreadcrumb } from '$lib/infrastructure/errors/sentry';

addBreadcrumb('User clicked button', 'user-action', 'info', { buttonId: 'submit' });
```

### Setting User Context

```typescript
import { setUserContext } from '$lib/infrastructure/errors/sentry';

setUserContext('user-123', 'user@example.com', 'username');
```

## Features

- ✅ Automatic error capture via error handler
- ✅ Performance monitoring (traces)
- ✅ Session replay for debugging
- ✅ User context tracking
- ✅ Breadcrumb tracking
- ✅ Environment-aware configuration
- ✅ Development mode detection

## Disabling Sentry

Set `VITE_SENTRY_ENABLED=false` in your `.env` file, or simply don't set `VITE_SENTRY_DSN`.

## Testing

Sentry will not send errors in development mode unless explicitly configured. To test:

1. Set `VITE_SENTRY_ENABLED=true`
2. Set a valid `VITE_SENTRY_DSN`
3. Trigger an error in your application
4. Check your Sentry dashboard

## Security

- Never commit your `.env` file with a real DSN to version control
- Use different DSNs for development, staging, and production
- Review Sentry's data privacy settings

