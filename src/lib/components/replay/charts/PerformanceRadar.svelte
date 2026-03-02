<script lang="ts">
	import type { PerformanceScore } from '$lib/types/session';
	import { getBoatColorHex } from '$lib/types/game';
	import { PERFORMANCE_AXES } from '$lib/domain/services/PerformanceMetricsService';

	export let scores: PerformanceScore[] = [];
	export let title: string = 'Performance';

	const SIZE = 240;
	const CX = SIZE / 2;
	const CY = SIZE / 2;
	const MAX_R = 95;
	const NUM_AXES = 6;
	const RINGS = [70, 80, 90, 100];

	function polarToXY(angle: number, radius: number): { x: number; y: number } {
		const rad = ((angle - 90) * Math.PI) / 180;
		return {
			x: CX + radius * Math.cos(rad),
			y: CY + radius * Math.sin(rad)
		};
	}

	function ringPoints(pct: number): string {
		const r = (pct / 100) * MAX_R;
		return Array.from({ length: NUM_AXES }, (_, i) => {
			const angle = (i * 360) / NUM_AXES;
			const { x, y } = polarToXY(angle, r);
			return `${x},${y}`;
		}).join(' ');
	}

	function scorePolygon(score: PerformanceScore): string {
		return score.axes
			.map((val, i) => {
				const angle = (i * 360) / NUM_AXES;
				const r = (val / 100) * MAX_R;
				const { x, y } = polarToXY(angle, r);
				return `${x},${y}`;
			})
			.join(' ');
	}

	function axisLabelPos(i: number): { x: number; y: number; anchor: string } {
		const angle = (i * 360) / NUM_AXES;
		const { x, y } = polarToXY(angle, MAX_R + 14);
		let anchor = 'middle';
		if (angle > 30 && angle < 150) anchor = 'start';
		if (angle > 210 && angle < 330) anchor = 'end';
		return { x, y: y + 3, anchor };
	}
</script>

<div class="radar-panel">
	<div class="radar-title">{title}</div>
	<svg viewBox="0 0 {SIZE} {SIZE}" width={SIZE} height={SIZE}>
		<!-- Grid rings -->
		{#each RINGS as pct}
			<polygon
				points={ringPoints(pct)}
				fill="none"
				stroke="rgba(255,255,255,0.2)"
				stroke-width="1"
			/>
		{/each}

		<!-- Ring labels -->
		{#each RINGS as pct}
			{@const pos = polarToXY(0, (pct / 100) * MAX_R)}
			<text
				x={pos.x + 3} y={pos.y - 2}
				font-size="8" fill="rgba(255,255,255,0.4)"
			>{pct}%</text>
		{/each}

		<!-- Axis lines -->
		{#each Array(NUM_AXES) as _, i}
			{@const angle = (i * 360) / NUM_AXES}
			{@const end = polarToXY(angle, MAX_R)}
			<line
				x1={CX} y1={CY}
				x2={end.x} y2={end.y}
				stroke="rgba(255,255,255,0.15)" stroke-width="1"
			/>
		{/each}

		<!-- Axis labels -->
		{#each PERFORMANCE_AXES as label, i}
			{@const pos = axisLabelPos(i)}
			<text
				x={pos.x} y={pos.y}
				text-anchor={pos.anchor}
				font-size="9" fill="rgba(255,255,255,0.7)"
				font-weight="500"
			>{label}</text>
		{/each}

		<!-- Score polygons -->
		{#each scores as score}
			<polygon
				points={scorePolygon(score)}
				fill={getBoatColorHex(score.color)}
				fill-opacity="0.08"
				stroke={getBoatColorHex(score.color)}
				stroke-width="2"
				stroke-opacity="0.85"
			/>
		{/each}

		<!-- Score vertices -->
		{#each scores as score}
			{#each score.axes as val, i}
				{@const angle = (i * 360) / NUM_AXES}
				{@const r = (val / 100) * MAX_R}
				{@const pos = polarToXY(angle, r)}
				<circle
					cx={pos.x} cy={pos.y} r="3"
					fill={getBoatColorHex(score.color)}
					opacity="0.9"
				/>
			{/each}
		{/each}
	</svg>
</div>

<style>
	.radar-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.radar-title {
		font-size: 13px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 4px;
	}
</style>
