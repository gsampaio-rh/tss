<script lang="ts">
	import { game } from '$lib/stores/game';
	import { appMode, session } from '$lib/stores/session';
	import GameCanvas from '$lib/components/game/GameCanvas.svelte';
	import MapReplayCanvas from '$lib/components/replay/MapReplayCanvas.svelte';
	import TimelineControls from '$lib/components/replay/TimelineControls.svelte';
	import AnalysisDrawer from '$lib/components/replay/AnalysisDrawer.svelte';

	let showAnalysis = false;
</script>

<div class="game-stage-container">
	{#if $appMode === 'replay'}
		{#if $session}
			<div class="replay-layout" class:with-drawer={showAnalysis}>
				<div class="map-area">
					<MapReplayCanvas bind:showAnalysisDrawer={showAnalysis} />
				</div>
				<AnalysisDrawer open={showAnalysis} />
			</div>
			<TimelineControls />
		{:else}
			<div class="d-flex align-items-center justify-content-center h-100">
				<div class="text-center text-muted">
					<p>No session loaded</p>
					<p class="small">Import GPX files to start replay</p>
				</div>
			</div>
		{/if}
	{:else if $game}
		<GameCanvas />
	{:else}
		<div class="d-flex align-items-center justify-content-center h-100">
			<div class="text-center text-muted">
				<p>No game started</p>
				<p class="small">Select a wind scenario to begin</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.replay-layout {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.map-area {
		flex: 1;
		position: relative;
		min-height: 0;
	}
</style>
