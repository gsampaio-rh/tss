<script lang="ts">
	import MetricCard from './MetricCard.svelte';

	export let isLift: boolean;
	export let isHeader: boolean;
	export let liftAmount: number;
</script>

{#if isLift || isHeader}
	<MetricCard label="Wind Shift">
		<div class="metric-value-large" class:lift={isLift} class:header={isHeader}>
			<span class="shift-arrow">{isLift ? '↗' : '↘'}</span>
			{isLift ? 'LIFT' : 'HEADER'}
		</div>
		<div class="metric-delta">{isLift ? '+' : '−'}{Math.abs(liftAmount).toFixed(0)}°</div>
	</MetricCard>
{:else}
	<MetricCard label="Wind Shift">
		<div class="metric-value-small" style="color: var(--color-text-muted);">No shift</div>
	</MetricCard>
{/if}

<style>
	.metric-value-large {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		margin-bottom: 4px;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.metric-value-large.lift {
		color: #28a745;
	}

	.metric-value-large.header {
		color: #dc3545;
	}

	.shift-arrow {
		font-size: var(--font-size-lg);
	}

	.metric-value-small {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.metric-delta {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
	}
</style>

