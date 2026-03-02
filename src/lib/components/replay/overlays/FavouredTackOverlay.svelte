<script lang="ts">
	import type { FavouredTackData } from '$lib/types/session';

	export let data: FavouredTackData;
	export let windDirection: number = 0;
</script>

<div class="favtack-overlay">
	<div class="favtack-title">Mean TWA: {data.meanTWA.toFixed(0)}&deg;</div>

	<div class="favtack-wind-arrow" style="transform: rotate({windDirection}deg)">
		<svg viewBox="0 0 24 24" width="28" height="28">
			<path d="M12 2 L8 12 L12 10 L16 12 Z" fill="rgba(100,200,255,0.6)" stroke="#fff" stroke-width="1"/>
		</svg>
	</div>

	<div class="favtack-donut-label">Right / Left Side</div>
	<svg viewBox="0 0 80 80" width="64" height="64" class="favtack-donut">
		<circle cx="40" cy="40" r="30" fill="none" stroke="#dc3545" stroke-width="10" />
		<circle cx="40" cy="40" r="30" fill="none" stroke="#28a745" stroke-width="10"
			stroke-dasharray="{(data.rightSidePercent / 100) * 188.5} {188.5}"
			stroke-dashoffset="47.1" />
		<circle cx="40" cy="40" r="20" fill="rgba(255,255,255,0.9)" />
	</svg>

	<div class="favtack-donut-label">Right / Left Shift</div>
	<svg viewBox="0 0 80 80" width="64" height="64" class="favtack-donut">
		<circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,180,180,0.7)" stroke-width="10" />
		<circle cx="40" cy="40" r="30" fill="none" stroke="rgba(180,255,180,0.7)" stroke-width="10"
			stroke-dasharray="{(data.rightShiftPercent / 100) * 188.5} {188.5}"
			stroke-dashoffset="47.1" />
		<circle cx="40" cy="40" r="20" fill="rgba(255,255,255,0.9)" />
	</svg>

	<div class="favtack-legend-labels">
		<span style="color:#dc3545">Left</span>
		<span style="color:#28a745">Right</span>
	</div>
</div>

<style>
	.favtack-overlay {
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: rgba(30, 34, 46, 0.85);
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		max-width: 110px;
	}

	.favtack-title {
		font-weight: 700;
		font-size: 10px;
		color: rgba(255, 255, 255, 0.8);
	}

	.favtack-wind-arrow {
		transition: transform 0.3s;
	}

	.favtack-donut-label {
		font-size: 8px;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 600;
		margin-top: 2px;
	}

	.favtack-donut {
		display: block;
	}

	.favtack-legend-labels {
		display: flex;
		gap: 10px;
		font-size: 9px;
		font-weight: 600;
	}
</style>
