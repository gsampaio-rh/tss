<script lang="ts">
	import MetricCard from './MetricCard.svelte';

	export let atw: number;
	export let targetATW: number;
	export let atwDelta: number;
	export let atwColor: 'green' | 'yellow' | 'red';
	export let onInfoClick: (() => void) | null = null;

	function formatCssDeg(val: number): string {
		return `${Math.round(val)}°`;
	}
</script>

<MetricCard label="Angle to Wind" {onInfoClick} infoAriaLabel="Learn more about Angle to Wind">
	<div
		class="metric-value"
		class:green={atwColor === 'green'}
		class:yellow={atwColor === 'yellow'}
		class:red={atwColor === 'red'}
	>
		{formatCssDeg(atw)}
	</div>
	<div class="metric-target">Target: {formatCssDeg(targetATW)}</div>
	<div class="metric-delta">{atwDelta > 0 ? '+' : ''}{formatCssDeg(atwDelta)}</div>
</MetricCard>

<style>
	.metric-value {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: 4px;
	}

	.metric-value.green {
		color: #28a745;
	}

	.metric-value.yellow {
		color: #ffc107;
	}

	.metric-value.red {
		color: #dc3545;
	}

	.metric-target {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-bottom: 2px;
	}

	.metric-delta {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
	}
</style>

