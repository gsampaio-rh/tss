<script lang="ts">
	import { session, sessionActions } from '$lib/stores/session';
	import { BOAT_COLORS, getBoatColorHex } from '$lib/types/game';
	import type { TrainingSession } from '$lib/types/session';

	let isDragOver = false;
	let importing = false;
	let error: string | null = null;
	let importedSession: TrainingSession | null = null;
	let colorPickerOpen: number | null = null;

	const availableColors = Object.entries(BOAT_COLORS);

	session.subscribe((s) => {
		importedSession = s;
	});

	function handleColorSelect(trackIndex: number, colorName: string) {
		sessionActions.setSailorColor(trackIndex, colorName);
		colorPickerOpen = null;
	}

	function toggleColorPicker(trackIndex: number) {
		colorPickerOpen = colorPickerOpen === trackIndex ? null : trackIndex;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;

		const files = getGpxFiles(e.dataTransfer?.files);
		if (files.length > 0) {
			await importFiles(files);
		}
	}

	async function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = getGpxFiles(input.files);
		if (files.length > 0) {
			await importFiles(files);
		}
		input.value = '';
	}

	function getGpxFiles(fileList: FileList | null | undefined): File[] {
		if (!fileList) return [];
		return Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.gpx'));
	}

	async function importFiles(files: File[]) {
		importing = true;
		error = null;
		try {
			await sessionActions.importGpxFiles(files);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			importing = false;
		}
	}

	function handleClearSession() {
		sessionActions.clearSession();
	}

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}m ${secs}s`;
	}

	function formatDistance(meters: number): string {
		return meters >= 1000
			? `${(meters / 1000).toFixed(2)} km`
			: `${Math.round(meters)} m`;
	}
</script>

<div class="import-panel">
	{#if !importedSession}
		<!-- Drop zone -->
		<div
			class="drop-zone"
			class:drag-over={isDragOver}
			class:importing
			on:dragover={handleDragOver}
			on:dragleave={handleDragLeave}
			on:drop={handleDrop}
			role="button"
			tabindex="0"
		>
			{#if importing}
				<div class="drop-icon spinner"></div>
				<span class="drop-text">Importing...</span>
			{:else}
				<div class="drop-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
						<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
						<path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
					</svg>
				</div>
				<span class="drop-text">Drop GPX files here</span>
				<span class="drop-subtext">or click to browse</span>
			{/if}
			<input
				type="file"
				accept=".gpx"
				multiple
				class="file-input"
				on:change={handleFileInput}
			/>
		</div>

		{#if error}
			<div class="import-error">{error}</div>
		{/if}
	{:else}
		<!-- Import summary -->
		<div class="import-summary">
			<div class="summary-header">
				<h4>{importedSession.name}</h4>
				<button class="btn btn-sm btn-outline-danger" on:click={handleClearSession} title="Close session">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
						<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
					</svg>
				</button>
			</div>

			<div class="summary-stats">
				<div class="stat-row">
					<span class="stat-label">Sailors</span>
					<span class="stat-value">{importedSession.tracks.length}</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Duration</span>
					<span class="stat-value">{formatDuration((importedSession.endTime - importedSession.startTime) / 1000)}</span>
				</div>
			</div>

			<div class="track-list">
				{#each importedSession.tracks as track, idx}
					<div class="track-item">
						<button
							class="track-color-btn"
							style="background-color: {getBoatColorHex(track.color)};"
							on:click={() => toggleColorPicker(idx)}
							title="Change color"
						></button>
						<div class="track-info">
							<span class="track-name">{track.name}</span>
							<span class="track-stats">
								{formatDistance(track.stats.totalDistanceM)} &middot;
								{track.stats.avgSpeedKnots.toFixed(1)} kn avg &middot;
								{track.stats.tackCount} tacks
							</span>
						</div>
					</div>
					{#if colorPickerOpen === idx}
						<div class="color-picker">
							{#each availableColors as [name, hex]}
								<button
									class="color-swatch"
									class:selected={track.color === name}
									style="background-color: {hex};"
									on:click={() => handleColorSelect(idx, name)}
									title={name}
								></button>
							{/each}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.import-panel {
		width: 100%;
	}

	.drop-zone {
		position: relative;
		border: 2px dashed var(--color-border-medium);
		border-radius: var(--radius-lg);
		padding: 24px 16px;
		text-align: center;
		cursor: pointer;
		transition: all var(--transition-base);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		color: var(--color-text-secondary);
		background: var(--color-bg-primary);
	}

	.drop-zone:hover,
	.drop-zone.drag-over {
		border-color: var(--color-primary);
		background: rgba(0, 123, 255, 0.05);
		color: var(--color-primary);
	}

	.drop-zone.importing {
		pointer-events: none;
		opacity: 0.7;
	}

	.file-input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.drop-icon {
		font-size: 32px;
		line-height: 1;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid var(--color-border-medium);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.drop-text {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
	}

	.drop-subtext {
		font-size: var(--font-size-xs);
		opacity: 0.7;
	}

	.import-error {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: rgba(220, 53, 69, 0.08);
		border: 1px solid rgba(220, 53, 69, 0.25);
		border-radius: var(--radius-sm);
		color: var(--color-danger);
		font-size: var(--font-size-xs);
	}

	.import-summary {
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.summary-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-sm);
	}

	.summary-header h4 {
		margin: 0;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.summary-stats {
		display: flex;
		gap: 16px;
		margin-bottom: 10px;
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border-light);
	}

	.stat-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-label {
		font-size: 10px;
		text-transform: uppercase;
		color: var(--color-text-secondary);
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.track-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.track-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.track-color-btn {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		flex-shrink: 0;
		border: 2px solid rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: transform var(--transition-fast), box-shadow var(--transition-fast);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
	}

	.track-color-btn:hover {
		transform: scale(1.15);
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
	}

	.color-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding: 6px 8px;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-sm);
		margin-left: 26px;
	}

	.color-swatch {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform var(--transition-fast), border-color var(--transition-fast);
	}

	.color-swatch:hover {
		transform: scale(1.2);
	}

	.color-swatch.selected {
		border-color: var(--color-text-primary);
		box-shadow: 0 0 0 1px var(--color-bg-secondary);
	}

	.track-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.track-name {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track-stats {
		font-size: 10px;
		color: var(--color-text-secondary);
	}
</style>
