<script lang="ts">
	import Modal from '$lib/presentation/components/shared/Modal.svelte';
	import ATWChart from '../../ATWChart.svelte';
	import { turnCount } from '$lib/stores/game';
	import { useMetricHistory } from '../composables/useMetricHistory';

	function formatCssDeg(val: number): string {
		return `${Math.round(val)}°`;
	}

	export let open: boolean = false;
	export let atw: number;
	export let targetATW: number;
	export let atwDelta: number;
	export let atwStatus: 'excellent' | 'good' | 'poor';
	export let atwStatusColor: string;
	export let atwStatusLabel: string;

	let showChartExplanation = false;

	// ATW history tracking using composable
	const { history: atwHistoryRaw, track: trackATW } = useMetricHistory(() => ({ atw, delta: atwDelta }), { maxTurns: 60 });
	let lastTrackedTurn = -1;

	// Transform history to match chart format
	$: atwHistory = atwHistoryRaw.map(entry => ({
		time: entry.timestamp,
		atw: entry.value.atw,
		delta: entry.value.delta,
		turn: entry.turn
	}));

	// Track ATW history (sample every turn)
	$: if ($turnCount !== undefined && $turnCount !== lastTrackedTurn) {
		trackATW($turnCount, { atw, delta: atwDelta });
		lastTrackedTurn = $turnCount;
	}

	function handleClose() {
		open = false;
	}
</script>

<Modal {open} title="Angle to Wind (ATW)" size="md" on:close={handleClose}>
	<div class="vmg-info-content">
		<!-- Subtitle -->
		<p class="vmg-subtitle">
			The angle between your boat's heading and the wind direction.
			Maintaining the optimal angle (45° for upwind) maximizes your VMG.
		</p>

		<!-- Hero Stat: ATW Value -->
		<div class="vmg-hero">
			<div class="vmg-value">{formatCssDeg(atw)}</div>
			<div class="vmg-unit">°</div>
			<div class="vmg-label">ATW</div>
		</div>

		<!-- Supporting Indicators -->
		<div class="vmg-indicators">
			<div class="vmg-efficiency">
				<span class="efficiency-label">Target</span>
				<span class="efficiency-value">{formatCssDeg(targetATW)}</span>
				<span class="efficiency-badge" style="background-color: {atwStatus === 'excellent' ? 'rgba(40, 167, 69, 0.12)' : atwStatus === 'good' ? 'rgba(255, 193, 7, 0.12)' : 'rgba(220, 53, 69, 0.12)'}; color: {atwStatusColor}">
					{atwStatusLabel}
				</span>
				<span class="trend-inline" style="color: {atwStatusColor}">
					<span class="metric-delta">{atwDelta > 0 ? '+' : ''}{formatCssDeg(atwDelta)}</span>
				</span>
			</div>
		</div>

		<!-- ATW History Chart -->
		{#if atwHistory.length > 0}
			<div class="vmg-chart-container">
				<div class="chart-header">
					<div class="chart-title">ATW over last {Math.min(atwHistory.length, 60)} turns</div>
					<div class="chart-subtitle">Compared to optimal angle ({formatCssDeg(targetATW)})</div>
				</div>
				<div class="chart-scale-legend">
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(40, 167, 69, 0.2); border-left: 3px solid #28a745;"></span>
						<span class="scale-label">±2° Excellent</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(255, 193, 7, 0.2); border-left: 3px solid #ffc107;"></span>
						<span class="scale-label">±5° Good</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(220, 53, 69, 0.2); border-left: 3px solid #dc3545;"></span>
						<span class="scale-label">&gt;5° Needs Adjustment</span>
					</span>
				</div>
				<ATWChart
					history={atwHistory}
					targetATW={targetATW}
					currentStatusColor={atwStatusColor}
					currentATW={atw}
					currentDelta={atwDelta}
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
							ATW over time shows how consistently you're maintaining the optimal angle.
							The dashed line is your target angle ({formatCssDeg(targetATW)}).
							Staying in the green zone means you're sailing at the optimal angle for maximum VMG.
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
					<li><strong>Too low (&lt;{formatCssDeg(targetATW - 3)})</strong> = Pinching (sailing too close to wind)</li>
					<li><strong>Too high (&gt;{formatCssDeg(targetATW + 5)})</strong> = Footing (sailing too wide)</li>
					<li><strong>Just right ({formatCssDeg(targetATW)})</strong> = Optimal VMG angle</li>
				</ul>
			</div>

			<div class="guidance-section">
				<h4 class="guidance-title">What to do</h4>
				<div class="contextual-guidance" style="color: {atwStatusColor}">
					{#if atwStatus === 'poor'}
						Adjust your heading toward {formatCssDeg(targetATW)} — you're {atwDelta > 0 ? 'footing' : 'pinching'}.
					{:else if atwStatus === 'good'}
						Good angle — maintain course and watch for wind shifts.
					{:else}
						Excellent angle — you're sailing efficiently at the optimal VMG angle.
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

	.trend-inline {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: var(--font-size-xs);
	}

	.metric-delta {
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

