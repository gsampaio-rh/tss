<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { game, currentWind } from '$lib/stores/game';
	import { settings } from '$lib/stores/settings';
	import { WindParticleSystem } from '$lib/domain/services/WindParticleSystem';
	import { formatSvgViewBox } from '$lib/utils/windParticleUtils';

	let svgElement: SVGElement;
	let particleSystem: WindParticleSystem | null = null;

	// Initialize particle system when SVG element is available
	$: if (svgElement && !particleSystem) {
		particleSystem = new WindParticleSystem(
			{
				game: $game ? { width: $game.width, height: $game.height } : null,
				currentWind: $currentWind || 0,
				showWindIndicators: $settings.showWindIndicators
			},
			{
				// Optional callbacks for future enhancements
			}
		);
		particleSystem.initialize(svgElement);
	}

	// Update particle system when game or settings change
	$: if (particleSystem) {
		particleSystem.updateConfig({
			game: $game ? { width: $game.width, height: $game.height } : null,
			currentWind: $currentWind || 0,
			showWindIndicators: $settings.showWindIndicators
		});

		if ($game && $settings.showWindIndicators) {
			particleSystem.initParticles();
		} else {
			particleSystem.cleanup();
		}
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
