<script lang="ts">
	import Modal from '$lib/presentation/components/shared/Modal.svelte';
	import TackAdvantageChart from '../../TackAdvantageChart.svelte';
	import { turnCount } from '$lib/stores/game';
	import type { Boat } from '$lib/types/boat';
	import { useMetricHistory } from '../composables/useMetricHistory';

	export let open: boolean = false;
	export let boat: Boat;
	export let tackAdvantage: number;
	export let tackAdvantagePercent: number;
	export let tackAdvantageStatus: 'advantage' | 'disadvantage';
	export let tackAdvantageStatusColor: string;
	export let tackAdvantageStatusLabel: string;
	export let vmgEfficiency: number;

	let showChartExplanation = false;

	// Tack Advantage history tracking using composable
	const { history: tackAdvantageHistoryRaw, track: trackTackAdvantage } = useMetricHistory(() => ({ 
		advantage: tackAdvantage, 
		percent: tackAdvantagePercent 
	}), { maxTurns: 60 });
	let lastTrackedTurn = -1;

	// Transform history to match chart format
	$: tackAdvantageHistory = tackAdvantageHistoryRaw.map(entry => ({
		time: entry.timestamp,
		advantage: entry.value.advantage,
		percent: entry.value.percent,
		turn: entry.turn
	}));

	// Track Tack Advantage history
	$: if ($turnCount !== undefined && $turnCount !== lastTrackedTurn) {
		trackTackAdvantage($turnCount, { advantage: tackAdvantage, percent: tackAdvantagePercent });
		lastTrackedTurn = $turnCount;
	}

	function handleClose() {
		open = false;
	}
</script>

<Modal {open} title="Tack Advantage" size="md" on:close={handleClose}>
	<div class="vmg-info-content">
		<!-- Subtitle -->
		<p class="vmg-subtitle">
			Comparison of your current tack vs. the opposite tack.
			Positive means your current tack is better; negative means the opposite tack would be better.
		</p>

		<!-- Hero Stat: Tack Advantage Value -->
		<div class="vmg-hero">
			<div class="vmg-value">{tackAdvantage > 0 ? '+' : ''}{tackAdvantagePercent}</div>
			<div class="vmg-unit">%</div>
			<div class="vmg-label">Advantage</div>
		</div>

		<!-- Supporting Indicators -->
		<div class="vmg-indicators">
			<div class="vmg-efficiency">
				<span class="efficiency-label">Current Tack</span>
				<span class="efficiency-value">{boat.tack ? 'Port' : 'Starboard'}</span>
				<span class="efficiency-badge" style="background-color: {tackAdvantageStatus === 'advantage' ? 'rgba(40, 167, 69, 0.12)' : 'rgba(220, 53, 69, 0.12)'}; color: {tackAdvantageStatusColor}">
					{tackAdvantageStatusLabel}
				</span>
			</div>
		</div>

		<!-- Tack Advantage History Chart -->
		{#if tackAdvantageHistory.length > 0}
			<div class="vmg-chart-container">
				<div class="chart-header">
					<div class="chart-title">Tack Advantage over last {Math.min(tackAdvantageHistory.length, 60)} turns</div>
					<div class="chart-subtitle">Positive = current tack better, Negative = opposite tack better</div>
				</div>
				<div class="chart-scale-legend">
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(40, 167, 69, 0.2); border-left: 3px solid #28a745;"></span>
						<span class="scale-label">Current Tack Better</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(220, 53, 69, 0.2); border-left: 3px solid #dc3545;"></span>
						<span class="scale-label">Opposite Tack Better</span>
					</span>
				</div>
				<TackAdvantageChart
					history={tackAdvantageHistory}
					currentStatusColor={tackAdvantageStatusColor}
					currentAdvantage={tackAdvantagePercent}
				/>
				<button
					type="button"
					class="chart-explanation-toggle"
					on:click={() => (showChartExplanation = !showChartExplanation)}
				>
					How to read this chart {showChartExplanation ? '▾' : '▸'}
				</button>
				{#if showChartExplanation}
					<div class="chart-explanation">
						<p>
							Tack advantage shows whether your current tack or the opposite tack is better
							for reaching the mark. Positive values mean stay on current tack;
							negative values suggest considering a tack. Use with "TACK SOON" flag for decisions.
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Divider -->
		<hr class="vmg-divider" />

		<!-- Context-Aware Guidance -->
		<div class="vmg-guidance">
			<div class="guidance-section">
				<h4 class="guidance-title">What this means</h4>
				<ul class="guidance-list">
					<li><strong>Positive %</strong> = Your current tack is better</li>
					<li><strong>Negative %</strong> = The opposite tack would be better</li>
					<li><strong>Green border</strong> = Current tack is favored</li>
					<li><strong>Red border</strong> = Opposite tack is favored</li>
				</ul>
			</div>

			<div class="guidance-section">
				<h4 class="guidance-title">What to do</h4>
				<div class="contextual-guidance" style="color: {tackAdvantageStatusColor}">
					{#if tackAdvantageStatus === 'disadvantage' && vmgEfficiency < 0.9}
						Consider tacking — opposite tack is better and your VMG is low.
					{:else if tackAdvantageStatus === 'disadvantage'}
						Opposite tack is better, but VMG is acceptable — watch for better opportunity.
					{:else}
						Stay on current tack — you're on the favored tack.
					{/if}
				</div>
			</div>
		</div>
	</div>
</Modal>

<style>
	/* Shared styles - should be moved to a shared stylesheet */
	.vmg-info-content {
		padding: var(--spacing-md);
	}

	.vmg-subtitle {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: 1.5;
		margin-bottom: var(--spacing-lg);
	}

	.vmg-hero {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-bottom: var(--spacing-md);
	}

	.vmg-value {
		font-size: 2.5rem;
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		line-height: 1;
	}

	.vmg-unit {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		opacity: 0.6;
	}

	.vmg-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-left: auto;
	}

	.vmg-indicators {
		margin-bottom: var(--spacing-lg);
	}

	.vmg-efficiency {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.efficiency-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.efficiency-value {
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.efficiency-badge {
		padding: 4px 8px;
		border-radius: var(--border-radius-sm);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
	}

	.vmg-chart-container {
		margin-bottom: var(--spacing-lg);
	}

	.chart-header {
		margin-bottom: var(--spacing-sm);
	}

	.chart-title {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: 2px;
	}

	.chart-subtitle {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.chart-scale-legend {
		display: flex;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.scale-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.scale-color {
		display: inline-block;
		width: 16px;
		height: 12px;
		border-radius: 2px;
	}

	.chart-explanation-toggle {
		background: none;
		border: none;
		color: var(--color-primary);
		font-size: var(--font-size-xs);
		cursor: pointer;
		padding: var(--spacing-xs) 0;
		margin-top: var(--spacing-sm);
		text-align: left;
	}

	.chart-explanation {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: var(--color-bg-secondary);
		border-radius: var(--border-radius-sm);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.vmg-divider {
		border: none;
		border-top: 1px solid var(--color-border-light);
		margin: var(--spacing-lg) 0;
	}

	.vmg-guidance {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.guidance-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.guidance-title {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0;
	}

	.guidance-list {
		margin: 0;
		padding-left: var(--spacing-md);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		line-height: 1.6;
	}

	.contextual-guidance {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: 1.5;
	}
</style>

