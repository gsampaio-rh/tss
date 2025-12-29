<script lang="ts">
	import { CHART_HEIGHT, CHART_PADDING, CHART_WIDTH, type ChartCoords } from '$lib/utils/chartUtils';

	export let history: Array<{ turn?: number; [key: string]: any }>;
	export let currentStatusColor: string;
	export let chartClass: string = 'tactical-chart';

	// Chart dimensions
	$: chartWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
	$: chartHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

	// Tooltip state
	let showTooltip = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let tooltipText = '';

	// Expose tooltip functions for child components
	export function showTooltipAt(x: number, y: number, text: string) {
		tooltipX = x;
		tooltipY = y;
		tooltipText = text;
		showTooltip = true;
	}

	export function hideTooltip() {
		showTooltip = false;
	}
</script>

<svg
	class={chartClass}
	width={CHART_WIDTH}
	height={CHART_HEIGHT}
	viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}"
>
	<slot name="background" {chartWidth} {chartHeight} />

	<slot name="reference-lines" {chartWidth} {chartHeight} />

	<slot name="legend" {chartWidth} {chartHeight} />

	<slot name="data-lines" {chartWidth} {chartHeight} />

	<slot name="historical-points" {chartWidth} {chartHeight} />

	<slot name="current-point" {chartWidth} {chartHeight} />

	<!-- Tooltip -->
	{#if showTooltip}
		<g transform="translate({tooltipX}, {tooltipY - 20})">
			<rect
				x="-50"
				y="-18"
				width="100"
				height="16"
				rx="4"
				fill="rgba(0, 0, 0, 0.85)"
			/>
			<text
				x="0"
				y="-6"
				font-size="10"
				fill="#fff"
				text-anchor="middle"
				alignment-baseline="middle"
				font-weight="500"
			>
				{tooltipText}
			</text>
		</g>
	{/if}
</svg>

<style>
	.tactical-chart {
		display: block;
		width: 100%;
		height: auto;
	}
</style>

