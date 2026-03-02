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
		if (files.length > 0) await importFiles(files);
	}

	async function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = getGpxFiles(input.files);
		if (files.length > 0) await importFiles(files);
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
		return `${mins}m ${secs.toString().padStart(2, '0')}s`;
	}

	function formatDistance(meters: number): string {
		return meters >= 1000
			? `${(meters / 1000).toFixed(2)} km`
			: `${Math.round(meters)} m`;
	}

	function formatDate(date: Date): string {
		const d = new Date(date);
		return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}
</script>

<div class="import-panel">
	{#if !importedSession}
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
				<div class="spinner"></div>
				<span class="drop-label">Importing...</span>
			{:else}
				<svg class="drop-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
					<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
					<path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
				</svg>
				<span class="drop-label">Drop GPX files here</span>
				<span class="drop-sub">or click to browse</span>
			{/if}
			<input type="file" accept=".gpx" multiple class="file-input" on:change={handleFileInput} />
		</div>

		{#if error}
			<div class="error-msg">{error}</div>
		{/if}
	{:else}
		<div class="session-card">
			<!-- Header row: session name + close -->
			<div class="session-header">
				<div class="session-title">{importedSession.name}</div>
				<button class="close-btn" on:click={handleClearSession} title="Close session">
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
						<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
					</svg>
				</button>
			</div>

			<!-- Stats row -->
			<div class="stats-row">
				<div class="stat">
					<span class="stat-val">{importedSession.tracks.length}</span>
					<span class="stat-key">sailors</span>
				</div>
				<div class="stat-divider"></div>
				<div class="stat">
					<span class="stat-val">{formatDuration((importedSession.endTime - importedSession.startTime) / 1000)}</span>
					<span class="stat-key">duration</span>
				</div>
				<div class="stat-divider"></div>
				<div class="stat">
					<span class="stat-val">{formatDate(importedSession.date)}</span>
					<span class="stat-key">date</span>
				</div>
			</div>

			<!-- Track list -->
			<div class="track-list">
				{#each importedSession.tracks as track, idx}
					<div class="track-row">
						<button
							class="color-dot"
							style="background-color: {getBoatColorHex(track.color)};"
							on:click={() => toggleColorPicker(idx)}
							title="Change color"
						></button>
						<div class="track-detail">
							<span class="track-name">{track.name}</span>
							<span class="track-meta">
								{formatDistance(track.stats.totalDistanceM)}
								<span class="meta-sep"></span>
								{track.stats.avgSpeedKnots.toFixed(1)} kn avg
								<span class="meta-sep"></span>
								max {track.stats.maxSpeedKnots.toFixed(1)} kn
								<span class="meta-sep"></span>
								{track.stats.tackCount} tacks
							</span>
						</div>
					</div>
					{#if colorPickerOpen === idx}
						<div class="color-picker">
							{#each availableColors as [name, hex]}
								<button
									class="swatch"
									class:active={track.color === name}
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

	/* ── Drop zone ── */
	.drop-zone {
		position: relative;
		border: 1.5px dashed var(--color-border-medium);
		border-radius: var(--radius-md);
		padding: 18px 12px;
		text-align: center;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		color: var(--color-text-secondary);
		background: var(--color-bg-primary);
	}

	.drop-zone:hover,
	.drop-zone.drag-over {
		border-color: var(--color-primary);
		background: rgba(0, 123, 255, 0.04);
		color: var(--color-primary);
	}

	.drop-zone.importing {
		pointer-events: none;
		opacity: 0.6;
	}

	.file-input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.drop-icon {
		margin-bottom: 2px;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--color-border-medium);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.drop-label {
		font-size: 12px;
		font-weight: 600;
	}

	.drop-sub {
		font-size: 10px;
		opacity: 0.6;
	}

	.error-msg {
		margin-top: 6px;
		padding: 6px 8px;
		background: rgba(220, 53, 69, 0.06);
		border: 1px solid rgba(220, 53, 69, 0.2);
		border-radius: var(--radius-sm);
		color: var(--color-danger);
		font-size: 11px;
	}

	/* ── Session card ── */
	.session-card {
		width: 100%;
	}

	.session-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.session-title {
		font-size: 13px;
		font-weight: 700;
		color: var(--color-text-primary);
		line-height: 1.2;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.12s ease;
		flex-shrink: 0;
	}

	.close-btn:hover {
		color: var(--color-danger);
		border-color: var(--color-danger);
		background: rgba(220, 53, 69, 0.06);
	}

	/* ── Stats row ── */
	.stats-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 0;
		margin-bottom: 10px;
		border-top: 1px solid var(--color-border-light);
		border-bottom: 1px solid var(--color-border-light);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.stat-val {
		font-size: 12px;
		font-weight: 700;
		color: var(--color-text-primary);
		line-height: 1.2;
	}

	.stat-key {
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		color: var(--color-text-secondary);
		line-height: 1;
	}

	.stat-divider {
		width: 1px;
		height: 22px;
		background: var(--color-border-light);
		flex-shrink: 0;
	}

	/* ── Track list ── */
	.track-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.track-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		border-radius: var(--radius-sm);
		transition: background 0.1s ease;
	}

	.track-row:hover {
		background: var(--color-bg-primary);
	}

	.color-dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		flex-shrink: 0;
		border: 2px solid rgba(255, 255, 255, 0.7);
		cursor: pointer;
		transition: transform 0.12s ease, box-shadow 0.12s ease;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
	}

	.color-dot:hover {
		transform: scale(1.25);
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.2);
	}

	.track-detail {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 1px;
	}

	.track-name {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.3;
	}

	.track-meta {
		font-size: 10px;
		color: var(--color-text-secondary);
		line-height: 1.3;
	}

	.meta-sep {
		display: inline-block;
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: var(--color-text-secondary);
		vertical-align: middle;
		margin: 0 3px;
		opacity: 0.5;
	}

	/* ── Color picker ── */
	.color-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding: 5px 8px;
		margin-left: 22px;
		margin-bottom: 4px;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
	}

	.swatch {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.1s ease, border-color 0.1s ease;
	}

	.swatch:hover {
		transform: scale(1.2);
	}

	.swatch.active {
		border-color: var(--color-text-primary);
		box-shadow: 0 0 0 1px var(--color-bg-secondary);
	}
</style>
