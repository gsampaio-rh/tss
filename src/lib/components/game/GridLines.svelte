<script lang="ts">
	import { settings } from '$lib/stores/settings';

	export let gameWidth: number;
	export let gameHeight: number;

	function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
		return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
	}

	// Major lines every 5 units
	const majorInterval = 5;

	// Minor lines every 1 unit
	const minorInterval = 1;

	// Generate major grid lines
	$: majorVerticalLines = (() => {
		const lines: number[] = [];
		for (let x = 0; x <= gameWidth; x += majorInterval) {
			lines.push(x);
		}
		return lines;
	})();

	$: majorHorizontalLines = (() => {
		const lines: number[] = [];
		for (let y = 0; y <= gameHeight; y += majorInterval) {
			lines.push(y);
		}
		return lines;
	})();

	// Generate minor grid lines (all lines except majors)
	$: minorVerticalLines = (() => {
		const lines: number[] = [];
		for (let x = 0; x <= gameWidth; x += minorInterval) {
			if (x % majorInterval !== 0) {
				lines.push(x);
			}
		}
		return lines;
	})();

	$: minorHorizontalLines = (() => {
		const lines: number[] = [];
		for (let y = 0; y <= gameHeight; y += minorInterval) {
			if (y % majorInterval !== 0) {
				lines.push(y);
			}
		}
		return lines;
	})();
</script>

<!-- Grid Lines -->
{#if $settings.showGrid}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox={formatSvgViewBox(0, 0, gameWidth, gameHeight)}
		style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5;"
	>
		<!-- Minor grid lines (very faint) -->
		<g>
			{#each minorVerticalLines as x}
				<line
					x1={x}
					y1="0"
					x2={x}
					y2={gameHeight}
					stroke="rgba(0, 0, 0, 0.035)"
					stroke-width="0.015"
				/>
			{/each}

			{#each minorHorizontalLines as y}
				<line
					x1="0"
					y1={y}
					x2={gameWidth}
					y2={y}
					stroke="rgba(0, 0, 0, 0.035)"
					stroke-width="0.015"
				/>
			{/each}
		</g>

		<!-- Major grid lines (more visible) -->
		<g>
			{#each majorVerticalLines as x}
				<line
					x1={x}
					y1="0"
					x2={x}
					y2={gameHeight}
					stroke="rgba(0, 0, 0, 0.07)"
					stroke-width="0.03"
				/>
			{/each}

			{#each majorHorizontalLines as y}
				<line
					x1="0"
					y1={y}
					x2={gameWidth}
					y2={y}
					stroke="rgba(0, 0, 0, 0.07)"
					stroke-width="0.03"
				/>
			{/each}
		</g>
	</svg>
{/if}
