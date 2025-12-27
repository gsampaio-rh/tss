<script lang="ts">
	import { game } from '$lib/stores/game';
	import GameCanvas from '$lib/components/game/GameCanvas.svelte';
</script>

<div class="game-stage-container">
	{#if $game}
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


