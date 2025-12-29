<script lang="ts">
	export let isPinching: boolean;
	export let isFooting: boolean;

	// When pinching (too close to wind): windward tell tale goes down (stalled)
	// When footing (too wide): leeward tell tale goes down (stalled)
	// Leeward tell tale: red and down when footing, green and sideways otherwise
	$: leewardColor = isFooting ? '#dc3545' : '#28a745';
	$: leewardDirection = isFooting ? 'down' : 'sideways';

	// Windward tell tale: red and down when pinching, green and sideways otherwise
	$: windwardColor = isPinching ? '#dc3545' : '#28a745';
	$: windwardDirection = isPinching ? 'down' : 'sideways';
</script>

<div class="tell-tales-container">
	<div class="tell-tale-label">Tell Tales</div>
	<div class="tell-tales-perspective">
		<svg width="200" height="80" viewBox="0 0 200 80" class="tell-tales-sail-view">
			<!-- Leeward tell tale (outside/downwind side) - Top -->
			<!-- Fixed band: y=30, amplitude ±6px (24-36), 4 waves -->
			{#if leewardDirection === 'sideways'}
				<!-- Flowing: 4 waves with ±6px amplitude -->
				<path
					d="M 20,30 Q 30,24 40,30 Q 50,36 60,30 Q 70,24 80,30 Q 90,36 100,30"
					stroke={leewardColor}
					stroke-width="2"
					fill="none"
					stroke-linecap="round"
					class="tell-tale-path flowing"
				/>
			{:else}
				<!-- Stalled: gradual fall, stays in band until 70% -->
				<path
					d="M 20,30 Q 30,24 40,30 Q 50,36 60,30 Q 70,32 80,35 Q 85,38 90,42 Q 95,46 100,50"
					stroke={leewardColor}
					stroke-width="2"
					fill="none"
					stroke-linecap="round"
					class="tell-tale-path stalled"
				/>
			{/if}
			<text
				x="105"
				y="35"
				font-size="10"
				fill={leewardColor}
				font-weight="500"
				class="tell-tale-label"
			>
				Leeward
			</text>

			<!-- Windward tell tale (inside/upwind side) - Bottom -->
			<!-- Fixed band: yBottom = 55, bandHeight = 10 (50-60) -->
			{#if windwardDirection === 'sideways'}
				<!-- Flowing: snake-like wave morphing with 4 waves, phase shift -->
				<path
					d="M 20,55 Q 30,49 40,55 Q 50,61 60,55 Q 70,49 80,55 Q 90,61 100,55"
					stroke={windwardColor}
					stroke-width="2"
					fill="none"
					stroke-linecap="round"
					class="tell-tale-path flowing windward-wave"
				/>
			{:else}
				<!-- Stalled: gradual collapse downward, amplitude decreases, NEVER goes above 53 -->
				<!-- Starts at y=55, amplitude reduces from ±6px to 0, then falls down -->
				<path
					d="M 20,55 Q 30,53 40,55 Q 50,57 60,55 Q 70,56 75,58 Q 80,62 85,68 Q 90,75 95,82 Q 98,88 100,95"
					stroke={windwardColor}
					stroke-width="2"
					fill="none"
					stroke-linecap="round"
					class="tell-tale-path stalled windward-stalled"
				/>
			{/if}
			<text
				x="105"
				y="58"
				font-size="10"
				fill={windwardColor}
				font-weight="500"
				class="tell-tale-label"
			>
				Windward
			</text>
		</svg>
	</div>
</div>

<style>
	.tell-tales-container {
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border-light);
	}

	.tell-tale-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-bottom: 8px;
		font-weight: var(--font-weight-semibold);
	}

	.tell-tales-perspective {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.tell-tales-sail-view {
		display: block;
		margin: 0 auto;
	}

	.tell-tale-path {
		transition: stroke 0.3s ease;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
	}

	.tell-tale-path.flowing {
		animation: snakeWave 1.1s ease-in-out infinite;
	}

	/* Phase shift: windward wave slightly delayed for realistic turbulence effect */
	.tell-tale-path.flowing.windward-wave {
		animation: snakeWaveWindward 1.1s ease-in-out infinite;
		animation-delay: 0.2s;
	}

	.tell-tale-path.stalled {
		opacity: 0.7;
		animation: stallWiggle 1.8s ease-in-out infinite;
	}

	/* Windward stalled: separate animation that NEVER goes above 53 */
	.tell-tale-path.stalled.windward-stalled {
		animation: stallWiggleWindward 1.8s ease-in-out infinite;
	}

	/* Leeward tell tale: snake-like wave morphing with 4 waves, ±6px amplitude */
	/* Fixed band: y=30, range 24-36 */
	@keyframes snakeWave {
		0%, 100% {
			d: path("M 20,30 Q 30,24 40,30 Q 50,36 60,30 Q 70,24 80,30 Q 90,36 100,30");
		}
		50% {
			d: path("M 20,30 Q 30,36 40,30 Q 50,24 60,30 Q 70,36 80,30 Q 90,24 100,30");
		}
	}

	/* Windward tell tale: snake-like wave morphing with phase shift */
	/* Fixed band: y=55, range 49-61, never above 53 */
	@keyframes snakeWaveWindward {
		0%, 100% {
			d: path("M 20,55 Q 30,49 40,55 Q 50,61 60,55 Q 70,49 80,55 Q 90,61 100,55");
		}
		50% {
			d: path("M 20,55 Q 30,61 40,55 Q 50,49 60,55 Q 70,61 80,55 Q 90,49 100,55");
		}
	}

	/* Stalled leeward: gradual fall, stays in band until 70% */
	@keyframes stallWiggle {
		0%, 100% {
			d: path("M 20,30 Q 30,24 40,30 Q 50,36 60,30 Q 70,32 80,35 Q 85,38 90,42 Q 95,46 100,50");
		}
		50% {
			d: path("M 20,30 Q 30,26 40,30 Q 50,34 60,30 Q 70,33 80,37 Q 85,40 90,44 Q 95,48 100,52");
		}
	}

	/* Stalled windward: gradual collapse downward, NEVER goes above 53 */
	/* CRITICAL: All Y values in all keyframes must be >= 53 */
	@keyframes stallWiggleWindward {
		0%, 100% {
			/* Y values: 55, 53, 55, 57, 55, 56, 58, 62, 68, 75, 82, 88, 95 */
			/* First 60% (x=20 to x=70): all Y >= 53 ✓ */
			d: path("M 20,55 Q 30,53 40,55 Q 50,57 60,55 Q 70,56 75,58 Q 80,62 85,68 Q 90,75 95,82 Q 98,88 100,95");
		}
		50% {
			/* Y values: 55, 54, 55, 56, 55, 57, 59, 63, 69, 76, 83, 89, 96 */
			/* First 60% (x=20 to x=70): all Y >= 54 ✓ (still safe, above 53) */
			d: path("M 20,55 Q 30,54 40,55 Q 50,56 60,55 Q 70,57 75,59 Q 80,63 85,69 Q 90,76 95,83 Q 98,89 100,96");
		}
	}

	.tell-tale-label {
		font-family: system-ui, -apple-system, sans-serif;
	}
</style>

