<script lang="ts">
	import { RacingRulesService } from '$lib/domain/services/RacingRulesService';
	import type { Boat } from '$lib/types/boat';
	import type { Game } from '$lib/types/game';
	import { GRID_SIZE } from '$lib/types/game';
	import { formatSvgViewBox } from '$lib/utils/windParticleUtils';

	export let boat: Boat;
	export let playerIndex: number;
	export let game: Game | null = null;

	// Check for approaching violations
	$: warnings = game ? RacingRulesService.checkApproachingViolations(boat, game) : [];

	// Calculate warning circle position and size
	function formatCssPx(val: number): string {
		return val.toFixed(3) + 'px';
	}
</script>

{#if warnings.length > 0}
	<!-- Warning indicators around boat -->
	{#each warnings as warning}
		{@const warningColor = warning.warningLevel === 'critical' ? '#ff4444' : '#ffaa00'}
		{@const warningOpacity = warning.warningLevel === 'critical' ? 0.7 : 0.5}
		{@const warningRadius = warning.warningLevel === 'critical' ? 0.8 : 0.6}
		
		<!-- Pulsing warning circle around boat -->
		<div
			class="racing-warning"
			class:critical={warning.warningLevel === 'critical'}
			style="
				left: {formatCssPx(boat.x * GRID_SIZE)};
				top: {formatCssPx(boat.y * GRID_SIZE)};
				--warning-color: {warningColor};
				--warning-opacity: {warningOpacity};
				--warning-radius: {warningRadius};
			"
		>
			<div class="warning-circle"></div>
			<div class="warning-icon">⚠</div>
		</div>

		<!-- Line connecting to other boat (if critical) -->
		{#if warning.warningLevel === 'critical' && game}
			<svg
				class="warning-line"
				viewBox={formatSvgViewBox(0, 0, game.width, game.height)}
				style="
					position: absolute;
					left: 0;
					top: 0;
					width: 100%;
					height: 100%;
					pointer-events: none;
					z-index: 50;
				"
			>
				<line
					x1={boat.x}
					y1={boat.y}
					x2={warning.otherBoat.x}
					y2={warning.otherBoat.y}
					stroke={warningColor}
					stroke-width="0.1"
					stroke-dasharray="0.2 0.1"
					opacity="0.6"
				/>
			</svg>
		{/if}
	{/each}
{/if}

<style>
	.racing-warning {
		position: absolute;
		width: calc(var(--warning-radius) * var(--grid-size, 32px) * 2);
		height: calc(var(--warning-radius) * var(--grid-size, 32px) * 2);
		margin-left: calc(var(--warning-radius) * var(--grid-size, 32px) * -1);
		margin-top: calc(var(--warning-radius) * var(--grid-size, 32px) * -1);
		pointer-events: none;
		z-index: 99;
		transform-origin: center;
	}

	.warning-circle {
		position: absolute;
		width: 100%;
		height: 100%;
		border: 2px solid var(--warning-color);
		border-radius: 50%;
		opacity: var(--warning-opacity);
		animation: pulse-warning 1.5s ease-in-out infinite;
	}

	.warning-icon {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		font-size: calc(var(--warning-radius) * var(--grid-size, 32px) * 0.6);
		color: var(--warning-color);
		font-weight: bold;
		text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
		animation: pulse-icon 1.5s ease-in-out infinite;
	}

	.racing-warning.critical .warning-circle {
		border-width: 3px;
		animation: pulse-critical 1s ease-in-out infinite;
	}

	.racing-warning.critical .warning-icon {
		animation: pulse-critical-icon 1s ease-in-out infinite;
	}

	@keyframes pulse-warning {
		0%, 100% {
			transform: scale(1);
			opacity: var(--warning-opacity);
		}
		50% {
			transform: scale(1.2);
			opacity: calc(var(--warning-opacity) * 0.7);
		}
	}

	@keyframes pulse-icon {
		0%, 100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
		50% {
			transform: translate(-50%, -50%) scale(1.1);
			opacity: 0.8;
		}
	}

	@keyframes pulse-critical {
		0%, 100% {
			transform: scale(1);
			opacity: var(--warning-opacity);
		}
		50% {
			transform: scale(1.3);
			opacity: calc(var(--warning-opacity) * 0.9);
		}
	}

	@keyframes pulse-critical-icon {
		0%, 100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
		50% {
			transform: translate(-50%, -50%) scale(1.2);
			opacity: 0.9;
		}
	}

	.warning-line {
		pointer-events: none;
	}
</style>

