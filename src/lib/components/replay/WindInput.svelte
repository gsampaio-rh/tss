<script lang="ts">
	import { session } from '$lib/stores/session';
	import { timeline } from '$lib/stores/timeline';
	import { estimateWindFromTracks, estimateAverageWindDirection } from '$lib/domain/services/WindEstimationService';
	import type { WindEntry, WindTimeline } from '$lib/types/session';

	$: wind = $session?.wind ?? { source: 'manual' as const, entries: [] };
	$: entries = wind.entries;
	$: baseEntry = entries.length > 0 ? entries[0] : null;
	$: shiftEntries = entries.slice(1);

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

	function handleClearShifts() {
		if (entries.length <= 1) return;
		updateWind({ source: wind.source, entries: [entries[0]] });
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
	<!-- Base wind summary -->
	{#if baseEntry}
		<div class="base-summary">
			<div class="base-arrow" style="transform: rotate({baseEntry.direction}deg)">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
					<line x1="10" y1="16" x2="10" y2="4" />
					<polyline points="6,8 10,4 14,8" />
				</svg>
			</div>
			<div class="base-vals">
				<span class="base-dir">{baseEntry.direction}°</span>
				<span class="base-speed">{baseEntry.speed > 0 ? `${baseEntry.speed} kn` : '—'}</span>
			</div>
			<span class="source-badge">{wind.source}</span>
		</div>
	{/if}

	<!-- Input controls -->
	<div class="input-row">
		<label class="field">
			<span class="field-label">Dir</span>
			<div class="field-input">
				<input type="number" bind:value={newDirection} min="0" max="359" step="1" />
				<span class="field-unit">°</span>
			</div>
		</label>
		<label class="field">
			<span class="field-label">Speed</span>
			<div class="field-input">
				<input type="number" bind:value={newSpeed} min="0" max="60" step="0.5" />
				<span class="field-unit">kn</span>
			</div>
		</label>
	</div>

	<div class="btn-row">
		<button class="wind-btn wind-btn-primary" on:click={handleSetBase}>Set Base</button>
		<button class="wind-btn" on:click={handleAddShift}>
			+ Shift @ {formatShiftTime($timeline.currentTime || $session?.startTime || 0)}
		</button>
	</div>
	<div class="btn-row">
		<button class="wind-btn wind-btn-accent" on:click={handleEstimateWind} title="Estimate wind from tacking angles">
			<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
				<path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
				<path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
			</svg>
			Auto-estimate
		</button>
	</div>

	<!-- Shifts list -->
	{#if shiftEntries.length > 0}
		<div class="shifts-header">
			<span class="shifts-title">Wind shifts ({shiftEntries.length})</span>
			<button class="shifts-clear" on:click={handleClearShifts} title="Remove all shifts">Clear</button>
		</div>
		<div class="shifts-list">
			{#each entries as entry, i}
				{#if i > 0}
					<div class="shift-row">
						<span class="shift-time">{formatShiftTime(entry.time)}</span>
						<span class="shift-arrow" style="transform: rotate({entry.direction}deg)">
							<svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="10" y1="16" x2="10" y2="4" />
								<polyline points="6,8 10,4 14,8" />
							</svg>
						</span>
						<span class="shift-dir">{entry.direction}°</span>
						<span class="shift-speed">{entry.speed > 0 ? `${entry.speed} kn` : '—'}</span>
						<button class="shift-remove" on:click={() => handleRemoveEntry(i)} title="Remove">
							<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
								<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
							</svg>
						</button>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.wind-input {
		width: 100%;
	}

	/* ── Base wind summary ── */
	.base-summary {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		margin-bottom: 10px;
	}

	.base-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(0, 123, 255, 0.08);
		color: var(--color-primary);
		flex-shrink: 0;
	}

	.base-vals {
		display: flex;
		flex-direction: column;
		gap: 0;
		flex: 1;
	}

	.base-dir {
		font-size: 14px;
		font-weight: 700;
		color: var(--color-text-primary);
		line-height: 1.2;
	}

	.base-speed {
		font-size: 11px;
		color: var(--color-text-secondary);
		line-height: 1.2;
	}

	.source-badge {
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		background: var(--color-bg-tertiary);
		color: var(--color-text-secondary);
		font-weight: 600;
	}

	/* ── Input fields ── */
	.input-row {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}

	.field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.field-label {
		font-size: 10px;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.field-input {
		display: flex;
		align-items: center;
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--color-bg-secondary);
		transition: border-color 0.12s ease;
	}

	.field-input:focus-within {
		border-color: var(--color-primary);
	}

	.field-input input {
		flex: 1;
		border: none;
		background: transparent;
		color: var(--color-text-primary);
		padding: 5px 8px;
		font-size: 12px;
		outline: none;
		width: 50px;
	}

	.field-unit {
		padding: 0 7px;
		font-size: 10px;
		color: var(--color-text-secondary);
		border-left: 1px solid var(--color-border-light);
		background: var(--color-bg-primary);
		line-height: 28px;
	}

	/* ── Buttons ── */
	.btn-row {
		display: flex;
		gap: 4px;
		margin-bottom: 6px;
	}

	.wind-btn {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 4px 8px;
		font-size: 10px;
		font-weight: 600;
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all 0.12s ease;
		white-space: nowrap;
	}

	.wind-btn:hover {
		background: var(--color-bg-tertiary);
	}

	.wind-btn-primary {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}

	.wind-btn-primary:hover {
		background: var(--color-primary-hover);
	}

	.wind-btn-accent {
		border-color: var(--color-info);
		color: var(--color-info);
		background: transparent;
	}

	.wind-btn-accent:hover {
		background: rgba(23, 162, 184, 0.06);
	}

	/* ── Shifts list ── */
	.shifts-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 10px;
		padding-top: 8px;
		border-top: 1px solid var(--color-border-light);
		margin-bottom: 4px;
	}

	.shifts-title {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		color: var(--color-text-secondary);
	}

	.shifts-clear {
		border: none;
		background: transparent;
		font-size: 10px;
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: 0;
		transition: color 0.1s ease;
	}

	.shifts-clear:hover {
		color: var(--color-danger);
	}

	.shifts-list {
		max-height: 160px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.shift-row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 6px;
		border-radius: var(--radius-sm);
		transition: background 0.1s ease;
	}

	.shift-row:hover {
		background: var(--color-bg-primary);
	}

	.shift-time {
		font-size: 11px;
		font-family: var(--font-family-mono);
		color: var(--color-text-secondary);
		min-width: 36px;
	}

	.shift-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		color: var(--color-text-secondary);
		flex-shrink: 0;
	}

	.shift-dir {
		font-size: 11px;
		font-weight: 600;
		color: var(--color-text-primary);
		min-width: 30px;
	}

	.shift-speed {
		font-size: 11px;
		color: var(--color-text-secondary);
		flex: 1;
	}

	.shift-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		background: transparent;
		color: var(--color-text-secondary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		opacity: 0;
		transition: all 0.1s ease;
	}

	.shift-row:hover .shift-remove {
		opacity: 1;
	}

	.shift-remove:hover {
		color: var(--color-danger);
		background: rgba(220, 53, 69, 0.08);
	}
</style>
