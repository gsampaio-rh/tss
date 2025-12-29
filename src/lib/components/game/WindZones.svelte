<script lang="ts">
	import type { Boat } from '$lib/types/boat';
	import { currentWind, game } from '$lib/stores/game';
	import { settings } from '$lib/stores/settings';
	import { getBoatColorHex } from '$lib/types/game';

	export let boat: Boat;
	export let playerIndex: number;
	export let show: boolean = false;

	// Current wind direction (in degrees)
	$: windDir = ($currentWind || 0) * 2;
	$: gameWidth = $game?.width || 0;
	$: gameHeight = $game?.height || 0;

	// Boat heading arrow calculations
	$: boatHeading = boat.rotation;
	$: arrowLength = ARC_RADIUS * 0.9;
	$: arrowHeadSize = 0.3;
	$: arrowX = boat.x + arrowLength * Math.sin((boatHeading * Math.PI) / 180);
	$: arrowY = boat.y - arrowLength * Math.cos((boatHeading * Math.PI) / 180);
	$: arrowHeadAngle1 = boatHeading - 30;
	$: arrowHeadAngle2 = boatHeading + 30;
	$: arrowHead1X = arrowX - arrowHeadSize * Math.sin((arrowHeadAngle1 * Math.PI) / 180);
	$: arrowHead1Y = arrowY + arrowHeadSize * Math.cos((arrowHeadAngle1 * Math.PI) / 180);
	$: arrowHead2X = arrowX - arrowHeadSize * Math.sin((arrowHeadAngle2 * Math.PI) / 180);
	$: arrowHead2Y = arrowY + arrowHeadSize * Math.cos((arrowHeadAngle2 * Math.PI) / 180);
	$: boatColor = getBoatColorHex(boat.color);

	// Wind zones angles (relative to wind direction)
	// These are approximate angles for different sailing points
	const DEAD_ZONE = 45; // ±45° from wind - cannot sail
	const CLOSE_HAULED = 60; // ±60° from wind - optimal upwind
	const CLOSE_REACH = 90; // ±90° from wind
	const BEAM_REACH = 120; // ±120° from wind
	const BROAD_REACH = 150; // ±150° from wind
	const RUNNING = 180; // ±180° from wind - downwind

	// Base arc radius (in game units) - will be scaled by user setting
	const BASE_ARC_RADIUS = 2.2;
	
	// Calculate arc radius based on user setting
	$: ARC_RADIUS = BASE_ARC_RADIUS * $settings.windZonesSize;

	// Calculate arc path for a sector
	function getSectorPath(
		centerX: number,
		centerY: number,
		radius: number,
		startAngle: number,
		endAngle: number
	): string {
		const startRad = (startAngle * Math.PI) / 180;
		const endRad = (endAngle * Math.PI) / 180;
		const startX = centerX + radius * Math.sin(startRad);
		const startY = centerY - radius * Math.cos(startRad);
		const endX = centerX + radius * Math.sin(endRad);
		const endY = centerY - radius * Math.cos(endRad);
		const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
		return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
	}

	// Calculate zone colors with user-controlled opacity
	$: zoneOpacity = $settings.windZonesOpacity;
	$: ZONE_COLORS = {
		deadZone: `rgba(200, 50, 50, ${zoneOpacity * 0.6})`, // Red - cannot sail
		closeHauled: `rgba(40, 167, 69, ${zoneOpacity * 0.7})`, // Green - optimal upwind
		closeReach: `rgba(74, 144, 226, ${zoneOpacity * 0.6})`, // Blue
		beamReach: `rgba(108, 117, 125, ${zoneOpacity * 0.6})`, // Gray
		broadReach: `rgba(255, 193, 7, ${zoneOpacity * 0.6})`, // Yellow
		running: `rgba(220, 53, 69, ${zoneOpacity * 0.6})` // Red - downwind
	};

	// Zone stroke colors (thinner strokes, opacity controlled by settings)
	$: ZONE_STROKES = {
		deadZone: `rgba(200, 50, 50, ${zoneOpacity * 0.8})`,
		closeHauled: `rgba(40, 167, 69, ${zoneOpacity * 0.9})`,
		closeReach: `rgba(74, 144, 226, ${zoneOpacity * 0.8})`,
		beamReach: `rgba(108, 117, 125, ${zoneOpacity * 0.8})`,
		broadReach: `rgba(255, 193, 7, ${zoneOpacity * 0.8})`,
		running: `rgba(220, 53, 69, ${zoneOpacity * 0.8})`
	};

	function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
		return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
	}
</script>

{#if show && gameWidth > 0 && gameHeight > 0}
	<!-- Debug: show={show}, gameWidth={gameWidth}, gameHeight={gameHeight} -->
	<svg
		class="wind-zones"
		xmlns="http://www.w3.org/2000/svg"
		viewBox={formatSvgViewBox(0, 0, gameWidth, gameHeight)}
		data-player-index={playerIndex.toString()}
		style="
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 15;
      opacity: 1;
    "
	>
		<!-- Wind direction line (reference) -->
		<line
			x1={boat.x}
			y1={boat.y}
			x2={boat.x + ARC_RADIUS * 0.8 * Math.sin((windDir * Math.PI) / 180)}
			y2={boat.y - ARC_RADIUS * 0.8 * Math.cos((windDir * Math.PI) / 180)}
			stroke="rgba(123, 104, 238, 0.4)"
			stroke-width="0.06"
			stroke-dasharray="0.2 0.2"
		/>

		<!-- Boat heading arrow (shows where boat is pointing) -->
		<!-- Arrow shaft -->
		<line
			x1={boat.x}
			y1={boat.y}
			x2={arrowX}
			y2={arrowY}
			stroke={boatColor}
			stroke-width="0.12"
			stroke-linecap="round"
			opacity="0.9"
			class="boat-heading-arrow"
		/>

		<!-- Arrow head (triangle) -->
		<path
			d={`M ${arrowX} ${arrowY} L ${arrowHead1X} ${arrowHead1Y} L ${arrowHead2X} ${arrowHead2Y} Z`}
			fill={boatColor}
			opacity="0.9"
			class="boat-heading-arrow-head"
		/>

		<!-- Dead Zone (±45° from wind) -->
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir - DEAD_ZONE, windDir + DEAD_ZONE)}
			fill={ZONE_COLORS.deadZone}
			stroke={ZONE_STROKES.deadZone}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone dead-zone"
		/>

		<!-- Close Hauled (±60° from wind, excluding dead zone) -->
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir - CLOSE_HAULED, windDir - DEAD_ZONE)}
			fill={ZONE_COLORS.closeHauled}
			stroke={ZONE_STROKES.closeHauled}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone close-hauled"
		/>
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir + DEAD_ZONE, windDir + CLOSE_HAULED)}
			fill={ZONE_COLORS.closeHauled}
			stroke={ZONE_STROKES.closeHauled}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone close-hauled"
		/>

		<!-- Close Reach (±90° from wind, excluding close hauled) -->
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir - CLOSE_REACH, windDir - CLOSE_HAULED)}
			fill={ZONE_COLORS.closeReach}
			stroke={ZONE_STROKES.closeReach}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone close-reach"
		/>
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir + CLOSE_HAULED, windDir + CLOSE_REACH)}
			fill={ZONE_COLORS.closeReach}
			stroke={ZONE_STROKES.closeReach}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone close-reach"
		/>

		<!-- Beam Reach (±120° from wind, excluding close reach) -->
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir - BEAM_REACH, windDir - CLOSE_REACH)}
			fill={ZONE_COLORS.beamReach}
			stroke={ZONE_STROKES.beamReach}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone beam-reach"
		/>
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir + CLOSE_REACH, windDir + BEAM_REACH)}
			fill={ZONE_COLORS.beamReach}
			stroke={ZONE_STROKES.beamReach}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone beam-reach"
		/>

		<!-- Broad Reach (±150° from wind, excluding beam reach) -->
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir - BROAD_REACH, windDir - BEAM_REACH)}
			fill={ZONE_COLORS.broadReach}
			stroke={ZONE_STROKES.broadReach}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone broad-reach"
		/>
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir + BEAM_REACH, windDir + BROAD_REACH)}
			fill={ZONE_COLORS.broadReach}
			stroke={ZONE_STROKES.broadReach}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone broad-reach"
		/>

		<!-- Running (±180° from wind, excluding broad reach) -->
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir - RUNNING, windDir - BROAD_REACH)}
			fill={ZONE_COLORS.running}
			stroke={ZONE_STROKES.running}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone running"
		/>
		<path
			d={getSectorPath(boat.x, boat.y, ARC_RADIUS, windDir + BROAD_REACH, windDir + RUNNING)}
			fill={ZONE_COLORS.running}
			stroke={ZONE_STROKES.running}
			stroke-width="0.025"
			stroke-dasharray="0.15 0.1"
			class="wind-zone running"
		/>
	</svg>
{/if}

<style>
	.wind-zones {
		transition: opacity 0.2s ease;
	}

	.wind-zone {
		transition: opacity 0.2s ease;
	}
</style>
