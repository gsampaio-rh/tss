<script lang="ts">
	import { players, game, turnCount, isStart } from '$lib/stores/game';
	import PlayerTacticalCard from '$lib/components/game/PlayerTacticalCard.svelte';
	import ReplayTacticalCard from '$lib/components/replay/ReplayTacticalCard.svelte';
	import { TacticalInsightsService } from '$lib/application/services/TacticalInsightsService';
	import { appMode, session } from '$lib/stores/session';
	import { timeline, replayBoats } from '$lib/stores/timeline';

	$: tacticalInsights = $game
		? TacticalInsightsService.getAllTacticalInsights($game, $turnCount)
		: [];

	$: currentTimeStr = $session && $timeline.currentTime > 0
		? formatTimestamp($timeline.currentTime)
		: '';

	function formatTimestamp(ms: number): string {
		const d = new Date(ms);
		const h = d.getHours().toString().padStart(2, '0');
		const m = d.getMinutes().toString().padStart(2, '0');
		const s = d.getSeconds().toString().padStart(2, '0');
		const frac = Math.floor(d.getMilliseconds() / 100);
		return `${h}:${m}:${s}.${frac}`;
	}

	function getPeriod(ms: number): string {
		const h = new Date(ms).getHours();
		return h < 12 ? 'AM' : 'PM';
	}
</script>

<div class="sidebar sidebar-right">
	<div class="sidebar-content">
		{#if $appMode === 'replay'}
			<!-- Replay Mode -->
			<div class="sidebar-header">
				<h2 class="sidebar-title">Replay Analysis</h2>
			</div>
			{#if $session && currentTimeStr}
				<div class="timestamp-display">
					<span class="timestamp-time">{currentTimeStr}</span>
					<span class="timestamp-period">{getPeriod($timeline.currentTime)}</span>
				</div>
			{/if}
			{#if $session}
				<div class="sidebar-section">
					{#each $session.tracks as track, i}
						{@const boat = $replayBoats[i]}
						{#if boat}
							<ReplayTacticalCard
								{boat}
								{track}
								session={$session}
								currentTime={$timeline.currentTime}
								playerIndex={i}
							/>
						{/if}
					{/each}
				</div>
			{:else}
				<div class="sidebar-section">
					<p class="text-muted small">Import GPX files to view tactical analysis.</p>
				</div>
			{/if}
		{:else}
			<!-- Simulation Mode -->
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
				<div class="sidebar-section">
					<p class="text-muted">Position boats on the start line and configure your strategy.</p>
				</div>
			{:else}
				<div class="sidebar-section">
					{#each $players as player, playerIndex}
						{#if player}
							<PlayerTacticalCard boat={player} {playerIndex} />
						{/if}
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.sidebar-section {
		margin-bottom: var(--spacing-lg);
	}

	.timestamp-display {
		text-align: center;
		padding: 8px 0;
		margin-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border-light);
	}

	.timestamp-time {
		font-size: 22px;
		font-weight: var(--font-weight-bold);
		color: var(--color-primary);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.5px;
	}

	.timestamp-period {
		font-size: 12px;
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		margin-left: 4px;
	}
</style>

