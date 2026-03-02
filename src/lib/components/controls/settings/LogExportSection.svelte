<script lang="ts">
	import { gameLogs } from '$lib/stores/gameLogs';
	import { onMount, onDestroy } from 'svelte';

	let screenWidth = 0;
	let screenHeight = 0;

	$: hasLogs = $gameLogs !== null;

	function handleExportLogs() {
		if ($gameLogs) {
			gameLogs.downloadLog();
		}
	}

	function updateScreenSize() {
		if (typeof window !== 'undefined') {
			screenWidth = window.innerWidth;
			screenHeight = window.innerHeight;
		}
	}

	onMount(() => {
		updateScreenSize();
		window.addEventListener('resize', updateScreenSize);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateScreenSize);
		}
	});
</script>

<div class="setting-item info-item">
	<div class="setting-content">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			fill="currentColor"
			viewBox="0 0 16 16"
			class="setting-icon"
		>
			<path d="M0 0h16v16H0V0zm1 1v6h14V1H1zm0 8v6h14V9H1zm1-7h12v4H2V2zm0 8h12v4H2v-4z" />
		</svg>
		<div class="setting-label">
			<strong>Screen Resolution</strong>
			<small>{screenWidth} × {screenHeight} px</small>
		</div>
	</div>
</div>

<div class="setting-item action-item">
	<button
		class="btn btn-outline-primary btn-sm w-100"
		onclick={handleExportLogs}
		disabled={!hasLogs}
		title="Export game logs as JSON"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 16 16"
			style="margin-right: 0.5rem;"
		>
			<path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.854 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293V6.5z" />
			<path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
		</svg>
		Export Logs
	</button>
</div>
