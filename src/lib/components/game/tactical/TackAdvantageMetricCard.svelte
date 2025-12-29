<script lang="ts">
	import MetricCard from './MetricCard.svelte';

	export let tackAdvantage: number;
	export let tackAdvantagePercent: number;
	export let onInfoClick: (() => void) | null = null;
</script>

<MetricCard
	label="Tack Advantage"
	{onInfoClick}
	infoAriaLabel="Learn more about Tack Advantage"
>
	<div
		class="metric-value"
		class:advantage={tackAdvantage < 0}
		class:disadvantage={tackAdvantage > 0}
	>
		{tackAdvantage > 0 ? '+' : ''}{tackAdvantagePercent}%
	</div>
</MetricCard>

<style>
	.metric-value {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.metric-value.advantage {
		color: #28a745;
	}

	.metric-value.disadvantage {
		color: #dc3545;
	}
</style>

