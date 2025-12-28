<script lang="ts">
	import Modal from '$lib/presentation/components/shared/Modal.svelte';
	import HeadingChart from '../../HeadingChart.svelte';
	import { turnCount } from '$lib/stores/game';
	import type { Boat } from '$lib/types/boat';
	import { useMetricHistory } from '../composables/useMetricHistory';

	function formatCssDeg(val: number): string {
		return `${Math.round(val)}°`;
	}

	export let open: boolean = false;
	export let boat: Boat;
	export let optimalHeading: number;
	export let headingDelta: number;
	export let headingStatus: 'excellent' | 'good' | 'poor';
	export let headingStatusColor: string;
	export let headingStatusLabel: string;

	let showChartExplanation = false;

	// Heading history tracking using composable
	const { history: headingHistoryRaw, track: trackHeading } = useMetricHistory(() => ({ 
		heading: boat.rotation, 
		optimalHeading, 
		delta: headingDelta 
	}), { maxTurns: 60 });
	let lastTrackedTurn = -1;

	// Transform history to match chart format
	$: headingHistory = headingHistoryRaw.map(entry => ({
		time: entry.timestamp,
		heading: entry.value.heading,
		optimalHeading: entry.value.optimalHeading,
		delta: entry.value.delta,
		turn: entry.turn
	}));

	// Track Heading history
	$: if ($turnCount !== undefined && $turnCount !== lastTrackedTurn) {
		trackHeading($turnCount, { heading: boat.rotation, optimalHeading, delta: headingDelta });
		lastTrackedTurn = $turnCount;
	}

	function handleClose() {
		open = false;
	}
</script>

<Modal {open} title="Heading" size="md" on:close={handleClose}>
	<div class="vmg-info-content">
		<!-- Subtitle -->
		<p class="vmg-subtitle">
			Your boat's current heading compared to the optimal heading for your tack.
			The optimal heading changes with wind shifts, so stay alert!
		</p>

		<!-- Hero Stat: Heading Value -->
		<div class="vmg-hero">
			<div class="vmg-value">{formatCssDeg(boat.rotation)}</div>
			<div class="vmg-unit">°</div>
			<div class="vmg-label">HDG</div>
		</div>

		<!-- Supporting Indicators -->
		<div class="vmg-indicators">
			<div class="vmg-efficiency">
				<span class="efficiency-label">Optimal</span>
				<span class="efficiency-value">{formatCssDeg(optimalHeading)}</span>
				<span class="efficiency-badge" style="background-color: {headingStatus === 'excellent' ? 'rgba(40, 167, 69, 0.12)' : headingStatus === 'good' ? 'rgba(255, 193, 7, 0.12)' : 'rgba(220, 53, 69, 0.12)'}; color: {headingStatusColor}">
					{headingStatusLabel}
				</span>
				<span class="trend-inline" style="color: {headingStatusColor}">
					<span class="metric-delta">{headingDelta > 0 ? '+' : ''}{formatCssDeg(headingDelta)}</span>
				</span>
			</div>
		</div>

		<!-- Heading History Chart -->
		{#if headingHistory.length > 0}
			<div class="vmg-chart-container">
				<div class="chart-header">
					<div class="chart-title">Heading vs Optimal over last {Math.min(headingHistory.length, 60)} turns</div>
					<div class="chart-subtitle">Shows how well you're maintaining optimal heading</div>
				</div>
				<div class="chart-scale-legend">
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(40, 167, 69, 0.2); border-left: 3px solid #28a745;"></span>
						<span class="scale-label">±3° On Course</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(255, 193, 7, 0.2); border-left: 3px solid #ffc107;"></span>
						<span class="scale-label">±5° Close</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(220, 53, 69, 0.2); border-left: 3px solid #dc3545;"></span>
						<span class="scale-label">&gt;5° Off Course</span>
					</span>
				</div>
				<HeadingChart
					history={headingHistory}
					currentStatusColor={headingStatusColor}
					currentHeading={boat.rotation}
					currentOptimal={optimalHeading}
					currentDelta={headingDelta}
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
							Heading over time shows how consistently you're maintaining the optimal heading.
							The dashed line shows the optimal heading, which changes with wind shifts.
							Staying close to optimal means you're responding well to wind changes.
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
					<li><strong>HDG matches OPT</strong> = You're sailing at the optimal angle</li>
					<li><strong>Large delta</strong> = You're off the optimal heading</li>
					<li><strong>Optimal changes</strong> = Wind shifts change the optimal heading</li>
				</ul>
			</div>

			<div class="guidance-section">
				<h4 class="guidance-title">What to do</h4>
				<div class="contextual-guidance" style="color: {headingStatusColor}">
					{#if headingStatus === 'poor'}
						Adjust heading toward {formatCssDeg(optimalHeading)} — you're off course.
					{:else if headingStatus === 'good'}
						Good heading — maintain course and watch for wind shifts.
					{:else}
						Perfect heading — you're on the optimal course!
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

