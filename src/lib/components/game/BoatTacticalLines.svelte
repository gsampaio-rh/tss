<script lang="ts">
	import type { Boat } from '$lib/types/boat';
	import { marks, currentWind, previousWind, game } from '$lib/stores/game';
	import { getCourseAxis } from '$lib/utils/gameLogic';

	export let boat: Boat;
	export let playerIndex: number;

	// Get windward mark
	$: windwardMark = $marks && $marks.length > 2 ? $marks[2] : null;
	$: gameWidth = $game?.width || 0;
	$: gameHeight = $game?.height || 0;

	// Current wind direction (in degrees)
	$: windDir = ($currentWind || 0) * 2;
	$: previousWindDir = ($previousWind || 0) * 2;

	// 1. Course Axis - line from boat to windward mark (in game coordinates)
	$: courseAxisAngle = windwardMark
		? getCourseAxis(boat.x, boat.y, windwardMark.x, windwardMark.y)
		: 0;

	// 2. Wind Axis - line showing wind direction (passes through boat)
	// Wind comes FROM this direction, so line extends in wind direction
	$: windAxisLength = 5; // game units (long enough to be visible)
	$: windAxisAngle = windDir; // Wind comes FROM windDir

	// Wind shift animation
	$: windShifted = Math.abs(windDir - previousWindDir) > 0.1;
	let windShiftAnimation = false;
	$: if (windShifted) {
		windShiftAnimation = true;
		setTimeout(() => (windShiftAnimation = false), 500);
	}

	function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
		return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
	}
</script>

{#if windwardMark && gameWidth > 0 && gameHeight > 0}
	<svg
		class="boat-tactical-lines"
		xmlns="http://www.w3.org/2000/svg"
		viewBox={formatSvgViewBox(0, 0, gameWidth, gameHeight)}
		style="
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 20;
    "
	>
		<!-- 1. Course Axis - thin, neutral, dashed line from boat to mark -->
		<!-- Color: Olive/khaki green - represents "where I want to go" -->
		<line
			x1={boat.x}
			y1={boat.y}
			x2={windwardMark.x}
			y2={windwardMark.y}
			stroke="#6B7F5A"
			stroke-width="0.08"
			stroke-dasharray="0.3 0.5"
			stroke-linecap="round"
			stroke-opacity="0.5"
			class="course-axis"
			data-player-index={playerIndex.toString()}
		/>

		<!-- 2. Wind Axis - dashed line showing wind direction (passes through boat) -->
		<!-- Color: Purple/indigo - represents "where wind comes from" -->
		<line
			x1={boat.x - (windAxisLength / 2) * Math.sin((windAxisAngle * Math.PI) / 180)}
			y1={boat.y + (windAxisLength / 2) * Math.cos((windAxisAngle * Math.PI) / 180)}
			x2={boat.x + (windAxisLength / 2) * Math.sin((windAxisAngle * Math.PI) / 180)}
			y2={boat.y - (windAxisLength / 2) * Math.cos((windAxisAngle * Math.PI) / 180)}
			stroke="#7B68EE"
			stroke-width="0.1"
			stroke-dasharray="0.4 0.3"
			stroke-linecap="round"
			stroke-opacity="0.65"
			class="wind-axis"
			class:wind-shifted={windShiftAnimation}
			data-player-index={playerIndex.toString()}
		/>
	</svg>
{/if}

<style>
	.course-axis {
		transition: stroke-opacity 0.3s ease;
	}

	.wind-axis {
		transition:
			transform 0.5s ease,
			stroke-opacity 0.3s ease;
	}

	.wind-axis.wind-shifted {
		animation: windShiftPulse 0.5s ease;
	}

	@keyframes windShiftPulse {
		0%,
		100% {
			stroke-opacity: 0.65;
			stroke-width: 0.1;
		}
		50% {
			stroke-opacity: 0.9;
			stroke-width: 0.12;
		}
	}

	/* Hide lines for non-focused boats when a boat is focused */
	:global(body[data-focused-player]) .course-axis:not([data-player-index]),
	:global(body[data-focused-player]) .wind-axis:not([data-player-index]) {
		stroke-opacity: 0.15;
	}

	:global(body[data-focused-player]) .course-axis[data-player-index] {
		stroke-opacity: 0.7;
	}

	:global(body[data-focused-player]) .wind-axis[data-player-index] {
		stroke-opacity: 0.85;
	}
</style>
