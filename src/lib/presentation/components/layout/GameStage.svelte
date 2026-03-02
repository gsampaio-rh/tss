<script lang="ts">
	import { game } from '$lib/stores/game';
	import { appMode, session } from '$lib/stores/session';
	import GameCanvas from '$lib/components/game/GameCanvas.svelte';
	import MapReplayCanvas from '$lib/components/replay/MapReplayCanvas.svelte';
	import TimelineControls from '$lib/components/replay/TimelineControls.svelte';
</script>

<div class="game-stage-container">
	{#if $appMode === 'replay'}
		{#if $session}
			<MapReplayCanvas />
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


