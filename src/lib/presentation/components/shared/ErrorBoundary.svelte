<script lang="ts">
	import { onMount } from 'svelte';
	import { logError } from '$lib/infrastructure/logging/logger';
	import { handleError } from '$lib/infrastructure/errors/errorHandler';

	export let fallback: string = 'Something went wrong. Please refresh the page.';
	export let showDetails: boolean = false;

	let error: Error | null = null;
	let errorInfo: string = '';

	onMount(() => {
		// Listen for unhandled errors
		window.addEventListener('error', handleWindowError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleWindowError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});

	function handleWindowError(event: ErrorEvent): void {
		error = event.error || new Error(event.message);
		errorInfo = `Error: ${event.message}\nFile: ${event.filename}:${event.lineno}:${event.colno}`;
		handleError(error, 'Unhandled error');
	}

	function handleUnhandledRejection(event: PromiseRejectionEvent): void {
		const rejectionError =
			event.reason instanceof Error ? event.reason : new Error(String(event.reason));
		error = rejectionError;
		errorInfo = `Unhandled Promise Rejection: ${rejectionError.message}`;
		handleError(rejectionError, 'Unhandled promise rejection');
		event.preventDefault();
	}

	function reset(): void {
		error = null;
		errorInfo = '';
		window.location.reload();
	}
</script>

{#if error}
	<div class="error-boundary alert alert-danger" role="alert">
		<div class="d-flex align-items-center mb-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				fill="currentColor"
				class="bi bi-exclamation-triangle me-2"
				viewBox="0 0 16 16"
			>
				<path
					d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"
				/>
				<path
					d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"
				/>
			</svg>
			<h5 class="mb-0">Error</h5>
		</div>
		<p class="mb-2">{fallback}</p>
		{#if showDetails && error}
			<details class="mb-3">
				<summary class="text-muted small">Error Details</summary>
				<pre class="small mt-2 p-2 bg-light border rounded"><code
						>{errorInfo || error.message}
{error.stack}</code
					></pre>
			</details>
		{/if}
		<button class="btn btn-primary btn-sm" on:click={reset}>Reload Page</button>
	</div>
{:else}
	<slot />
{/if}

<style>
	.error-boundary {
		padding: 1.5rem;
		margin: 1rem;
		border-radius: 0.5rem;
	}

	.error-boundary pre {
		max-height: 300px;
		overflow: auto;
		font-size: 0.875rem;
	}
</style>

