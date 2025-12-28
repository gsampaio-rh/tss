<script lang="ts">
	import { GRID_SIZE } from '$lib/types/game';
	import { settings } from '$lib/stores/settings';

	export let gameWidth: number;
	export let gameHeight: number;

	function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
		return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
	}

	// Scale indicator shows boat length reference (1 unit = boat length)
	// Position it in bottom-right corner
	const indicatorLength = 1; // 1 boat length
	$: indicatorX = gameWidth - 2;
	$: indicatorY = gameHeight - 1;
</script>

<!-- Scale Indicator (boat length reference) -->
{#if $settings.showGrid}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox={formatSvgViewBox(0, 0, gameWidth, gameHeight)}
		style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 7;"
	>
		<!-- Scale line (1 boat length) -->
		<line
			x1={indicatorX}
			y1={indicatorY}
			x2={indicatorX + indicatorLength}
			y2={indicatorY}
			stroke="#666"
			stroke-width="0.05"
			opacity="0.7"
		/>
		<!-- Scale label -->
		<text
			x={indicatorX + indicatorLength / 2}
			y={indicatorY - 0.3}
			font-size="0.5"
			fill="#666"
			opacity="0.7"
			text-anchor="middle"
			font-family="Arial, sans-serif"
		>
			1 boat length
		</text>
	</svg>
{/if}

