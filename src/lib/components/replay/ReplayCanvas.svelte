<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { session, replayTracks } from '$lib/stores/session';
	import { timeline, replayBoats } from '$lib/stores/timeline';
	import { settings } from '$lib/stores/settings';
	import { GRID_SIZE, getBoatColorHex } from '$lib/types/game';
	import { renderGameAreaSize } from '$lib/infrastructure/rendering/CanvasRenderer';
	import { formatCssPx } from '$lib/utils/cssFormat';
	import Boat from '$lib/components/game/Boat.svelte';
	import GridLines from '$lib/components/game/GridLines.svelte';
	import WindParticles from '$lib/components/game/WindParticles.svelte';

	let gameArea: HTMLDivElement;
	let gameCont: HTMLDivElement;
	let resizeHandler: (() => void) | null = null;

	$: gameWidth = $session?.gameWidth ?? 0;
	$: gameHeight = $session?.gameHeight ?? 0;
	$: viewBox = `0 0 ${gameWidth} ${gameHeight}`;

	function renderSize() {
		if (!gameCont || !gameArea || !gameWidth || !gameHeight) return;
		renderGameAreaSize(gameArea, { width: gameWidth, height: gameHeight }, gameCont);
	}

	$: if (gameWidth && gameHeight && gameCont && gameArea) {
		requestAnimationFrame(renderSize);
	}

	onMount(() => {
		setTimeout(renderSize, 0);
		let timeout: number | null = null;
		resizeHandler = () => {
			if (timeout !== null) cancelAnimationFrame(timeout);
			timeout = requestAnimationFrame(renderSize);
		};
		window.addEventListener('resize', resizeHandler, { passive: true });
	});

	onDestroy(() => {
		if (resizeHandler) {
			window.removeEventListener('resize', resizeHandler);
		}
	});

	function trackPointsToSvg(points: Array<{ x: number; y: number }>): string {
		return points.map((p) => `${p.x},${p.y}`).join(' ');
	}

	$: currentTimeMs = $timeline.currentTime;

	function getProgressivePoints(
		points: Array<{ x: number; y: number; time: number }>,
		upTo: number
	): Array<{ x: number; y: number }> {
		if (!$timeline.isPlaying && !currentTimeMs) return points;
		return points.filter((p) => p.time <= upTo);
	}
</script>

{#if $session}
	<div bind:this={gameCont} class="game-canvas-wrapper">
		<div bind:this={gameArea} class="game-area">
			<!-- Background -->
			<svg {viewBox} class="game-background"></svg>

			<!-- Grid -->
			<GridLines {gameWidth} {gameHeight} />

			<!-- Static track polylines -->
			<svg xmlns="http://www.w3.org/2000/svg" class="game-tracks" {viewBox}>
				{#each $replayTracks as track}
					{@const visible = getProgressivePoints(track.points, currentTimeMs)}
					<polyline
						points={trackPointsToSvg(visible)}
						stroke={track.color}
						fill="none"
						stroke-width="0.08"
						opacity="0.6"
						stroke-linejoin="round"
						stroke-linecap="round"
					/>
				{/each}
			</svg>

			<!-- Replay boats (interpolated positions) -->
			{#each $replayBoats as boat, i (i)}
				<Boat {boat} playerIndex={i} />
			{/each}

			<!-- Wind Particles (reuse if wind data is available) -->
			{#if $settings.showWindIndicators}
				<WindParticles />
			{/if}
		</div>

		<!-- Wind direction indicator -->
		{#if $session.wind.entries.length > 0}
			{@const windDir = $session.wind.entries[0].direction}
			<div class="wind-indicator-group">
				<div class="wind-arrow-container" style="rotate: {windDir}deg;">
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
				<span class="wind-label">{windDir}°</span>
			</div>
		{/if}
	</div>
{/if}
