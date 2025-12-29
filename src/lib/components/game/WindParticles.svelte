<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { game, currentWind, players } from '$lib/stores/game';
	import { settings } from '$lib/stores/settings';
	import { WindParticleSystem } from '$lib/domain/services/WindParticleSystem';
	import { formatSvgViewBox } from '$lib/utils/windParticleUtils';
	import type { BoatPosition } from '$lib/domain/services/WindParticleSystem';

	let svgElement: SVGElement;
	let particleSystem: WindParticleSystem | null = null;
	
	// Track previous values to detect what actually changed
	let prevGameDimensions: { width: number; height: number } | null = null;
	let prevShowWindIndicators: boolean | null = null;
	let prevDensity: number | null = null;
	let prevOpacity: number | null = null;
	let prevSpeed: number | null = null;
	let prevLength: number | null = null;

	// Convert boats to boat positions for particle system
	$: boatPositions = $players.map((boat): BoatPosition => ({
		x: boat.x,
		y: boat.y,
		rotation: boat.rotation
	}));

	// Initialize particle system when SVG element is available
	$: if (svgElement && !particleSystem) {
		particleSystem = new WindParticleSystem(
			{
				game: $game ? { width: $game.width, height: $game.height } : null,
				currentWind: $currentWind || 0,
				showWindIndicators: $settings.showWindIndicators,
				boats: boatPositions,
				density: $settings.windParticlesDensity,
				opacity: $settings.windParticlesOpacity,
				speed: $settings.windParticlesSpeed,
				length: $settings.windParticlesLength
			},
			{
				// Optional callbacks for future enhancements
			}
		);
		particleSystem.initialize(svgElement);
		
		// Initialize tracking variables
		if ($game) {
			prevGameDimensions = { width: $game.width, height: $game.height };
		}
		prevShowWindIndicators = $settings.showWindIndicators;
		prevDensity = $settings.windParticlesDensity;
		prevOpacity = $settings.windParticlesOpacity;
		prevSpeed = $settings.windParticlesSpeed;
		prevLength = $settings.windParticlesLength;
		
		// Initialize particles immediately when system is created
		if ($game && $settings.showWindIndicators) {
			particleSystem.initParticles();
		}
	}

	// Update particle system when game or settings change
	$: if (particleSystem && svgElement) {
		const gameDimensions = $game ? { width: $game.width, height: $game.height } : null;
		
		// Check if we need to reinitialize (settings changed, dimensions changed, or visibility changed)
		// Skip check on first run (when prevGameDimensions is null but system exists)
		const needsReinit = 
			prevGameDimensions === null ||
			!gameDimensions ||
			prevGameDimensions.width !== gameDimensions.width ||
			prevGameDimensions.height !== gameDimensions.height ||
			prevShowWindIndicators !== $settings.showWindIndicators ||
			prevDensity !== $settings.windParticlesDensity ||
			prevOpacity !== $settings.windParticlesOpacity ||
			prevSpeed !== $settings.windParticlesSpeed ||
			prevLength !== $settings.windParticlesLength;
		
		// Always update config (wind direction changes smoothly without reinit)
		particleSystem.updateConfig({
			game: gameDimensions,
			currentWind: $currentWind || 0,
			showWindIndicators: $settings.showWindIndicators,
			boats: boatPositions,
			density: $settings.windParticlesDensity,
			opacity: $settings.windParticlesOpacity,
			speed: $settings.windParticlesSpeed,
			length: $settings.windParticlesLength
		});

		if ($game && $settings.showWindIndicators) {
			if (needsReinit) {
				// Only reinitialize when necessary (settings/dimensions changed)
				particleSystem.initParticles();
			}
			// Otherwise, particles will smoothly adapt to wind direction changes
		} else {
			particleSystem.cleanup();
		}
		
		// Update tracking variables
		if (gameDimensions) {
			prevGameDimensions = gameDimensions;
		}
		prevShowWindIndicators = $settings.showWindIndicators;
		prevDensity = $settings.windParticlesDensity;
		prevOpacity = $settings.windParticlesOpacity;
		prevSpeed = $settings.windParticlesSpeed;
		prevLength = $settings.windParticlesLength;
	}

	// Update viewBox when game dimensions change
	$: if (svgElement && $game) {
		svgElement.setAttribute('viewBox', formatSvgViewBox(0, 0, $game.width, $game.height));
	}

	onDestroy(() => {
		if (particleSystem) {
			particleSystem.cleanup();
			particleSystem = null;
		}
	});
</script>

{#if $game && $settings.showWindIndicators}
	<svg
		bind:this={svgElement}
		id="wind-indicators"
		xmlns="http://www.w3.org/2000/svg"
		class="game-elem"
		viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
		style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"
	></svg>
{/if}

<style>
	svg#wind-indicators {
		will-change: contents;
	}
</style>
