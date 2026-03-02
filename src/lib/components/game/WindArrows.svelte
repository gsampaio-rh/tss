<script lang="ts">
	import type { Boat } from '$lib/types/boat';
	import { currentWind, game } from '$lib/stores/game';
	import { settings } from '$lib/stores/settings';
	import { calculateApparentWind } from '$lib/utils/apparentWind';
	import { BoatMovementService } from '$lib/domain/services/BoatMovementService';
	import { Angle } from '$lib/domain/value-objects/Angle';

	export let boat: Boat;
	export let playerIndex: number;

	$: show = $settings.showWindArrows;
	$: windDir = ($currentWind || 0) * 2; // True wind direction (degrees)
	$: gameWidth = $game?.width || 0;
	$: gameHeight = $game?.height || 0;

	const ARROW_LENGTH = 3.0; // Length of arrows in game units
	const ARROW_HEAD_SIZE = 0.4; // Size of arrowhead

	// Calculate boat speed multiplier (for leeway calculation)
	$: boatHeading = Angle.fromDegrees(boat.rotation);
	$: windDirection = Angle.fromDegrees(windDir);
	$: boatSpeedMultiplier = BoatMovementService.calculateSpeedMultiplier(boatHeading, windDirection);

	// Calculate apparent wind with leeway effects
	$: apparentWind = calculateApparentWind(boat.rotation, windDir, boatSpeedMultiplier);
	$: apparentWindAngle = apparentWind.angle;
	$: apparentWindSpeed = apparentWind.speed;

	// Boat bow position (where arrows originate)
	$: bowOffset = 0.3; // Offset from boat center to bow
	$: bowX = boat.x + bowOffset * Math.sin((boat.rotation * Math.PI) / 180);
	$: bowY = boat.y - bowOffset * Math.cos((boat.rotation * Math.PI) / 180);

	// True wind arrow (red)
	$: trueWindRad = (windDir * Math.PI) / 180;
	$: trueWindEndX = bowX + ARROW_LENGTH * Math.sin(trueWindRad);
	$: trueWindEndY = bowY - ARROW_LENGTH * Math.cos(trueWindRad);

	// Apparent wind arrow (blue)
	$: apparentWindRad = (apparentWindAngle * Math.PI) / 180;
	$: apparentWindEndX = bowX + ARROW_LENGTH * Math.sin(apparentWindRad);
	$: apparentWindEndY = bowY - ARROW_LENGTH * Math.cos(apparentWindRad);

	// Arrowhead points for true wind
	$: trueWindHead1X = trueWindEndX - ARROW_HEAD_SIZE * Math.sin(trueWindRad - Math.PI / 6);
	$: trueWindHead1Y = trueWindEndY + ARROW_HEAD_SIZE * Math.cos(trueWindRad - Math.PI / 6);
	$: trueWindHead2X = trueWindEndX - ARROW_HEAD_SIZE * Math.sin(trueWindRad + Math.PI / 6);
	$: trueWindHead2Y = trueWindEndY + ARROW_HEAD_SIZE * Math.cos(trueWindRad + Math.PI / 6);

	// Arrowhead points for apparent wind
	$: apparentWindHead1X = apparentWindEndX - ARROW_HEAD_SIZE * Math.sin(apparentWindRad - Math.PI / 6);
	$: apparentWindHead1Y = apparentWindEndY + ARROW_HEAD_SIZE * Math.cos(apparentWindRad - Math.PI / 6);
	$: apparentWindHead2X = apparentWindEndX - ARROW_HEAD_SIZE * Math.sin(apparentWindRad + Math.PI / 6);
	$: apparentWindHead2Y = apparentWindEndY + ARROW_HEAD_SIZE * Math.cos(apparentWindRad + Math.PI / 6);

	function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
		return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
	}
</script>

{#if show && gameWidth > 0 && gameHeight > 0}
	<svg
		class="wind-arrows"
		xmlns="http://www.w3.org/2000/svg"
		viewBox={formatSvgViewBox(0, 0, gameWidth, gameHeight)}
		style="
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 19;
    "
	>
		<!-- True Wind Arrow (Red) -->
		<line
			x1={bowX}
			y1={bowY}
			x2={trueWindEndX}
			y2={trueWindEndY}
			stroke="#dc3545"
			stroke-width="0.12"
			stroke-linecap="round"
			stroke-opacity="0.8"
			class="wind-arrow true-wind"
			data-player-index={playerIndex.toString()}
		/>
		<polygon
			points="{trueWindEndX},{trueWindEndY} {trueWindHead1X},{trueWindHead1Y} {trueWindHead2X},{trueWindHead2Y}"
			fill="#dc3545"
			stroke="none"
			opacity="0.8"
			class="wind-arrow-head true-wind"
			data-player-index={playerIndex.toString()}
		/>

		<!-- Apparent Wind Arrow (Blue) -->
		<line
			x1={bowX}
			y1={bowY}
			x2={apparentWindEndX}
			y2={apparentWindEndY}
			stroke="#007bff"
			stroke-width="0.12"
			stroke-linecap="round"
			stroke-opacity="0.8"
			class="wind-arrow apparent-wind"
			data-player-index={playerIndex.toString()}
		/>
		<polygon
			points="{apparentWindEndX},{apparentWindEndY} {apparentWindHead1X},{apparentWindHead1Y} {apparentWindHead2X},{apparentWindHead2Y}"
			fill="#007bff"
			stroke="none"
			opacity="0.8"
			class="wind-arrow-head apparent-wind"
			data-player-index={playerIndex.toString()}
		/>
	</svg>
{/if}

<style>
	.wind-arrow {
		transition: stroke-opacity 0.3s ease;
	}

	.wind-arrow-head {
		transition: opacity 0.3s ease;
	}

	.wind-label {
		pointer-events: none;
		user-select: none;
		transition: opacity 0.3s ease;
	}

	/* Hide wind arrows for non-focused boats when a boat is focused */
	:global(body[data-focused-player]) .wind-arrow:not([data-player-index]),
	:global(body[data-focused-player]) .wind-arrow-head:not([data-player-index]) {
		opacity: 0.2;
	}

	:global(body[data-focused-player]) .wind-arrow[data-player-index],
	:global(body[data-focused-player]) .wind-arrow-head[data-player-index] {
		opacity: 0.9;
	}
</style>

