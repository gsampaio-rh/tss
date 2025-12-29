<script lang="ts">
	import MetricCard from './MetricCard.svelte';

	export let mode: string;
</script>

<MetricCard label="Mode">
	<div class="metric-value">{mode}</div>
</MetricCard>

<style>
	.metric-value {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}
</style>

