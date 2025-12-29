<script lang="ts">
	import { players, game, turnCount, isStart } from '$lib/stores/game';
	import PlayerTacticalCard from '$lib/components/game/PlayerTacticalCard.svelte';
	import { TacticalInsightsService } from '$lib/application/services/TacticalInsightsService';

	$: tacticalInsights = $game
		? TacticalInsightsService.getAllTacticalInsights($game, $turnCount)
		: [];
</script>

<div class="sidebar sidebar-right">
	<div class="sidebar-content">
		<!-- Sidebar Header -->
		<div class="sidebar-header">
			<h2 class="sidebar-title">
				{#if $isStart}
					Start Phase
				{:else}
					Race Insight
				{/if}
			</h2>
		</div>

		{#if $isStart}
			<!-- Start Phase Content -->
			<div class="sidebar-section">
				<p class="text-muted">Position boats on the start line and configure your strategy.</p>
			</div>
		{:else}
			<!-- Race Phase - Tactical Insights -->
			<div class="sidebar-section">
				{#each $players as player, playerIndex}
					{#if player}
						<PlayerTacticalCard boat={player} {playerIndex} />
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.sidebar-section {
		margin-bottom: var(--spacing-lg);
	}
</style>

