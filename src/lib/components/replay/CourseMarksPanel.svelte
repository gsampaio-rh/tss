<script lang="ts">
	import { courseMarks, startLine, windwardMark, leewardMark, placementMode, courseMarkActions } from '$lib/stores/courseMarks';
	import { session } from '$lib/stores/session';
	import { autoDetectCourse } from '$lib/domain/services/CourseDetectionService';
	import type { CourseMarkType } from '$lib/types/session';

	const markTypes: { type: CourseMarkType; label: string; icon: string }[] = [
		{ type: 'start-port', label: 'Start (Port)', icon: 'P' },
		{ type: 'start-starboard', label: 'Start (Starboard)', icon: 'S' },
		{ type: 'windward', label: 'Windward Mark', icon: 'W' },
		{ type: 'leeward', label: 'Leeward Mark', icon: 'L' }
	];

	let detecting = false;

	async function handleAutoDetect() {
		if (!$session) return;
		detecting = true;

		try {
			const windDir = $session.wind.entries.length > 0
				? $session.wind.entries[0].direction
				: undefined;
			const detected = autoDetectCourse($session.tracks, windDir);

			for (const mark of detected) {
				courseMarkActions.placeMark(mark.type, mark.lat, mark.lon);
			}
		} finally {
			detecting = false;
		}
	}

	function togglePlacement(type: CourseMarkType) {
		if ($placementMode === type) {
			courseMarkActions.setPlacementMode(null);
		} else {
			courseMarkActions.setPlacementMode(type);
		}
	}

	function removeMark(type: CourseMarkType) {
		courseMarkActions.removeMark(type);
	}

	$: hasStartLine = !!$startLine;
	$: hasWindward = !!$windwardMark;
	$: hasLeeward = !!$leewardMark;

	function isPlaced(type: CourseMarkType): boolean {
		return $courseMarks.some((m) => m.type === type);
	}
</script>

<div class="course-marks-panel">
	<div class="marks-list">
		{#each markTypes as { type, label, icon }}
			{@const placed = isPlaced(type)}
			<div class="mark-row" class:placed>
				<span class="mark-icon">{icon}</span>
				<span class="mark-label">{label}</span>
				<div class="mark-actions">
					{#if placed}
						<button
							class="btn-sm btn-remove"
							on:click={() => removeMark(type)}
							title="Remove"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
								<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
							</svg>
						</button>
					{/if}
					<button
						class="btn-sm"
						class:active={$placementMode === type}
						on:click={() => togglePlacement(type)}
						title={$placementMode === type ? 'Cancel placement' : 'Place on map'}
					>
						{#if $placementMode === type}
							Cancel
						{:else if placed}
							Move
						{:else}
							Place
						{/if}
					</button>
				</div>
			</div>
		{/each}
	</div>

	{#if $placementMode}
		<div class="placement-hint">
			Click on the map to place the mark
		</div>
	{/if}

	{#if hasStartLine}
		<div class="course-info">
			<span class="info-label">Start line set</span>
		</div>
	{/if}

	<div class="panel-actions">
		<button class="btn-detect" on:click={handleAutoDetect} disabled={detecting || !$session}>
			{detecting ? 'Detecting...' : 'Auto-Detect Course'}
		</button>
		{#if $courseMarks.length > 0}
			<button class="btn-clear" on:click={() => courseMarkActions.clearAll()}>
				Clear All
			</button>
		{/if}
	</div>
</div>

<style>
	.course-marks-panel {
		width: 100%;
	}

	.marks-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.mark-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 6px 8px;
		border-radius: var(--radius-sm);
		background: var(--color-bg-tertiary);
		transition: background var(--transition-fast);
	}

	.mark-row.placed {
		background: rgba(40, 167, 69, 0.08);
		border: 1px solid rgba(40, 167, 69, 0.2);
	}

	.mark-icon {
		font-size: 14px;
		width: 20px;
		text-align: center;
	}

	.mark-label {
		flex: 1;
		font-size: var(--font-size-xs);
		color: var(--color-text-primary);
	}

	.mark-actions {
		display: flex;
		gap: 4px;
	}

	.btn-sm {
		padding: 2px 8px;
		font-size: 10px;
		font-weight: var(--font-weight-medium);
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-sm:hover {
		background: var(--color-bg-tertiary);
	}

	.btn-sm.active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.btn-remove {
		color: var(--color-danger);
		border-color: transparent;
		background: transparent;
		padding: 2px 4px;
	}

	.btn-remove:hover {
		background: rgba(220, 53, 69, 0.1);
	}

	.placement-hint {
		margin-top: var(--spacing-sm);
		padding: 6px 10px;
		background: rgba(0, 123, 255, 0.08);
		border: 1px solid rgba(0, 123, 255, 0.2);
		border-radius: var(--radius-sm);
		font-size: 11px;
		color: var(--color-primary);
		text-align: center;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.course-info {
		margin-top: var(--spacing-sm);
		padding: 4px 8px;
		font-size: 10px;
		color: var(--color-success);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.panel-actions {
		display: flex;
		gap: 6px;
		margin-top: var(--spacing-sm);
	}

	.btn-detect {
		flex: 1;
		padding: 5px 8px;
		font-size: 10px;
		font-weight: var(--font-weight-medium);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-sm);
		background: rgba(0, 123, 255, 0.08);
		color: var(--color-primary);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-detect:hover:not(:disabled) {
		background: var(--color-primary);
		color: white;
	}

	.btn-detect:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-clear {
		padding: 5px 8px;
		font-size: 10px;
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-clear:hover {
		color: var(--color-danger);
		border-color: var(--color-danger);
	}
</style>
