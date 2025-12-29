<script lang="ts">
	import {
		game,
		players,
		marks,
		currentWind,
		turnCount
	} from '$lib/stores/game';
	import { settings } from '$lib/stores/settings';
	import { GRID_SIZE, getBoatColorHex } from '$lib/types/game';
	import Boat from './Boat.svelte';
	import Marks from './Marks.svelte';
	import WindParticles from './WindParticles.svelte';
	import ScaleIndicator from './ScaleIndicator.svelte';
	import GridLabels from './GridLabels.svelte';
	import GridLines from './GridLines.svelte';
	import BoatTacticalLines from './BoatTacticalLines.svelte';
import WindZones from './WindZones.svelte';
import DirtyAirZones from './DirtyAirZones.svelte';
import RacingRulesWarnings from './RacingRulesWarnings.svelte';
import { onMount, onDestroy } from 'svelte';
	import { renderGameAreaSize } from '$lib/infrastructure/rendering/CanvasRenderer';
	import { formatCssPx, formatCssDeg } from '$lib/utils/cssFormat';
	import { formatSvgViewBox } from '$lib/utils/windParticleUtils';
	import { getTrackPoints } from '$lib/utils/trackUtils';
	import { calculateLaylineEndpoints } from '$lib/utils/laylineUtils';

	let gameArea: HTMLDivElement;
	let gameCont: HTMLDivElement;
	let lastGameWidth = 0;
	let lastGameHeight = 0;
	let hoveredPlayerIndex: string | null = null;
	let mutationObserver: MutationObserver | null = null;
	let resizeHandler: (() => void) | null = null;
	let orientationHandler: (() => void) | null = null;

	// Track hovered player from body attribute - reactive
	$: {
		if (typeof document !== 'undefined') {
			hoveredPlayerIndex = document.body.getAttribute('data-hover-player');
		}
	}

	function renderGridSize() {
		if (!$game || !gameCont || !gameArea) return;
		renderGameAreaSize(gameArea, { width: $game.width, height: $game.height }, gameCont);
	}

	// Only re-render when game dimensions change
	$: if ($game && ($game.width !== lastGameWidth || $game.height !== lastGameHeight)) {
		lastGameWidth = $game.width;
		lastGameHeight = $game.height;
		if (gameCont && gameArea) {
			// Use requestAnimationFrame to avoid blocking
			requestAnimationFrame(() => {
				renderGridSize();
			});
		}
	}

	onMount(() => {
		// Create a MutationObserver to watch for changes to body attributes
		mutationObserver = new MutationObserver(() => {
			hoveredPlayerIndex = document.body.getAttribute('data-hover-player');
		});

		mutationObserver.observe(document.body, {
			attributes: true,
			attributeFilter: ['data-hover-player']
		});

		hoveredPlayerIndex = document.body.getAttribute('data-hover-player');

		// Initial render after a short delay to ensure container is sized
		setTimeout(() => {
			renderGridSize();
		}, 0);

		// Throttle resize handler to prevent excessive reflows
		let resizeTimeout: number | null = null;
		resizeHandler = () => {
			if (resizeTimeout !== null) {
				cancelAnimationFrame(resizeTimeout);
			}
			resizeTimeout = requestAnimationFrame(() => {
				renderGridSize();
			});
		};

		orientationHandler = () => {
			// Use setTimeout for orientation change to allow browser to finish
			setTimeout(() => {
				renderGridSize();
			}, 100);
		};

		window.addEventListener('resize', resizeHandler, { passive: true });
		window.addEventListener('orientationchange', orientationHandler);
	});

	onDestroy(() => {
		if (mutationObserver) {
			mutationObserver.disconnect();
			mutationObserver = null;
		}
		if (resizeHandler) {
			window.removeEventListener('resize', resizeHandler);
			resizeHandler = null;
		}
		if (orientationHandler) {
			window.removeEventListener('orientationchange', orientationHandler);
			orientationHandler = null;
		}
	});

	// Wind direction display
	$: windDisplayAngle = $currentWind * 2;
	$: windLabel = $currentWind > 0 ? `+${$currentWind}º` : `${$currentWind}º`;

	// Up mark position (mark index 2)
	$: upMark = $marks[2];

	// Start line (between marks[0] and marks[1])
	$: startMark1 = $marks[0];
	$: startMark2 = $marks[1];

	// Layline calculations
	$: laylineEndpoints = calculateLaylineEndpoints({
		currentWind: $currentWind || 0,
		upMark: upMark || null,
		gameWidth: $game?.width || 0,
		gameHeight: $game?.height || 0
	});
	$: portLaylineEndX = laylineEndpoints.port.x;
	$: portLaylineEndY = laylineEndpoints.port.y;
	$: starboardLaylineEndX = laylineEndpoints.starboard.x;
	$: starboardLaylineEndY = laylineEndpoints.starboard.y;
</script>

{#if $game}
	<div
		bind:this={gameCont}
		class="game-canvas-wrapper"
		data-show-boats={$settings.showBoats ? 'full' : 'dot'}
	>
		<div bind:this={gameArea} class="game-area">
			<!-- Background -->
			<svg viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)} class="game-background"
			></svg>

			<!-- Grid Lines (visual grid for spatial reference - major/minor structure) -->
			<GridLines gameWidth={$game.width} gameHeight={$game.height} />

			<!-- Grid Reference Labels (for tactical distance reference) -->
			<GridLabels gameWidth={$game.width} gameHeight={$game.height} />

			<!-- Scale Indicator (boat length reference) -->
			<ScaleIndicator gameWidth={$game.width} gameHeight={$game.height} />

			<!-- Tracks -->
			{#if $settings.showTracks}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="game-tracks"
					viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
				>
					{#each $players as player, playerIndex}
						{@const trackOpacity = 0.4}
						{@const trackWidth = 0.08}
						{@const trackColor = getBoatColorHex(player.color)}
						<polyline
							class="player-track"
							data-player-index={playerIndex.toString()}
							points={getTrackPoints(player, $game?.turncount || 0)}
							stroke={trackColor}
							fill="none"
							stroke-width={trackWidth}
							opacity={trackOpacity}
						/>
					{/each}
				</svg>
			{/if}

			<!-- Marks -->
			<Marks marks={$marks} />

			<!-- Tactical Lines (Course Axis, Wind Axis) -->
			{#each $players as player, playerIndex}
				<BoatTacticalLines boat={player} {playerIndex} />
			{/each}

			<!-- Wind Zones (shown when enabled, on boat hover) -->
			{#if $settings.showWindZones}
				{#each $players as player, playerIndex}
					<WindZones boat={player} {playerIndex} show={true} />
				{/each}
			{/if}

			<!-- Dirty Air Zones (shown for all boats when enabled) -->
			{#if $settings.showDirtyAir}
				{#each $players as player, playerIndex}
					<DirtyAirZones boat={player} {playerIndex} show={true} />
				{/each}
			{/if}

			<!-- Racing Rules Warnings (visual indicators for approaching violations) -->
			{#each $players as player, playerIndex (playerIndex)}
				{#if $game}
					<RacingRulesWarnings boat={player} {playerIndex} game={$game} />
				{/if}
			{/each}

			<!-- Boats -->
			{#if $settings.showBoats}
				{#each $players as player, playerIndex (playerIndex)}
					<Boat boat={player} {playerIndex} />
				{/each}
			{/if}

			<!-- Wind Particles -->
			<WindParticles />

			<!-- Laylines (from up mark) - Decision-defining elements -->
			{#if $settings.showLanelines && upMark}
				<!-- Laylines SVG - extends from windward mark across full field -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
					class="game-laylines"
				>
					<!-- Laylines: boundaries of the approach corridor -->
					<!-- Extend FROM the mark BACKWARD (downwind) toward the start area -->
					<!-- Shows: "if you're outside this boundary, you can't make the mark without tacking" -->
					<!-- Port layline: boundary for port-tack approach -->
					<line
						x1={upMark.x}
						y1={upMark.y}
						x2={portLaylineEndX}
						y2={portLaylineEndY}
						stroke="#8FA3BF"
						stroke-width="0.08"
						stroke-opacity="0.6"
						stroke-dasharray="0.5 1.5"
						stroke-linecap="round"
					></line>
					<!-- Starboard layline: boundary for starboard-tack approach -->
					<line
						x1={upMark.x}
						y1={upMark.y}
						x2={starboardLaylineEndX}
						y2={starboardLaylineEndY}
						stroke="#8FA3BF"
						stroke-width="0.08"
						stroke-opacity="0.6"
						stroke-dasharray="0.5 1.5"
						stroke-linecap="round"
					></line>
				</svg>

				<!-- Layline proximity indicators (perpendicular ticks from boats) -->
				{#each $players as player}
					{#if player.finished === false}
						{@const distToMark = Math.sqrt(
							Math.pow(player.x - upMark.x, 2) + Math.pow(player.y - upMark.y, 2)
						)}
						{#if distToMark < 12 && distToMark > 2}
							{@const angleToMark =
								(Math.atan2(upMark.y - player.y, upMark.x - player.x) * 180) / Math.PI}
							{@const windAngle = $currentWind * 2}
							{@const laylineAngle1 = windAngle - 45}
							{@const laylineAngle2 = windAngle + 45}
							{@const angleDiff1 = Math.abs(((angleToMark - laylineAngle1 + 180) % 360) - 180)}
							{@const angleDiff2 = Math.abs(((angleToMark - laylineAngle2 + 180) % 360) - 180)}
							{@const nearLayline = angleDiff1 < 8 || angleDiff2 < 8}
							{#if nearLayline}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 10 10"
									class="layline-proximity-indicator"
									style="
                      left: {formatCssPx(player.x * GRID_SIZE)};
                      top: {formatCssPx(player.y * GRID_SIZE)};
                      width: 10px;
                      height: 10px;
                      margin-left: -5px;
                      margin-top: -5px;
                      opacity: {Math.max(0.3, 0.7 - distToMark / 20)};
                      pointer-events: none;
                      z-index: 50;
                    "
								>
									<line
										x1="5"
										y1="5"
										x2="5"
										y2="0"
										stroke={getBoatColorHex(player.color)}
										stroke-width="0.15"
										stroke-linecap="round"
										transform="rotate({angleDiff1 < angleDiff2
											? laylineAngle1 - angleToMark
											: laylineAngle2 - angleToMark} 5 5)"
									/>
								</svg>
							{/if}
						{/if}
					{/if}
				{/each}
			{/if}

			<!-- Start Line (dotted) -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="game-start-line"
				viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
			>
				<line
					id="start-line"
					stroke-dasharray="0.4 0.6"
					stroke-width="0.12"
					stroke="#6B8EC6"
					stroke-linecap="round"
					x1={startMark1 ? startMark1.x : 0}
					y1={startMark1 ? startMark1.y : 0}
					x2={startMark2 ? startMark2.x : 0}
					y2={startMark2 ? startMark2.y : 0}
				/>
			</svg>
		</div>

		<!-- Wind Indicator Group - positioned outside game-area to avoid transform issues -->
		<div class="wind-indicator-group">
			<!-- Wind Arrow Container (base rotation) -->
			<div class="wind-arrow-container" style="rotate: {formatCssDeg(windDisplayAngle)};">
				<!-- Wind Arrow (with subtle animation) -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 32" class="wind-arrow-animated">
					<path
						d="M 1 14 L 6 22 L 11 14 M 4 2 V 15 M 8 2 V 15"
						fill="none"
						stroke="#333"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					></path>
				</svg>
			</div>

			<!-- Wind Label -->
			<span class="wind-label">
				{windLabel}
			</span>
		</div>
	</div>
{/if}

<!-- Styles moved to game.css -->
