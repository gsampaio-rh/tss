<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import WindParticleSettings from './settings/WindParticleSettings.svelte';
	import WindZoneSettings from './settings/WindZoneSettings.svelte';
	import DirtyAirSettings from './settings/DirtyAirSettings.svelte';
	import LogExportSection from './settings/LogExportSection.svelte';

	function toggleSetting(key: keyof typeof $settings) {
		settings.update(s => ({
			...s,
			[key]: !s[key]
		}));
	}
</script>

<div class="settings-container">
	<div class="settings-grid">
		<!-- Show Tracks -->
		<label class="setting-item" class:checked={$settings.showTracks} for="set-show-tracks">
			<input
				class="btn-check"
				type="checkbox"
				id="set-show-tracks"
				checked={$settings.showTracks}
				onchange={() => toggleSetting('showTracks')}
			/>
			<div class="setting-content">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 16 16"
					class="setting-icon"
				>
					<path
						fill="none"
						stroke="currentColor"
						stroke-width="0.5"
						d="m6.3 15-.5-.4-.5-.4-.5-.4.5-.4.5-.3.6-.3.6-.3.6-.3.6-.3.6-.3.7-.2-.3-.4-.4-.4-.4-.4-.4-.4-.4-.4-.5-.4-.4-.4-.5-.4-.5-.3-.5-.4.5-.4.5-.4.5-.4.6-.3.5-.4.5-.4.4-.4"
					></path>
					<ellipse ry="0.7" rx="0.7" cx="2" cy="15"></ellipse>
					<ellipse ry="0.7" rx="0.7" cx="14" cy="15"></ellipse>
					<ellipse ry="0.7" rx="0.7" cx="8" cy="2"></ellipse>
				</svg>
				<div class="setting-label">
					<strong>Show Tracks</strong>
					<small>Display boat movement paths</small>
				</div>
			</div>
		</label>

		<!-- Show Boats -->
		<label class="setting-item" class:checked={$settings.showBoats} for="set-show-boats">
			<input
				class="btn-check"
				type="checkbox"
				id="set-show-boats"
				checked={$settings.showBoats}
				onchange={() => toggleSetting('showBoats')}
			/>
			<div class="setting-content">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="-5.6247 -10 11.2494 18.5"
					style="transform: rotate(45deg);"
					class="setting-icon"
				>
					<path
						d="M -4 7.5 L 4 7.5 C 5 1.5 5 -2.5 2.5 -9 L -2.5 -9 C -5 -2.5 -5 1.5 -4 7.5 Z"
						stroke="currentColor"
						stroke-width="1"
						fill="none"
					/>
					<path d="M 0 -6 C 2 -4 3 -1 2 6" stroke="currentColor" fill="none" stroke-width="1" />
					<ellipse rx="1" ry="1" cx="0" cy="-6" />
				</svg>
				<div class="setting-label">
					<strong>Show Boats</strong>
					<small>Display boat icons</small>
				</div>
			</div>
		</label>

		<!-- Show Lanelines -->
		<label class="setting-item" class:checked={$settings.showLanelines} for="set-show-lanelines">
			<input
				class="btn-check"
				type="checkbox"
				id="set-show-lanelines"
				checked={$settings.showLanelines}
				onchange={() => toggleSetting('showLanelines')}
			/>
			<div class="setting-content">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="-8 0 16 16"
					class="setting-icon"
				>
					<path d="M -8 12 L 0 4 L 8 12" stroke="currentColor" stroke-width=".5" fill="none"></path>
					<ellipse rx="1.5" ry="1.5" cx="0" cy="4" fill="currentColor"></ellipse>
				</svg>
				<div class="setting-label">
					<strong>Show Laylines</strong>
					<small>Display optimal approach angles</small>
				</div>
			</div>
		</label>

		<!-- Wind Particles toggle + controls -->
		<WindParticleSettings />

		<!-- Show Grid -->
		<label class="setting-item" class:checked={$settings.showGrid} for="set-show-grid">
			<input
				type="checkbox"
				class="btn-check"
				id="set-show-grid"
				checked={$settings.showGrid}
				onchange={() => toggleSetting('showGrid')}
			/>
			<div class="setting-content">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 16 16"
					class="setting-icon"
				>
					<path
						d="M 0 0 L 16 0 M 0 4 L 16 4 M 0 8 L 16 8 M 0 12 L 16 12 M 0 16 L 16 16"
						stroke="currentColor"
						stroke-width="0.5"
						fill="none"
					/>
					<path
						d="M 0 0 L 0 16 M 4 0 L 4 16 M 8 0 L 8 16 M 12 0 L 12 16 M 16 0 L 16 16"
						stroke="currentColor"
						stroke-width="0.5"
						fill="none"
					/>
				</svg>
				<div class="setting-label">
					<strong>Show Grid</strong>
					<small>Display tactical grid reference</small>
				</div>
			</div>
		</label>

		<!-- Wind Zones toggle + controls -->
		<WindZoneSettings />

		<!-- Wind Arrows + Dirty Air toggles -->
		<DirtyAirSettings />

		<!-- Screen info + Export logs -->
		<LogExportSection />
	</div>
</div>

<style>
	.settings-container {
		width: 100%;
	}

	.settings-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.settings-grid .setting-item) {
		display: flex;
		align-items: center;
		padding: 0.5rem;
		border: 1px solid #e9ecef;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
		background: #ffffff;
	}

	:global(.settings-grid .setting-item:hover) {
		background: #f8f9fa;
		border-color: #007bff;
	}

	:global(.settings-grid .setting-item.checked) {
		background: #e7f3ff;
		border-color: #007bff;
	}

	:global(.settings-grid .setting-item.info-item) {
		cursor: default;
		background: #f8f9fa;
		border-color: #dee2e6;
	}

	:global(.settings-grid .setting-item.info-item:hover) {
		background: #f8f9fa;
		border-color: #dee2e6;
	}

	:global(.settings-grid .setting-item.action-item) {
		padding: 0.5rem;
		border: 1px solid #e9ecef;
		border-radius: 4px;
		background: #ffffff;
	}

	:global(.settings-grid .setting-item.action-item button) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.settings-grid .setting-item.action-item button:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.settings-grid .setting-content) {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	:global(.settings-grid .setting-icon) {
		flex-shrink: 0;
		color: #495057;
	}

	:global(.settings-grid .setting-item.checked .setting-icon) {
		color: #007bff;
	}

	:global(.settings-grid .setting-label) {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		flex: 1;
	}

	:global(.settings-grid .setting-label strong) {
		font-size: 0.85rem;
		color: #212529;
		font-weight: 600;
	}

	:global(.settings-grid .setting-label small) {
		font-size: 0.75rem;
		color: #6c757d;
		line-height: 1.2;
	}

	:global(.settings-grid .setting-item.checked .setting-label strong) {
		color: #007bff;
	}

	:global(.settings-grid .btn-check) {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	:global(.settings-grid .setting-item-range) {
		cursor: default;
		padding: 0.75rem;
	}

	:global(.settings-grid .setting-item-range:hover) {
		background: #ffffff;
		border-color: #e9ecef;
	}

	:global(.settings-grid .setting-item-range .setting-content) {
		flex-direction: column;
		align-items: stretch;
	}

	:global(.settings-grid .opacity-slider) {
		width: 100%;
		margin-top: 0.5rem;
		height: 6px;
		border-radius: 3px;
		background: #e9ecef;
		outline: none;
		-webkit-appearance: none;
	}

	:global(.settings-grid .opacity-slider::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #007bff;
		cursor: pointer;
	}

	:global(.settings-grid .opacity-slider::-moz-range-thumb) {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #007bff;
		cursor: pointer;
		border: none;
	}
</style>
