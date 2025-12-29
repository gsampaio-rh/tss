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

	export let history: Array<{ time: number; heading: number; optimalHeading: number; delta: number; turn?: number }>;
	export let currentStatusColor: string;
	export let currentHeading: number;
	export let currentOptimal: number;
	export let currentDelta: number;

	let showTooltip = false;

	// Calculate chart dimensions
	$: ({ chartWidth, chartHeight } = calculateChartDimensions());

	// Calculate heading range for Y-axis
	$: headingValues = history.map(h => h.heading);
	$: optimalValues = history.map(h => h.optimalHeading);
	$: allValues = [...headingValues, ...optimalValues];
	$: minHeading = Math.min(...allValues, -90);
	$: maxHeading = Math.max(...allValues, 90);
	$: headingRange = maxHeading - minHeading || 1;

	// Calculate turn range for X-axis
	$: ({ turnStart, turnRange } = calculateTurnRange(history));

	// Convert data point to chart coordinates
	function toChartCoords(turn: number, heading: number): [number, number] {
		const coords = toChartCoordsUtil(
			turn,
			heading,
			turnStart,
			turnRange,
			minHeading,
			headingRange,
			chartWidth,
			chartHeight,
			CHART_PADDING,
			CHART_HEIGHT
		);
		return [coords.x, coords.y];
	}

	// Generate paths for both lines
	$: headingPath = generatePath(history, 'heading', (turn, heading) => {
		const [x, y] = toChartCoords(turn, heading);
		return { x, y };
	});

	$: optimalPath = generatePath(history, 'optimalHeading', (turn, optimalHeading) => {
		const [x, y] = toChartCoords(turn, optimalHeading);
		return { x, y };
	});

	// Generate performance bands based on delta
	$: excellentBandTop = history.length > 0 
		? toChartCoords(turnStart, currentOptimal + 3)[1] 
		: CHART_PADDING.top;
	$: excellentBandBottom = history.length > 0 
		? toChartCoords(turnStart, currentOptimal - 3)[1] 
		: CHART_HEIGHT - CHART_PADDING.bottom;
	$: goodBandTop = history.length > 0 
		? toChartCoords(turnStart, currentOptimal + 5)[1] 
		: CHART_PADDING.top;
	$: goodBandBottom = history.length > 0 
		? toChartCoords(turnStart, currentOptimal - 5)[1] 
		: CHART_HEIGHT - CHART_PADDING.bottom;
</script>

<svg
	class="vmg-chart"
	width={CHART_WIDTH}
	height={CHART_HEIGHT}
	viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}"
>
	<!-- Performance bands background -->
	{#if history.length > 0}
		<!-- Excellent zone (±3° from optimal) -->
		<rect
			x={CHART_PADDING.left}
			y={Math.min(excellentBandTop, excellentBandBottom)}
			width={chartWidth}
			height={Math.abs(excellentBandBottom - excellentBandTop)}
			fill="#28a745"
			opacity="0.1"
		/>
		<!-- Good zone (±5° from optimal, excluding excellent) -->
		<rect
			x={CHART_PADDING.left}
			y={Math.min(goodBandTop, excellentBandTop)}
			width={chartWidth}
			height={Math.abs(excellentBandTop - goodBandTop)}
			fill="#ffc107"
			opacity="0.1"
		/>
		<rect
			x={CHART_PADDING.left}
			y={Math.min(excellentBandBottom, goodBandBottom)}
			width={chartWidth}
			height={Math.abs(goodBandBottom - excellentBandBottom)}
			fill="#ffc107"
			opacity="0.1"
		/>
	{/if}

	<!-- Optimal heading reference line (dashed) -->
	{#if history.length > 0}
		<path
			d={optimalPath}
			fill="none"
			stroke="#6b7280"
			stroke-width="1.5"
			stroke-dasharray="4 4"
			opacity="0.6"
		/>
	{/if}

	<!-- Optimal Heading Legend (top-right) -->
	<g transform="translate({CHART_PADDING.left + chartWidth - 85}, {CHART_PADDING.top - 5})">
		<line
			x1="0"
			y1="4"
			x2="20"
			y2="4"
			stroke="#6b7280"
			stroke-width="1.5"
			stroke-dasharray="4 4"
			opacity="0.6"
		/>
		<text
			x="24"
			y="4"
			font-size="10"
			fill="#6b7280"
			alignment-baseline="middle"
		>
			Optimal
		</text>
	</g>

	<!-- Current heading line -->
	{#if history.length > 0}
		<path
			d={headingPath}
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
			{@const [x, y] = toChartCoords(turn, point.heading)}
			{@const pointDelta = Math.abs(point.delta)}
			{@const pointStatusColor = pointDelta <= 3 ? '#28a745' : pointDelta <= 5 ? '#ffc107' : '#dc3545'}
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
		{@const [x, y] = toChartCoords(turn, lastPoint.heading)}
		<circle
			cx={x}
			cy={y}
			r="5"
			fill={currentStatusColor}
			stroke="#fff"
			stroke-width="2"
			class="current-point"
			role="button"
			aria-label="Current Heading: {currentHeading.toFixed(1)}° (delta: {currentDelta > 0 ? '+' : ''}{currentDelta.toFixed(1)}°)"
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
					x="-45"
					y="-18"
					width="90"
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
					Now: {currentHeading.toFixed(1)}° ({currentDelta > 0 ? '+' : ''}{currentDelta.toFixed(1)}°)
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

