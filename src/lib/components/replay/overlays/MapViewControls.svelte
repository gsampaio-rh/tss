<script lang="ts">
	import type { TrackColorMode } from '$lib/types/session';

	export let trackColorMode: TrackColorMode;
	export let showCourseMarks: boolean;
	export let showTackMarks: boolean;
	export let currentTileLayer: 'satellite' | 'street';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher<{
		toggleTile: void;
		setColorMode: TrackColorMode;
		toggleMarks: void;
		toggleTacks: void;
	}>();
</script>

<div class="controls-bl">
	<button class="map-btn" on:click={() => dispatch('toggleTile')} title={currentTileLayer === 'satellite' ? 'Switch to street map' : 'Switch to satellite'}>
		{#if currentTileLayer === 'satellite'}
			<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022Z"/></svg>
		{:else}
			<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM2.04 4.326c.325 1.329 2.532 2.54 3.717 3.19.48.263.793.434.743.484-.08.08-.162.158-.242.234-.416.396-.787.749-.758 1.266.035.634.618.824 1.214 1.017.577.188 1.168.38 1.286.983.082.417-.075.988-.22 1.52-.215.782-.406 1.48.22 1.48 1.5-.5 3.798-3.186 4-5 .138-1.243-2-2-3.5-2.5-.478-.16-.755.081-.99.284-.172.15-.322.279-.51.216-.445-.148-2.5-2-1.5-2.5.78-.39.952-.171 1.227.182.078.099.163.208.273.318.609.304.662-.132.723-.633.039-.322.081-.671.277-.867.434-.434 1.265-.791 2.028-1.12.712-.306 1.365-.587 1.579-.88A7 7 0 1 1 2.04 4.327Z"/></svg>
		{/if}
	</button>

	<div class="controls-divider"></div>

	<div class="btn-group-toggle">
		<button class="map-btn" class:active={trackColorMode === 'boat'} on:click={() => dispatch('setColorMode', 'boat')} title="Boat color tracks">
			<svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/></svg>
			<span>Trace</span>
			<span class="info-trigger" tabindex="0" aria-label="Trace mode explanation" on:click|stopPropagation>
				<span class="info-dot">i</span>
				<span class="info-tooltip">Shows each track using that sailor color so you can identify who is who.</span>
			</span>
		</button>
		<button class="map-btn" class:active={trackColorMode === 'speed'} on:click={() => dispatch('setColorMode', 'speed')} title="Speed-colored tracks">
			<svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 2a.5.5 0 0 1 .5.5V4a.5.5 0 0 1-1 0V2.5A.5.5 0 0 1 8 2zM3.732 3.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 8a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 8zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 7.31A.91.91 0 1 0 8.85 8.569l3.434-4.297a.389.389 0 0 0-.029-.518z"/><path fill-rule="evenodd" d="M6.664 15.889A8 8 0 1 1 9.336.11a8 8 0 0 1-2.672 15.78zm-4.665-4.283A11.945 11.945 0 0 1 8 10c2.186 0 4.236.585 6.001 1.606a7 7 0 1 0-12.002 0z"/></svg>
			<span>Speed</span>
			<span class="info-trigger" tabindex="0" aria-label="Speed mode explanation" on:click|stopPropagation>
				<span class="info-dot">i</span>
				<span class="info-tooltip">SOG = speed over ground. Track color is speed: red/yellow faster, blue slower. Triangles mark each sailor max SOG and max VMG points.</span>
			</span>
		</button>
		<button class="map-btn" class:active={trackColorMode === 'favouredTack'} on:click={() => dispatch('setColorMode', 'favouredTack')} title="Wind shift-colored tracks">
			<svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg>
			<span>Shift</span>
			<span class="info-trigger" tabindex="0" aria-label="Shift mode explanation" on:click|stopPropagation>
				<span class="info-dot">i</span>
				<span class="info-tooltip">Shift compares heading vs wind direction. Green means right shift (lift), red means left shift (header), gray is neutral.</span>
			</span>
		</button>
	</div>

	<div class="controls-divider"></div>

	<button class="map-btn" class:active={showCourseMarks} on:click={() => dispatch('toggleMarks')} title="Show/hide course marks">
		<svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
		<span>Marks</span>
		<span class="info-trigger" tabindex="0" aria-label="Marks toggle explanation" on:click|stopPropagation>
			<span class="info-dot">i</span>
			<span class="info-tooltip">Show or hide start line and course marks on the map.</span>
		</span>
	</button>

	<button class="map-btn" class:active={showTackMarks} on:click={() => dispatch('toggleTacks')} title="Show/hide tack and gybe markers">
		<svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a1 1 0 0 1 1 1v5.268l4.562-2.634a1 1 0 1 1 1 1.732L10 8l4.562 2.634a1 1 0 1 1-1 1.732L9 9.732V15a1 1 0 1 1-2 0V9.732l-4.562 2.634a1 1 0 1 1-1-1.732L6 8 1.438 5.366a1 1 0 0 1 1-1.732L7 6.268V1a1 1 0 0 1 1-1z"/></svg>
		<span>Tacks</span>
		<span class="info-trigger" tabindex="0" aria-label="Tacks toggle explanation" on:click|stopPropagation>
			<span class="info-dot">i</span>
			<span class="info-tooltip">Show or hide detected tack and gybe points with maneuver stats.</span>
		</span>
	</button>
</div>

<style>
	.controls-bl {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 4px;
		border-radius: var(--radius-md);
		background: rgba(30, 34, 46, 0.85);
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.btn-group-toggle {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.controls-divider {
		height: 1px;
		background: rgba(255, 255, 255, 0.08);
		margin: 2px 4px;
	}

	.map-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 10px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: rgba(255, 255, 255, 0.8);
		font-size: 10px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.12s ease;
		white-space: nowrap;
	}

	.map-btn:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
	.map-btn.active { background: var(--color-primary); color: #fff; }
	.map-btn.active:hover { background: var(--color-primary-hover); }

	.info-trigger {
		margin-left: auto;
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
	}

	.info-dot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.45);
		font-size: 9px;
		font-weight: 700;
		line-height: 1;
		color: rgba(255, 255, 255, 0.8);
	}

	.info-tooltip {
		position: absolute;
		left: calc(100% + 8px);
		top: 50%;
		transform: translateY(-50%);
		width: 190px;
		padding: 6px 8px;
		border-radius: var(--radius-sm);
		background: rgba(21, 24, 33, 0.96);
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
		font-size: 10px;
		font-weight: 500;
		line-height: 1.35;
		color: rgba(255, 255, 255, 0.9);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.14s ease;
		z-index: 1200;
	}

	.info-trigger:hover .info-tooltip,
	.info-trigger:focus-within .info-tooltip {
		opacity: 1;
	}
</style>
