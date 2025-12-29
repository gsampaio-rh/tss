<script lang="ts">
	import MetricCard from './MetricCard.svelte';

	export let heading: number;
	export let optimalHeading: number;
	export let headingDelta: number;
	export let onInfoClick: (() => void) | null = null;

	function formatCssDeg(val: number): string {
		return `${Math.round(val)}°`;
	}
</script>

<MetricCard label="Heading" {onInfoClick} infoAriaLabel="Learn more about Heading">
	<div class="metric-value-small">HDG {formatCssDeg(heading)}</div>
	<div class="metric-target-small">OPT {formatCssDeg(optimalHeading)}</div>
	<div class="metric-delta">{headingDelta > 0 ? '+' : ''}{formatCssDeg(headingDelta)}</div>
</MetricCard>

<style>
	.metric-value-small {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: 2px;
	}

	.metric-target-small {
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

