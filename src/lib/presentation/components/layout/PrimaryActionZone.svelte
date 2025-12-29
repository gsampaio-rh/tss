<script lang="ts">
	import { game, isStart, turnCount, gameActions } from '$lib/stores/game';

	function handleTurn() {
		gameActions.turn();
	}

	function handleBackTurn() {
		gameActions.backTurn();
	}

	function handleStart() {
		gameActions.startRace();
	}
</script>

<div class="primary-action-zone">
	{#if $game}
		{#if $isStart}
			<button class="btn btn-primary btn-lg" on:click={handleStart}>Start Race</button>
		{:else}
			<div class="action-buttons">
				<button class="btn btn-secondary" on:click={handleBackTurn} disabled={$turnCount === 0}>
					← Back
				</button>
				<button class="btn btn-primary" on:click={handleTurn}>Next Turn →</button>
			</div>
			<div class="turn-counter">
				<span class="text-muted">Turn:</span>
				<strong>{$turnCount}</strong>
			</div>
		{/if}
	{/if}
</div>

<style>
	.primary-action-zone {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.action-buttons {
		display: flex;
		gap: var(--spacing-md);
	}

	.turn-counter {
		font-size: var(--font-size-sm);
		text-align: center;
	}
</style>

