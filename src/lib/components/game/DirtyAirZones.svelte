<script lang="ts">
	import type { Boat } from '$lib/types/boat';
	import { currentWind, game } from '$lib/stores/game';
	import { getBoatColorHex } from '$lib/types/game';

	export let boat: Boat;
	export let playerIndex: number;
	export let show: boolean = false;

	// Current wind direction (in degrees)
	$: windDir = ($currentWind || 0) * 2;
	$: gameWidth = $game?.width || 0;
	$: gameHeight = $game?.height || 0;

	// Calculate dirty air center line
	$: leewardAngle = (windDir + 180) % 360;
	$: centerLineLength = DIRTY_AIR_LENGTH * 0.8;
	$: centerLineEndX = boat.x + centerLineLength * Math.sin((leewardAngle * Math.PI) / 180);
	$: centerLineEndY = boat.y - centerLineLength * Math.cos((leewardAngle * Math.PI) / 180);

	// Dirty air zone parameters
	const DIRTY_AIR_LENGTH = 8; // How far back the dirty air extends (in game units)
	const DIRTY_AIR_WIDTH_START = 1.5; // Width at the boat (in game units)
	const DIRTY_AIR_WIDTH_END = 4; // Width at the end of the zone (in game units)
	const DIRTY_AIR_ANGLE_SPREAD = 35; // Angle spread from center line (degrees)

	// Calculate dirty air zone shape
	// Dirty air extends leeward (downwind) and windward (upwind) from the boat
	// The zone is wider at the end and narrower near the boat
	function getDirtyAirPath(
		boatX: number,
		boatY: number,
		boatRotation: number,
		windDir: number
	): string {
		// Calculate the direction leeward (downwind) from the boat
		// This is opposite to the wind direction
		const leewardAngle = (windDir + 180) % 360;

		// The dirty air extends primarily leeward, but also spreads windward
		// Center line of dirty air zone (leeward direction)
		const centerAngle = leewardAngle;

		// Calculate the four corners of the dirty air zone (trapezoid shape)
		// Start points (near boat)
		const startAngle1 = centerAngle - DIRTY_AIR_ANGLE_SPREAD;
		const startAngle2 = centerAngle + DIRTY_AIR_ANGLE_SPREAD;

		// End points (far from boat)
		const endAngle1 = centerAngle - DIRTY_AIR_ANGLE_SPREAD;
		const endAngle2 = centerAngle + DIRTY_AIR_ANGLE_SPREAD;

		// Start width points (near boat)
		const startX1 = boatX + (DIRTY_AIR_WIDTH_START / 2) * Math.sin((startAngle1 * Math.PI) / 180);
		const startY1 = boatY - (DIRTY_AIR_WIDTH_START / 2) * Math.cos((startAngle1 * Math.PI) / 180);
		const startX2 = boatX + (DIRTY_AIR_WIDTH_START / 2) * Math.sin((startAngle2 * Math.PI) / 180);
		const startY2 = boatY - (DIRTY_AIR_WIDTH_START / 2) * Math.cos((startAngle2 * Math.PI) / 180);

		// End width points (far from boat, leeward)
		const endX1 =
			boatX +
			DIRTY_AIR_LENGTH * Math.sin((endAngle1 * Math.PI) / 180) +
			(DIRTY_AIR_WIDTH_END / 2) * Math.sin((endAngle1 * Math.PI) / 180);
		const endY1 =
			boatY -
			DIRTY_AIR_LENGTH * Math.cos((endAngle1 * Math.PI) / 180) +
			(DIRTY_AIR_WIDTH_END / 2) * Math.cos((endAngle1 * Math.PI) / 180);
		const endX2 =
			boatX +
			DIRTY_AIR_LENGTH * Math.sin((endAngle2 * Math.PI) / 180) +
			(DIRTY_AIR_WIDTH_END / 2) * Math.sin((endAngle2 * Math.PI) / 180);
		const endY2 =
			boatY -
			DIRTY_AIR_LENGTH * Math.cos((endAngle2 * Math.PI) / 180) +
			(DIRTY_AIR_WIDTH_END / 2) * Math.cos((endAngle2 * Math.PI) / 180);

		// Create trapezoid path
		return `M ${startX1} ${startY1} L ${startX2} ${startY2} L ${endX2} ${endY2} L ${endX1} ${endY1} Z`;
	}

	// Also create a windward (upwind) dirty air zone
	// This is smaller and extends upwind from the boat
	function getWindwardDirtyAirPath(
		boatX: number,
		boatY: number,
		boatRotation: number,
		windDir: number
	): string {
		const windwardAngle = windDir; // Upwind direction
		const WINDWARD_LENGTH = 3; // Shorter than leeward
		const WINDWARD_WIDTH_START = 1;
		const WINDWARD_WIDTH_END = 2;
		const WINDWARD_SPREAD = 25;

		const startAngle1 = windwardAngle - WINDWARD_SPREAD;
		const startAngle2 = windwardAngle + WINDWARD_SPREAD;

		const startX1 = boatX + (WINDWARD_WIDTH_START / 2) * Math.sin((startAngle1 * Math.PI) / 180);
		const startY1 = boatY - (WINDWARD_WIDTH_START / 2) * Math.cos((startAngle1 * Math.PI) / 180);
		const startX2 = boatX + (WINDWARD_WIDTH_START / 2) * Math.sin((startAngle2 * Math.PI) / 180);
		const startY2 = boatY - (WINDWARD_WIDTH_START / 2) * Math.cos((startAngle2 * Math.PI) / 180);

		const endX1 =
			boatX -
			WINDWARD_LENGTH * Math.sin((startAngle1 * Math.PI) / 180) +
			(WINDWARD_WIDTH_END / 2) * Math.sin((startAngle1 * Math.PI) / 180);
		const endY1 =
			boatY +
			WINDWARD_LENGTH * Math.cos((startAngle1 * Math.PI) / 180) +
			(WINDWARD_WIDTH_END / 2) * Math.cos((startAngle1 * Math.PI) / 180);
		const endX2 =
			boatX -
			WINDWARD_LENGTH * Math.sin((startAngle2 * Math.PI) / 180) +
			(WINDWARD_WIDTH_END / 2) * Math.sin((startAngle2 * Math.PI) / 180);
		const endY2 =
			boatY +
			WINDWARD_LENGTH * Math.cos((startAngle2 * Math.PI) / 180) +
			(WINDWARD_WIDTH_END / 2) * Math.cos((startAngle2 * Math.PI) / 180);

		return `M ${startX1} ${startY1} L ${startX2} ${startY2} L ${endX2} ${endY2} L ${endX1} ${endY1} Z`;
	}

	function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
		return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
	}
</script>

{#if show && gameWidth > 0 && gameHeight > 0}
	<svg
		class="dirty-air-zones"
		xmlns="http://www.w3.org/2000/svg"
		viewBox={formatSvgViewBox(0, 0, gameWidth, gameHeight)}
		style="
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 17;
      opacity: 0.7;
    "
	>
		<!-- Leeward (downwind) dirty air zone - main zone -->
		<path
			d={getDirtyAirPath(boat.x, boat.y, boat.rotation, windDir)}
			fill="rgba(150, 50, 50, 0.25)"
			stroke="rgba(150, 50, 50, 0.6)"
			stroke-width="0.08"
			stroke-dasharray="0.3 0.5"
			class="dirty-air-zone leeward"
			data-player-index={playerIndex.toString()}
		/>

		<!-- Windward (upwind) dirty air zone - smaller, affects boats ahead -->
		<path
			d={getWindwardDirtyAirPath(boat.x, boat.y, boat.rotation, windDir)}
			fill="rgba(150, 50, 50, 0.2)"
			stroke="rgba(150, 50, 50, 0.5)"
			stroke-width="0.06"
			stroke-dasharray="0.2 0.4"
			class="dirty-air-zone windward"
			data-player-index={playerIndex.toString()}
		/>

		<!-- Center line indicator (shows direction of dirty air flow) -->
		<line
			x1={boat.x}
			y1={boat.y}
			x2={centerLineEndX}
			y2={centerLineEndY}
			stroke="rgba(150, 50, 50, 0.4)"
			stroke-width="0.06"
			stroke-dasharray="0.2 0.3"
			class="dirty-air-center-line"
			data-player-index={playerIndex.toString()}
		/>
	</svg>
{/if}

<style>
	.dirty-air-zones {
		transition: opacity 0.2s ease;
	}

	.dirty-air-zone {
		transition: opacity 0.2s ease;
	}

	/* Hide dirty air zones for non-focused boats when a boat is focused */
	:global(body[data-focused-player]) .dirty-air-zone:not([data-player-index]),
	:global(body[data-focused-player]) .dirty-air-center-line:not([data-player-index]) {
		opacity: 0.1;
	}

	:global(body[data-focused-player]) .dirty-air-zone[data-player-index],
	:global(body[data-focused-player]) .dirty-air-center-line[data-player-index] {
		opacity: 0.8;
	}
</style>
