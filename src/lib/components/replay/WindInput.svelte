<script lang="ts">
	import { session } from '$lib/stores/session';
	import { timeline } from '$lib/stores/timeline';
	import { estimateWindFromTracks, estimateAverageWindDirection } from '$lib/domain/services/WindEstimationService';
	import type { WindEntry, WindTimeline } from '$lib/types/session';

	$: wind = $session?.wind ?? { source: 'manual' as const, entries: [] };
	$: entries = wind.entries;

	let newDirection = 0;
	let newSpeed = 8;

	function updateWind(updated: WindTimeline) {
		session.update((s) => {
			if (!s) return s;
			return { ...s, wind: updated };
		});
	}

	function handleSetBase() {
		updateWind({
			source: 'manual',
			entries: [
				{ time: $session?.startTime ?? 0, direction: newDirection, speed: newSpeed },
				...entries.slice(1)
			]
		});
	}

	function handleAddShift() {
		const time = $timeline.currentTime || $session?.startTime || 0;
		const newEntry: WindEntry = { time, direction: newDirection, speed: newSpeed };

		const updated = [...entries, newEntry].sort((a, b) => a.time - b.time);
		updateWind({ source: 'manual', entries: updated });
	}

	function handleRemoveEntry(index: number) {
		if (index === 0) return;
		const updated = entries.filter((_, i) => i !== index);
		updateWind({ source: 'manual', entries: updated });
	}

	function handleEstimateWind() {
		if (!$session) return;
		const estimated = estimateWindFromTracks($session.tracks);
		if (estimated.length > 0) {
			updateWind({ source: 'estimated', entries: estimated });
		} else {
			const avgDir = estimateAverageWindDirection($session.tracks);
			if (avgDir !== null) {
				updateWind({
					source: 'estimated',
					entries: [{ time: $session.startTime, direction: avgDir, speed: 0 }]
				});
			}
		}
	}

	function formatShiftTime(timeMs: number): string {
		const start = $session?.startTime ?? 0;
		const elapsed = Math.floor((timeMs - start) / 1000);
		const mins = Math.floor(elapsed / 60);
		const secs = elapsed % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="wind-input">
	<h4 class="section-label">Wind Data</h4>

	<div class="input-row">
		<label>
			<span>Direction</span>
			<div class="input-with-unit">
				<input type="number" bind:value={newDirection} min="0" max="359" step="1" />
				<span class="unit">°</span>
			</div>
		</label>
		<label>
			<span>Speed</span>
			<div class="input-with-unit">
				<input type="number" bind:value={newSpeed} min="0" max="60" step="0.5" />
				<span class="unit">kn</span>
			</div>
		</label>
	</div>

	<div class="action-row">
		<button class="btn btn-sm btn-outline-primary" on:click={handleSetBase}>
			Set Base Wind
		</button>
		<button class="btn btn-sm btn-outline-secondary" on:click={handleAddShift}>
			Add Shift at {formatShiftTime($timeline.currentTime || $session?.startTime || 0)}
		</button>
	</div>
	<div class="action-row">
		<button class="btn btn-sm btn-outline-info" on:click={handleEstimateWind} title="Estimate wind direction from tacking angles in the track data">
			Estimate from Tracks
		</button>
	</div>

	{#if entries.length > 0}
		<div class="entries-list">
			{#each entries as entry, i}
				<div class="entry-row">
					<span class="entry-time">{formatShiftTime(entry.time)}</span>
					<span class="entry-dir">{entry.direction}°</span>
					<span class="entry-speed">{entry.speed} kn</span>
					{#if i > 0}
						<button class="remove-btn" on:click={() => handleRemoveEntry(i)} title="Remove">
							&times;
						</button>
					{:else}
						<span class="base-label">base</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.wind-input {
		width: 100%;
	}

	.section-label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0 0 var(--spacing-sm) 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.input-row {
		display: flex;
		gap: 10px;
		margin-bottom: var(--spacing-sm);
	}

	.input-row label {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.input-row label span {
		font-size: 11px;
		color: var(--color-text-secondary);
	}

	.input-with-unit {
		display: flex;
		align-items: center;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.input-with-unit input {
		flex: 1;
		border: none;
		background: transparent;
		color: var(--color-text-primary);
		padding: 5px 8px;
		font-size: var(--font-size-sm);
		outline: none;
		width: 60px;
	}

	.input-with-unit .unit {
		padding: 0 8px;
		font-size: 11px;
		color: var(--color-text-secondary);
		border-left: 1px solid var(--color-border-light);
		background: var(--color-bg-primary);
	}

	.action-row {
		display: flex;
		gap: 6px;
		margin-bottom: 10px;
	}

	.action-row .btn {
		font-size: 11px;
		padding: 4px 8px;
	}

	.entries-list {
		border-top: 1px solid var(--color-border-light);
		padding-top: var(--spacing-sm);
	}

	.entry-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 4px 0;
		font-size: var(--font-size-xs);
	}

	.entry-time {
		color: var(--color-text-secondary);
		min-width: 40px;
		font-family: var(--font-family-mono);
	}

	.entry-dir {
		color: var(--color-text-primary);
		min-width: 36px;
	}

	.entry-speed {
		color: var(--color-text-secondary);
		flex: 1;
	}

	.remove-btn {
		border: none;
		background: transparent;
		color: var(--color-danger);
		font-size: 16px;
		cursor: pointer;
		padding: 0 4px;
		line-height: 1;
	}

	.base-label {
		font-size: 10px;
		color: var(--color-text-secondary);
		background: var(--color-bg-tertiary);
		padding: 1px 6px;
		border-radius: var(--radius-sm);
	}
</style>
