<script lang="ts">
	import type { Boat } from '$lib/types/boat';
	import { currentWind, game } from '$lib/stores/game';
	import { Angle } from '$lib/domain/value-objects/Angle';
	import { BoatMovementService } from '$lib/domain/services/BoatMovementService';
	import { calculateApparentWind, getLeewardSide } from '$lib/utils/apparentWind';
	import { VISUAL, BOAT_LENGTH } from '$lib/domain/constants/dirtyAir';

	export let boat: Boat;
	export let playerIndex: number;
	export let show: boolean = false;

	// Current wind direction (in degrees)
	$: windDir = ($currentWind || 0) * 2;
	$: gameWidth = $game?.width || 0;
	$: gameHeight = $game?.height || 0;

	const BLANKET_LENGTH = VISUAL.BLANKET_LENGTH;
	const BLANKET_ANGLE_SPREAD = VISUAL.BLANKET_ANGLE_SPREAD;
	const BACKWIND_LENGTH = VISUAL.BACKWIND_LENGTH;
	const BACKWIND_ANGLE_SPREAD = VISUAL.BACKWIND_ANGLE_SPREAD;

	// Calculate boat speed multiplier (for leeway calculation)
	$: boatHeading = Angle.fromDegrees(boat.rotation);
	$: windDirection = Angle.fromDegrees(windDir);
	$: boatSpeedMultiplier = BoatMovementService.calculateSpeedMultiplier(boatHeading, windDirection);

	// Calculate apparent wind with leeway effects
	$: apparentWindResult = calculateApparentWind(boat.rotation, windDir, boatSpeedMultiplier);
	$: apparentWindDir = apparentWindResult.angle;

	/**
	 * Calculate Blanket Zone path (narrow wedge on leeward side)
	 * Wind shadow: directly downwind of sails on leeward side, narrow, strong, long-lasting
	 * Originates from leeward side, extends downwind
	 */
	function getBlanketZonePath(
		boatX: number,
		boatY: number,
		boatRotation: number,
		windDir: number
	): string {
		// Calculate boat speed multiplier for leeway
		const boatHeading = Angle.fromDegrees(boatRotation);
		const windDirection = Angle.fromDegrees(windDir);
		const boatSpeedMultiplier = BoatMovementService.calculateSpeedMultiplier(boatHeading, windDirection);
		
		const apparentWindResult = calculateApparentWind(boatRotation, windDir, boatSpeedMultiplier);
		const apparentWindDir = apparentWindResult.angle;
		
		// Downwind direction = opposite of apparent wind (where wind flows TO)
		const downwindDir = (apparentWindDir + 180) % 360;
		const downwindRad = (downwindDir * Math.PI) / 180;
		
		// Determine leeward side
		const leewardSide = getLeewardSide(boatRotation, windDir);
		
		// Blanket zone originates from leeward side of boat
		// Leeward side is 90° perpendicular to boat heading, on the leeward side
		const boatRad = (boatRotation * Math.PI) / 180;
		const leewardPerpRad = boatRad + (leewardSide * Math.PI / 2); // 90° to leeward
		
		// Start point offset to leeward side of boat
		const startOffset = 0.3 * BOAT_LENGTH; // Small offset from boat center
		const startX = boatX + startOffset * Math.sin(leewardPerpRad);
		const startY = boatY - startOffset * Math.cos(leewardPerpRad);
		
		// Blanket zone extends downwind, slightly angled toward leeward
		// Center direction: downwind with slight leeward bias
		const blanketCenterDir = (downwindDir + leewardSide * 5 + 360) % 360; // 5° bias toward leeward
		const blanketCenterRad = (blanketCenterDir * Math.PI) / 180;
		
		// Create narrow wedge (±15°) extending downwind
		const spreadRad = (BLANKET_ANGLE_SPREAD * Math.PI) / 180;
		const leftEdgeRad = blanketCenterRad - spreadRad;
		const rightEdgeRad = blanketCenterRad + spreadRad;
		
		const leftEndX = startX + BLANKET_LENGTH * Math.sin(leftEdgeRad);
		const leftEndY = startY - BLANKET_LENGTH * Math.cos(leftEdgeRad);
		
		const rightEndX = startX + BLANKET_LENGTH * Math.sin(rightEdgeRad);
		const rightEndY = startY - BLANKET_LENGTH * Math.cos(rightEdgeRad);
		
		return `M ${startX} ${startY} L ${leftEndX} ${leftEndY} L ${rightEndX} ${rightEndY} Z`;
	}

	/**
	 * Calculate Backwind Zone path (simplified wedge on windward/stern side)
	 * Turbulent wake: originates from stern, wider wedge extending downwind with windward bias
	 */
	function getBackwindZonePath(
		boatX: number,
		boatY: number,
		boatRotation: number,
		windDir: number
	): string {
		// Calculate boat speed multiplier for leeway
		const boatHeading = Angle.fromDegrees(boatRotation);
		const windDirection = Angle.fromDegrees(windDir);
		const boatSpeedMultiplier = BoatMovementService.calculateSpeedMultiplier(boatHeading, windDirection);
		
		const apparentWindResult = calculateApparentWind(boatRotation, windDir, boatSpeedMultiplier);
		const apparentWindDir = apparentWindResult.angle;
		
		// Downwind direction = opposite of apparent wind
		const downwindDir = (apparentWindDir + 180) % 360;
		const downwindRad = (downwindDir * Math.PI) / 180;
		
		// Determine leeward side (windward is opposite)
		const leewardSide = getLeewardSide(boatRotation, windDir);
		const windwardSide = -leewardSide; // Windward is opposite of leeward
		
		// Backwind zone originates from stern
		const boatRad = (boatRotation * Math.PI) / 180;
		const sternRad = boatRad + Math.PI; // 180° from bow (stern)
		
		// Start point: stern of boat
		const startOffset = 0.4 * BOAT_LENGTH;
		const startX = boatX + startOffset * Math.sin(sternRad);
		const startY = boatY - startOffset * Math.cos(sternRad);
		
		// Backwind zone extends downwind with windward bias
		// Center direction: downwind with slight windward bias
		const backwindCenterDir = (downwindDir + windwardSide * 10 + 360) % 360; // 10° bias toward windward
		const backwindCenterRad = (backwindCenterDir * Math.PI) / 180;
		
		// Create wider wedge (±30°) extending downwind
		const spreadRad = (BACKWIND_ANGLE_SPREAD * Math.PI) / 180;
		const leftEdgeRad = backwindCenterRad - spreadRad;
		const rightEdgeRad = backwindCenterRad + spreadRad;
		
		const leftEndX = startX + BACKWIND_LENGTH * Math.sin(leftEdgeRad);
		const leftEndY = startY - BACKWIND_LENGTH * Math.cos(leftEdgeRad);
		
		const rightEndX = startX + BACKWIND_LENGTH * Math.sin(rightEdgeRad);
		const rightEndY = startY - BACKWIND_LENGTH * Math.cos(rightEdgeRad);
		
		return `M ${startX} ${startY} L ${leftEndX} ${leftEndY} L ${rightEndX} ${rightEndY} Z`;
	}

	// Calculate center line (downwind apparent wind direction)
	$: downwindDir = (apparentWindDir + 180) % 360;
	$: downwindRad = (downwindDir * Math.PI) / 180;
	$: centerLineLength = BACKWIND_LENGTH * 0.8;
	$: centerLineEndX = boat.x + centerLineLength * Math.sin(downwindRad);
	$: centerLineEndY = boat.y - centerLineLength * Math.cos(downwindRad);

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
		<!-- Backwind Zone: turbulent wake (wider, longer) -->
		<!-- Render first (behind) so blanket zone appears on top -->
		<path
			d={getBackwindZonePath(boat.x, boat.y, boat.rotation, windDir)}
			fill="rgba(180, 80, 60, 0.2)"
			stroke="rgba(180, 80, 60, 0.5)"
			stroke-width="0.06"
			stroke-dasharray="0.4 0.6"
			class="dirty-air-zone backwind"
			data-player-index={playerIndex.toString()}
		/>

		<!-- Blanket Zone: wind shadow (narrow, darker, more intense) -->
		<!-- Render on top (darker, more intense) -->
		<path
			d={getBlanketZonePath(boat.x, boat.y, boat.rotation, windDir)}
			fill="rgba(150, 30, 30, 0.45)"
			stroke="rgba(150, 30, 30, 0.85)"
			stroke-width="0.08"
			stroke-dasharray="0.3 0.5"
			class="dirty-air-zone blanket"
			data-player-index={playerIndex.toString()}
		/>

		<!-- Center line indicator (shows apparent wind direction) -->
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
