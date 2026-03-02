<script lang="ts">
	export let detecting = false;
	export let disabled = false;
	export let showAnalysis = false;

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher<{
		autoDetect: void;
		toggleAnalysis: void;
	}>();
</script>

<div class="controls-br">
	<button class="map-btn map-btn-accent" on:click={() => dispatch('autoDetect')} disabled={detecting || disabled} title="Auto-detect course marks">
		<svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
		<span>{detecting ? 'Detecting...' : 'Auto-Detect'}</span>
	</button>
	<button class="map-btn" class:active={showAnalysis} on:click={() => dispatch('toggleAnalysis')} title="Toggle analysis charts">
		<svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5h-2v12h2V2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z"/></svg>
		<span>Analysis</span>
	</button>
</div>

<style>
	.controls-br {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 4px;
		border-radius: var(--radius-md);
		background: rgba(30, 34, 46, 0.85);
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.map-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 10px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: rgba(255, 255, 255, 0.8);
		font-size: 10px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.12s ease;
		white-space: nowrap;
	}

	.map-btn:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
	.map-btn.active { background: var(--color-primary); color: #fff; }
	.map-btn.active:hover { background: var(--color-primary-hover); }
	.map-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.map-btn-accent { color: rgba(100, 200, 255, 0.9); }
	.map-btn-accent:hover { background: rgba(100, 200, 255, 0.12); color: #fff; }
</style>
