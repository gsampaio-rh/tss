<script lang="ts">
	import Modal from '$lib/presentation/components/shared/Modal.svelte';
	import VMGChart from '../../VMGChart.svelte';
	import { turnCount } from '$lib/stores/game';
	import { useMetricHistory } from '../composables/useMetricHistory';

	export let open: boolean = false;
	export let vmg: number;
	export let vmgPercent: number;
	export let vmgStatus: 'excellent' | 'good' | 'poor';
	export let vmgStatusColor: string;
	export let vmgStatusLabel: string;
	export let vmgStatusBgColor: string;
	export let vmgTrend: 'up' | 'down' | 'stable';
	export let optimalVMG: number;
	export let windwardMark: { x: number; y: number } | null;

	let showChartExplanation = false;

	// VMG history tracking using composable
	const { history: vmgHistoryRaw, track: trackVMG } = useMetricHistory(() => ({ vmg, efficiency: vmgPercent }), { maxTurns: 60 });
	let lastTrackedTurn = -1;

	// Transform history to match chart format
	$: vmgHistory = vmgHistoryRaw.map(entry => ({
		time: entry.timestamp,
		vmg: entry.value.vmg,
		efficiency: entry.value.efficiency,
		turn: entry.turn
	}));

	// Track VMG history (sample every turn)
	$: if (windwardMark && vmg > 0 && $turnCount !== undefined && $turnCount !== lastTrackedTurn) {
		trackVMG($turnCount, { vmg, efficiency: vmgPercent });
		lastTrackedTurn = $turnCount;
	}

	function handleClose() {
		open = false;
	}
</script>

<Modal {open} title="VMG (Velocity Made Good)" size="md" on:close={handleClose}>
	<div class="vmg-info-content">
		<!-- Subtitle -->
		<p class="vmg-subtitle">
			Your speed toward the mark. VMG measures how effectively you're closing the distance,
			not just how fast you're sailing. A boat sailing fast but away from the mark has low VMG.
		</p>

		<!-- Hero Stat: VMG Value -->
		<div class="vmg-hero">
			<div class="vmg-value">{vmg.toFixed(1)}</div>
			<div class="vmg-unit">kn</div>
			<div class="vmg-label">VMG</div>
		</div>

		<!-- Supporting Indicators -->
		<div class="vmg-indicators">
			<div class="vmg-efficiency">
				<span class="efficiency-label">Efficiency</span>
				<span class="efficiency-value">{vmgPercent}%</span>
				<span class="efficiency-badge" style="background-color: {vmgStatusBgColor}; color: {vmgStatusColor}">
					{vmgStatusLabel}
				</span>
				{#if vmgTrend !== 'stable'}
					<span class="trend-inline" style="color: {vmgStatusColor}">
						<span class="trend-arrow-inline">{vmgTrend === 'up' ? '▲' : '▼'}</span>
						<span class="trend-label">{vmgTrend === 'up' ? 'Improving' : 'Declining'}</span>
					</span>
				{/if}
			</div>
		</div>

		<!-- VMG History Chart -->
		{#if vmgHistory.length > 0}
			<div class="vmg-chart-container">
				<div class="chart-header">
					<div class="chart-title">VMG over last {Math.min(vmgHistory.length, 60)} turns</div>
					<div class="chart-subtitle">Compared to optimal VMG for this wind angle</div>
				</div>
				<div class="chart-scale-legend">
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(40, 167, 69, 0.2); border-left: 3px solid #28a745;"></span>
						<span class="scale-label">≥95% Excellent</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(255, 193, 7, 0.2); border-left: 3px solid #ffc107;"></span>
						<span class="scale-label">85-95% Good</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(220, 53, 69, 0.2); border-left: 3px solid #dc3545;"></span>
						<span class="scale-label">&lt;85% Poor</span>
					</span>
				</div>
				<VMGChart
					history={vmgHistory}
					optimalVMG={optimalVMG}
					currentStatusColor={vmgStatusColor}
					currentVMG={vmg}
					currentEfficiency={vmgPercent}
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
							VMG over time shows how fast you're closing the distance to the mark.
							The dashed line is your optimal VMG at this wind angle.
							Staying in the green zone means you're sailing efficiently toward the mark.
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
					<li><strong>High VMG</strong> = good progress toward mark</li>
					<li><strong>Low VMG</strong> = poor progress (even if boat speed is high)</li>
				</ul>
			</div>

			<div class="guidance-section">
				<h4 class="guidance-title">What to do</h4>
				<div class="contextual-guidance" style="color: {vmgStatusColor}">
					{#if vmgStatus === 'poor' && vmgTrend === 'down'}
						You're sailing fast but not toward the mark — adjust heading or tack.
					{:else if vmgStatus === 'good' && vmgTrend === 'up'}
						Improving efficiency — hold course.
					{:else if vmgStatus === 'excellent' && vmgTrend === 'stable'}
						Optimal VMG — maintain trim and angle.
					{:else if vmgStatus === 'poor'}
						Aim for 95%+ efficiency — adjust heading and tack.
					{:else}
						Aim for 95%+ efficiency.
					{/if}
				</div>
			</div>
		</div>
	</div>
</Modal>

<style>
	/* Import styles from PlayerTacticalCard - these should be moved to a shared stylesheet */
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

	.trend-inline {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: var(--font-size-xs);
	}

	.trend-arrow-inline {
		font-size: var(--font-size-xs);
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

