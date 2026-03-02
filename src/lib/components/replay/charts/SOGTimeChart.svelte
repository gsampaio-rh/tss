<script lang="ts">
	import type { SailorTrack, Leg } from '$lib/types/session';
	import { getBoatColorHex } from '$lib/types/game';
	import { polyFit, polyEval } from '$lib/utils/mathUtils';

	export let tracks: SailorTrack[] = [];
	export let allLegs: Map<string, Leg[]> = new Map();
	export let windDirection: number = 0;

	const MS_TO_KNOTS = 1.94384;
	const CHART_W = 360;
	const CHART_H = 220;
	const PAD = { top: 30, right: 20, bottom: 35, left: 45 };
	const PLOT_W = CHART_W - PAD.left - PAD.right;
	const PLOT_H = CHART_H - PAD.top - PAD.bottom;

	interface ScatterPoint {
		x: number; // elapsed seconds
		y: number; // SOG knots
		isPort: boolean;
		color: string;
		sailorName: string;
	}

	interface LegPanel {
		legNumber: number;
		legType: string;
		points: ScatterPoint[];
		trendLines: { color: string; path: string; sailorName: string }[];
		xMax: number;
		yMin: number;
		yMax: number;
	}

	$: upwindLegs = getUpwindLegs();
	$: panels = buildPanels(upwindLegs);

	function getUpwindLegs(): { legNumber: number; sailorLegs: { track: SailorTrack; leg: Leg }[] }[] {
		const legsByNumber = new Map<number, { track: SailorTrack; leg: Leg }[]>();

		for (const track of tracks) {
			const legs = allLegs.get(track.name) ?? [];
			for (const leg of legs) {
				if (leg.type !== 'upwind') continue;
				if (!legsByNumber.has(leg.legNumber)) {
					legsByNumber.set(leg.legNumber, []);
				}
				legsByNumber.get(leg.legNumber)!.push({ track, leg });
			}
		}

		return Array.from(legsByNumber.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([legNumber, sailorLegs]) => ({ legNumber, sailorLegs }));
	}

	function buildPanels(
		upwind: { legNumber: number; sailorLegs: { track: SailorTrack; leg: Leg }[] }[]
	): LegPanel[] {
		return upwind.map(({ legNumber, sailorLegs }) => {
			const points: ScatterPoint[] = [];
			let xMax = 0;
			let yMin = Infinity;
			let yMax = -Infinity;
			const trendLines: LegPanel['trendLines'] = [];

			for (const { track, leg } of sailorLegs) {
				const hex = getBoatColorHex(track.color);
				const sailorXs: number[] = [];
				const sailorYs: number[] = [];
				const startTime = leg.startTime;

				// Sample every 5th point to avoid overcrowding
				for (let i = leg.startIdx; i <= leg.endIdx && i < track.points.length; i += 5) {
					const pt = track.points[i];
					const elapsed = (pt.time - startTime) / 1000;
					const sogKts = pt.speed * MS_TO_KNOTS;

					if (elapsed > xMax) xMax = elapsed;
					if (sogKts < yMin) yMin = sogKts;
					if (sogKts > yMax) yMax = sogKts;

					points.push({
						x: elapsed,
						y: sogKts,
						isPort: pt.tack,
						color: hex,
						sailorName: track.name
					});

					sailorXs.push(elapsed);
					sailorYs.push(sogKts);
				}

				// Polynomial trend line (degree 3)
				if (sailorXs.length >= 4) {
					const coeffs = polyFit(sailorXs, sailorYs, 3);
					const trendPts: string[] = [];
					const steps = 50;
					for (let s = 0; s <= steps; s++) {
						const tx = (s / steps) * (sailorXs[sailorXs.length - 1] - sailorXs[0]) + sailorXs[0];
						const ty = polyEval(coeffs, tx);
						trendPts.push(`${tx},${ty}`);
					}
					trendLines.push({ color: hex, path: trendPts.join(' '), sailorName: track.name });
				}
			}

			// Add margins to y range
			const yPad = (yMax - yMin) * 0.1 || 1;
			yMin = Math.max(0, yMin - yPad);
			yMax = yMax + yPad;

			return { legNumber, legType: 'Upwind', points, trendLines, xMax: xMax || 60, yMin, yMax };
		});
	}

	function scaleX(val: number, xMax: number): number {
		return PAD.left + (val / xMax) * PLOT_W;
	}

	function scaleY(val: number, yMin: number, yMax: number): number {
		const range = yMax - yMin || 1;
		return PAD.top + PLOT_H - ((val - yMin) / range) * PLOT_H;
	}

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function trendToSvgPath(
		trendStr: string,
		xMax: number,
		yMin: number,
		yMax: number
	): string {
		const parts = trendStr.split(' ');
		return parts
			.map((p, i) => {
				const [x, y] = p.split(',').map(Number);
				const sx = scaleX(x, xMax);
				const sy = scaleY(y, yMin, yMax);
				return `${i === 0 ? 'M' : 'L'} ${sx} ${sy}`;
			})
			.join(' ');
	}
</script>

<div class="sog-chart-container">
	{#if panels.length === 0}
		<div class="no-data">No upwind legs detected. Place course marks or set wind direction.</div>
	{:else}
		<div class="sog-chart-title">SOG vs. Time Upwind</div>
		<div class="sog-panels">
			{#each panels as panel}
				<div class="sog-panel">
					<div class="panel-label">Leg {panel.legNumber}</div>
					<svg viewBox="0 0 {CHART_W} {CHART_H}" width={CHART_W} height={CHART_H}>
						<!-- Grid -->
						{#each Array(5) as _, i}
							{@const yVal = panel.yMin + (i / 4) * (panel.yMax - panel.yMin)}
							<line
								x1={PAD.left} y1={scaleY(yVal, panel.yMin, panel.yMax)}
								x2={PAD.left + PLOT_W} y2={scaleY(yVal, panel.yMin, panel.yMax)}
								stroke="rgba(0,0,0,0.08)" stroke-width="1"
							/>
							<text
								x={PAD.left - 6} y={scaleY(yVal, panel.yMin, panel.yMax) + 3}
								text-anchor="end" font-size="9" fill="#888"
							>{yVal.toFixed(1)}</text>
						{/each}

						<!-- X axis ticks -->
						{#each Array(6) as _, i}
							{@const xVal = (i / 5) * panel.xMax}
							<line
								x1={scaleX(xVal, panel.xMax)} y1={PAD.top + PLOT_H}
								x2={scaleX(xVal, panel.xMax)} y2={PAD.top + PLOT_H + 4}
								stroke="rgba(0,0,0,0.3)" stroke-width="1"
							/>
							<text
								x={scaleX(xVal, panel.xMax)} y={PAD.top + PLOT_H + 16}
								text-anchor="middle" font-size="9" fill="#888"
							>{formatTime(xVal)}</text>
						{/each}

						<!-- Axis labels -->
						<text x={PAD.left - 30} y={PAD.top + PLOT_H / 2}
							text-anchor="middle" font-size="10" fill="#666"
							transform="rotate(-90, {PAD.left - 30}, {PAD.top + PLOT_H / 2})"
						>SOG [kts]</text>

						<!-- Plot border -->
						<rect
							x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H}
							fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1"
						/>

						<!-- Trend lines -->
						{#each panel.trendLines as trend}
							<path
								d={trendToSvgPath(trend.path, panel.xMax, panel.yMin, panel.yMax)}
								fill="none" stroke={trend.color} stroke-width="2.5" opacity="0.7"
							/>
						{/each}

						<!-- Scatter points -->
						{#each panel.points as pt}
							{#if pt.isPort}
								<circle
									cx={scaleX(pt.x, panel.xMax)}
									cy={scaleY(pt.y, panel.yMin, panel.yMax)}
									r="3" fill={pt.color} opacity="0.6"
								/>
							{:else}
								<polygon
									points="{scaleX(pt.x, panel.xMax)},{scaleY(pt.y, panel.yMin, panel.yMax) - 3.5}
										{scaleX(pt.x, panel.xMax) - 3},{scaleY(pt.y, panel.yMin, panel.yMax) + 2.5}
										{scaleX(pt.x, panel.xMax) + 3},{scaleY(pt.y, panel.yMin, panel.yMax) + 2.5}"
									fill={pt.color} opacity="0.6"
								/>
							{/if}
						{/each}
					</svg>
				</div>
			{/each}
		</div>

		<!-- Legend -->
		<div class="sog-legend">
			{#each tracks as track}
				<span class="sog-legend-item">
					<span class="sog-legend-color" style="background:{getBoatColorHex(track.color)}"></span>
					{track.name}
				</span>
			{/each}
			<span class="sog-legend-symbols">
				<span class="sog-legend-symbol-item">&#9679; Port</span>
				<span class="sog-legend-symbol-item">&#9650; Starboard</span>
			</span>
		</div>
	{/if}
</div>

<style>
	.sog-chart-container {
		padding: 12px;
	}
	.sog-chart-title {
		font-size: 14px;
		font-weight: 700;
		text-align: center;
		margin-bottom: 8px;
		color: var(--color-text-primary);
	}
	.sog-panels {
		display: flex;
		gap: 16px;
		overflow-x: auto;
		justify-content: center;
	}
	.sog-panel {
		flex: 0 0 auto;
	}
	.panel-label {
		font-size: 13px;
		font-weight: 600;
		margin-bottom: 4px;
		color: var(--color-text-secondary);
	}
	.no-data {
		text-align: center;
		padding: 30px;
		color: var(--color-text-secondary);
		font-size: 13px;
	}
	.sog-legend {
		display: flex;
		gap: 16px;
		justify-content: center;
		margin-top: 8px;
		font-size: 11px;
		flex-wrap: wrap;
	}
	.sog-legend-item {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.sog-legend-color {
		width: 12px;
		height: 3px;
		border-radius: 1px;
		display: inline-block;
	}
	.sog-legend-symbols {
		display: flex;
		gap: 10px;
		color: var(--color-text-secondary);
	}
	.sog-legend-symbol-item {
		font-size: 10px;
	}
</style>
