<script lang="ts">
	import {
		CHART_HEIGHT,
		CHART_PADDING,
		CHART_WIDTH,
		calculateChartDimensions,
		calculateTurnRange,
		toChartCoords as toChartCoordsUtil,
		generatePath,
		calculatePointOpacity
	} from '$lib/utils/chartUtils';

	export let history: Array<{ time: number; advantage: number; percent: number; turn?: number }>;
	export let currentStatusColor: string;
	export let currentAdvantage: number;

	let showTooltip = false;

	// Calculate chart dimensions
	$: ({ chartWidth, chartHeight } = calculateChartDimensions());

	// Calculate advantage range for Y-axis (centered around 0)
	$: percentValues = history.map(h => h.percent);
	$: minPercent = Math.min(...percentValues, -50, 0);
	$: maxPercent = Math.max(...percentValues, 50, 100);
	$: percentRange = maxPercent - minPercent || 1;

	// Calculate turn range for X-axis
	$: ({ turnStart, turnRange } = calculateTurnRange(history));

	// Convert data point to chart coordinates
	function toChartCoords(turn: number, percent: number): [number, number] {
		const coords = toChartCoordsUtil(
			turn,
			percent,
			turnStart,
			turnRange,
			minPercent,
			percentRange,
			chartWidth,
			chartHeight,
			CHART_PADDING,
			CHART_HEIGHT
		);
		return [coords.x, coords.y];
	}

	// Generate path for advantage line
	$: advantagePath = generatePath(history, 'percent', (turn, percent) => {
		const [x, y] = toChartCoords(turn, percent);
		return { x, y };
	});

	// Zero line (neutral advantage)
	$: zeroY = toChartCoords(turnStart, 0)[1];
</script>

<svg
	class="vmg-chart"
	width={CHART_WIDTH}
	height={CHART_HEIGHT}
	viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}"
>
	<!-- Performance bands background -->
	<!-- Positive zone (current tack better) -->
	{#if history.length > 0}
		<rect
			x={CHART_PADDING.left}
			y={CHART_PADDING.top}
			width={chartWidth}
			height={zeroY - CHART_PADDING.top}
			fill="#28a745"
			opacity="0.1"
		/>
		<!-- Negative zone (opposite tack better) -->
		<rect
			x={CHART_PADDING.left}
			y={zeroY}
			width={chartWidth}
			height={CHART_HEIGHT - CHART_PADDING.bottom - zeroY}
			fill="#dc3545"
			opacity="0.1"
		/>
	{/if}

	<!-- Zero line (neutral) -->
	{#if history.length > 0}
		<line
			x1={CHART_PADDING.left}
			y1={zeroY}
			x2={CHART_PADDING.left + chartWidth}
			y2={zeroY}
			stroke="#6b7280"
			stroke-width="1.5"
			stroke-dasharray="4 4"
			opacity="0.6"
		/>
		<!-- Zero line label -->
		<text
			x={CHART_PADDING.left + chartWidth + 4}
			y={zeroY + 4}
			font-size="10"
			fill="#6b7280"
			alignment-baseline="middle"
		>
			Neutral
		</text>
	{/if}

	<!-- Advantage line -->
	{#if history.length > 0}
		<path
			d={advantagePath}
			fill="none"
			stroke={currentStatusColor}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{/if}

	<!-- Historical data points -->
	{#if history.length > 0}
		{@const lastPoint = history[history.length - 1]}
		{#each history.slice(0, -1) as point}
			{@const turn = point.turn ?? 0}
			{@const [x, y] = toChartCoords(turn, point.percent)}
			{@const pointStatusColor = point.percent >= 0 ? '#28a745' : '#dc3545'}
			{@const turnDiff = (lastPoint.turn ?? 0) - turn}
			{@const opacity = calculatePointOpacity(turnDiff)}
			<circle
				cx={x}
				cy={y}
				r="2.5"
				fill={pointStatusColor}
				stroke="#fff"
				stroke-width="1"
				opacity={opacity}
			/>
		{/each}
	{/if}

	<!-- Current point -->
	{#if history.length > 0}
		{@const lastPoint = history[history.length - 1]}
		{@const turn = lastPoint.turn ?? 0}
		{@const [x, y] = toChartCoords(turn, lastPoint.percent)}
		<circle
			cx={x}
			cy={y}
			r="5"
			fill={currentStatusColor}
			stroke="#fff"
			stroke-width="2"
			class="current-point"
			role="button"
			aria-label="Current Tack Advantage: {currentAdvantage > 0 ? '+' : ''}{currentAdvantage}%"
			tabindex="0"
			on:mouseenter={() => (showTooltip = true)}
			on:mouseleave={() => (showTooltip = false)}
			on:keydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					showTooltip = !showTooltip;
				}
			}}
			style="animation: pulse 2s ease-in-out infinite;"
		/>
		<!-- Tooltip -->
		{#if showTooltip}
			<g transform="translate({x}, {y - 20})">
				<rect
					x="-35"
					y="-18"
					width="70"
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
					Now: {currentAdvantage > 0 ? '+' : ''}{currentAdvantage}%
				</text>
			</g>
		{/if}
	{/if}
</svg>

<style>
	.vmg-chart {
		display: block;
		width: 100%;
		height: auto;
	}

	.current-point {
		cursor: pointer;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>

