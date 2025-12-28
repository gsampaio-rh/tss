<script lang="ts">
	export let history: Array<{ time: number; atw: number; delta: number; turn?: number }>;
	export let targetATW: number;
	export let currentStatusColor: string;
	export let currentATW: number;
	export let currentDelta: number;

	let showTooltip = false;

	const CHART_HEIGHT = 140;
	const CHART_PADDING = { top: 30, right: 20, bottom: 20, left: 40 };
	const CHART_WIDTH = 400;

	// Calculate chart dimensions
	$: chartWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
	$: chartHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

	// Calculate ATW range for Y-axis (show target ± range)
	$: atwValues = history.map(h => h.atw);
	$: minATW = Math.min(...atwValues, targetATW - 15, 0);
	$: maxATW = Math.max(...atwValues, targetATW + 15, 90);
	$: atwRange = maxATW - minATW || 1;

	// Calculate turn range for X-axis
	$: if (history.length > 0) {
		const turns = history.map(h => h.turn ?? 0);
		const minTurn = Math.min(...turns);
		const maxTurn = Math.max(...turns);
		turnRange = maxTurn - minTurn || 1;
		turnStart = minTurn;
	} else {
		turnRange = 1;
		turnStart = 0;
	}
	let turnRange = 1;
	let turnStart = 0;

	// Convert data point to chart coordinates (using turn number for X-axis)
	function toChartCoords(turn: number, atw: number): [number, number] {
		const x = ((turn - turnStart) / turnRange) * chartWidth + CHART_PADDING.left;
		const y =
			CHART_HEIGHT -
			CHART_PADDING.bottom -
			((atw - minATW) / atwRange) * chartHeight;
		return [x, y];
	}

	// Generate path for ATW line
	$: atwPath = (() => {
		if (history.length === 0) return '';
		if (history.length === 1) {
			const turn = history[0].turn ?? 0;
			const [x, y] = toChartCoords(turn, history[0].atw);
			return `M ${x} ${y} L ${x} ${y}`;
		}
		const points = history.map(h => {
			const turn = h.turn ?? 0;
			const [x, y] = toChartCoords(turn, h.atw);
			return `${x},${y}`;
		});
		return `M ${points[0]} L ${points.slice(1).join(' L ')}`;
	})();

	// Generate efficiency bands based on delta from target
	$: excellentBandTop = history.length > 0 
		? toChartCoords(turnStart, targetATW + 2)[1] 
		: CHART_PADDING.top;
	$: excellentBandBottom = history.length > 0 
		? toChartCoords(turnStart, targetATW - 2)[1] 
		: CHART_HEIGHT - CHART_PADDING.bottom;
	$: goodBandTop = history.length > 0 
		? toChartCoords(turnStart, targetATW + 5)[1] 
		: CHART_PADDING.top;
	$: goodBandBottom = history.length > 0 
		? toChartCoords(turnStart, targetATW - 5)[1] 
		: CHART_HEIGHT - CHART_PADDING.bottom;
</script>

<svg
	class="vmg-chart"
	width={CHART_WIDTH}
	height={CHART_HEIGHT}
	viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}"
>
	<!-- Performance bands background -->
	<!-- Excellent zone (±2° from target) -->
	{#if history.length > 0}
		<rect
			x={CHART_PADDING.left}
			y={Math.min(excellentBandTop, excellentBandBottom)}
			width={chartWidth}
			height={Math.abs(excellentBandBottom - excellentBandTop)}
			fill="#28a745"
			opacity="0.1"
		/>
		<!-- Good zone (±5° from target, excluding excellent) -->
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

	<!-- Target ATW reference line (dashed) -->
	{#if history.length > 0}
		{@const targetY = toChartCoords(turnStart, targetATW)[1]}
		<line
			x1={CHART_PADDING.left}
			y1={targetY}
			x2={CHART_PADDING.left + chartWidth}
			y2={targetY}
			stroke="#6b7280"
			stroke-width="1.5"
			stroke-dasharray="4 4"
			opacity="0.6"
		/>
	{/if}

	<!-- Target ATW Legend (top-right) -->
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
			Target ATW
		</text>
	</g>

	<!-- ATW line -->
	{#if history.length > 0}
		<path
			d={atwPath}
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
			{@const [x, y] = toChartCoords(turn, point.atw)}
			{@const pointDelta = Math.abs(point.delta)}
			{@const pointStatusColor = pointDelta <= 2 ? '#28a745' : pointDelta <= 5 ? '#ffc107' : '#dc3545'}
			{@const turnDiff = (lastPoint.turn ?? 0) - turn}
			{@const opacity = Math.max(0.3, 1 - (turnDiff / 60) * 0.5)}
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

	<!-- Current point (if data exists) -->
	{#if history.length > 0}
		{@const lastPoint = history[history.length - 1]}
		{@const turn = lastPoint.turn ?? 0}
		{@const [x, y] = toChartCoords(turn, lastPoint.atw)}
		<circle
			cx={x}
			cy={y}
			r="5"
			fill={currentStatusColor}
			stroke="#fff"
			stroke-width="2"
			class="current-point"
			role="button"
			aria-label="Current ATW: {currentATW.toFixed(1)}° (delta: {currentDelta > 0 ? '+' : ''}{currentDelta.toFixed(1)}°)"
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
					x="-40"
					y="-18"
					width="80"
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
					Now: {currentATW.toFixed(1)}° ({currentDelta > 0 ? '+' : ''}{currentDelta.toFixed(1)}°)
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

