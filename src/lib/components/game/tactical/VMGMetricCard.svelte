<script lang="ts">
	import MetricCard from './MetricCard.svelte';

	export let vmg: number;
	export let vmgPercent: number;
	export let vmgTrend: 'up' | 'down' | 'stable';
	export let onInfoClick: (() => void) | null = null;
</script>

<MetricCard label="VMG" {onInfoClick} infoAriaLabel="Learn more about VMG">
	<div class="metric-value">{vmg.toFixed(2)} kt</div>
	<div class="vmg-bar-mini">
		<div
			class="vmg-bar-fill-mini"
			style="width: {vmgPercent}%"
			class:good={vmgPercent >= 95}
			class:ok={vmgPercent >= 85 && vmgPercent < 95}
			class:poor={vmgPercent < 85}
		></div>
	</div>
	<div class="metric-delta">
		{vmgPercent}%
		{#if vmgTrend !== 'stable'}
			<span class="trend-icon" class:up={vmgTrend === 'up'} class:down={vmgTrend === 'down'}>
				{vmgTrend === 'up' ? '▲' : '▼'}
			</span>
		{/if}
	</div>
</MetricCard>

<style>
	.metric-value {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: 4px;
	}

	.vmg-bar-mini {
		width: 100%;
		height: 4px;
		background: var(--color-bg-secondary);
		border-radius: var(--border-radius-sm);
		overflow: hidden;
		margin-bottom: 4px;
	}

	.vmg-bar-fill-mini {
		height: 100%;
		transition: width 0.3s ease;
	}

	.vmg-bar-fill-mini.good {
		background: #28a745;
	}

	.vmg-bar-fill-mini.ok {
		background: #ffc107;
	}

	.vmg-bar-fill-mini.poor {
		background: #dc3545;
	}

	.metric-delta {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.trend-icon {
		font-size: var(--font-size-xs);
	}

	.trend-icon.up {
		color: #28a745;
	}

	.trend-icon.down {
		color: #dc3545;
	}
</style>

