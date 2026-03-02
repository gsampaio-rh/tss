<script lang="ts">
	import { session } from '$lib/stores/session';
	import { timeline, timelineActions } from '$lib/stores/timeline';

	$: startTime = $session?.startTime ?? 0;
	$: endTime = $session?.endTime ?? 0;
	$: totalDuration = endTime - startTime;
	$: elapsed = $timeline.currentTime - startTime;
	$: progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

	const SPEED_OPTIONS = [0.5, 1, 2, 5, 10];

	function handleScrub(e: Event) {
		const input = e.target as HTMLInputElement;
		const pct = parseFloat(input.value) / 100;
		const time = startTime + pct * totalDuration;
		timelineActions.seek(time);
	}

	function formatTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const mins = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.code === 'Space') {
			e.preventDefault();
			timelineActions.togglePlayPause();
		} else if (e.code === 'ArrowRight') {
			e.preventDefault();
			timelineActions.seek($timeline.currentTime + 5000); // +5s
		} else if (e.code === 'ArrowLeft') {
			e.preventDefault();
			timelineActions.seek($timeline.currentTime - 5000); // -5s
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $session}
	<div class="timeline-controls">
		<!-- Play/Pause -->
		<button
			class="play-btn"
			on:click={() => timelineActions.togglePlayPause()}
			title={$timeline.isPlaying ? 'Pause' : 'Play'}
		>
			{#if $timeline.isPlaying}
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
					<path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
					<path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
				</svg>
			{/if}
		</button>

		<!-- Time display -->
		<span class="time-display">{formatTime(elapsed)}</span>

		<!-- Scrubber -->
		<input
			type="range"
			class="scrubber"
			min="0"
			max="100"
			step="0.1"
			value={progress}
			on:input={handleScrub}
		/>

		<!-- Total time -->
		<span class="time-display">{formatTime(totalDuration)}</span>

		<!-- Speed selector -->
		<div class="speed-selector">
			{#each SPEED_OPTIONS as speed}
				<button
					class="speed-btn"
					class:active={$timeline.playbackSpeed === speed}
					on:click={() => timelineActions.setSpeed(speed)}
				>
					{speed}x
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.timeline-controls {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 16px;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(8px);
		border-top: 1px solid var(--color-border-light);
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
		z-index: 200;
	}

	.play-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: none;
		background: var(--color-primary);
		color: #fff;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background var(--transition-fast);
		box-shadow: var(--shadow-sm);
	}

	.play-btn:hover {
		background: var(--color-primary-hover);
	}

	.time-display {
		font-family: var(--font-family-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		min-width: 42px;
		text-align: center;
		flex-shrink: 0;
	}

	.scrubber {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		background: var(--color-border-medium);
		border-radius: 2px;
		outline: none;
		cursor: pointer;
	}

	.scrubber::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--color-primary);
		cursor: pointer;
		transition: transform 0.1s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.scrubber::-webkit-slider-thumb:hover {
		transform: scale(1.3);
	}

	.scrubber::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--color-primary);
		border: none;
		cursor: pointer;
	}

	.speed-selector {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}

	.speed-btn {
		padding: 3px 8px;
		border: 1px solid var(--color-border-medium);
		background: var(--color-bg-secondary);
		color: var(--color-text-secondary);
		font-size: 11px;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.speed-btn:hover {
		color: var(--color-text-primary);
		border-color: var(--color-border-dark);
	}

	.speed-btn.active {
		background: var(--color-primary);
		color: #fff;
		border-color: var(--color-primary);
	}
</style>
