<script lang="ts">
	export let history: Array<{ time: number; vmg: number; efficiency: number; turn?: number }>;
	export let optimalVMG: number;
	export let currentStatusColor: string;
	export let currentVMG: number;
	export let currentEfficiency: number;

	let showTooltip = false;

	const CHART_HEIGHT = 140;
	const CHART_PADDING = { top: 30, right: 20, bottom: 20, left: 40 };
	const CHART_WIDTH = 400;

	// Calculate chart dimensions
	$: chartWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
	$: chartHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

	// Calculate VMG range for Y-axis
	$: vmgValues = history.length > 0 ? history.map(h => h.vmg) : [];
	$: minVMG = vmgValues.length > 0 
		? Math.min(...vmgValues, 0, optimalVMG * 0.5) 
		: optimalVMG * 0.5;
	$: maxVMG = vmgValues.length > 0 
		? Math.max(...vmgValues, optimalVMG * 1.1) 
		: optimalVMG * 1.1;
	$: vmgRange = maxVMG - minVMG || 1;

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
	function toChartCoords(turn: number, vmg: number): [number, number] {
		const x = ((turn - turnStart) / turnRange) * chartWidth + CHART_PADDING.left;
		const y =
			CHART_HEIGHT -
			CHART_PADDING.bottom -
			((vmg - minVMG) / vmgRange) * chartHeight;
		return [x, y];
	}

	// Generate path for VMG line
	$: vmgPath = (() => {
		if (history.length === 0) return '';
		if (history.length === 1) {
			const turn = history[0].turn ?? 0;
			const [x, y] = toChartCoords(turn, history[0].vmg);
			return `M ${x} ${y} L ${x} ${y}`;
		}
		const points = history.map(h => {
			const turn = h.turn ?? 0;
			const [x, y] = toChartCoords(turn, h.vmg);
			return `${x},${y}`;
		});
		return `M ${points[0]} L ${points.slice(1).join(' L ')}`;
	})();

	// Generate efficiency bands (only if we have data)
	$: excellentBandY = history.length > 0 
		? toChartCoords(turnStart, optimalVMG * 0.95)[1] 
		: CHART_PADDING.top;
	$: goodBandY = history.length > 0 
		? toChartCoords(turnStart, optimalVMG * 0.85)[1] 
		: CHART_HEIGHT - CHART_PADDING.bottom;
	$: poorBandY = CHART_HEIGHT - CHART_PADDING.bottom;
</script>

<svg
	class="vmg-chart"
	width={CHART_WIDTH}
	height={CHART_HEIGHT}
	viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}"
>
	<!-- Performance bands background -->
	<!-- Excellent zone (green, 95%+) -->
	<rect
		x={CHART_PADDING.left}
		y={CHART_PADDING.top}
		width={chartWidth}
		height={excellentBandY - CHART_PADDING.top}
		fill="#28a745"
		opacity="0.1"
	/>
	<!-- Good zone (yellow, 85-95%) -->
	<rect
		x={CHART_PADDING.left}
		y={excellentBandY}
		width={chartWidth}
		height={goodBandY - excellentBandY}
		fill="#ffc107"
		opacity="0.1"
	/>
	<!-- Poor zone (red, <85%) -->
	<rect
		x={CHART_PADDING.left}
		y={goodBandY}
		width={chartWidth}
		height={poorBandY - goodBandY}
		fill="#dc3545"
		opacity="0.1"
	/>

	<!-- Optimal VMG reference line (dashed) -->
	{#if history.length > 0}
		{@const optimalY = toChartCoords(turnStart, optimalVMG)[1]}
		<line
			x1={CHART_PADDING.left}
			y1={optimalY}
			x2={CHART_PADDING.left + chartWidth}
			y2={optimalY}
			stroke="#6b7280"
			stroke-width="1.5"
			stroke-dasharray="4 4"
			opacity="0.6"
		/>
	{/if}

	<!-- Optimal VMG Legend (top-right) -->
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
			Optimal VMG
		</text>
	</g>

	<!-- VMG line -->
	{#if history.length > 0}
		<path
			d={vmgPath}
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
			{@const [x, y] = toChartCoords(turn, point.vmg)}
			{@const pointEfficiency = Math.round(point.efficiency * 100)}
			{@const pointStatusColor = pointEfficiency >= 95 ? '#28a745' : pointEfficiency >= 85 ? '#ffc107' : '#dc3545'}
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
		{@const [x, y] = toChartCoords(turn, lastPoint.vmg)}
		<circle
			cx={x}
			cy={y}
			r="5"
			fill={currentStatusColor}
			stroke="#fff"
			stroke-width="2"
			class="current-point"
			on:mouseenter={() => (showTooltip = true)}
			on:mouseleave={() => (showTooltip = false)}
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
					Now: {currentVMG.toFixed(2)} kn ({currentEfficiency}%)
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

