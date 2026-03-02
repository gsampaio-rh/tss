<script lang="ts">
	import { settings } from '$lib/stores/settings';

	function toggleSetting(key: keyof typeof $settings) {
		settings.update(s => ({ ...s, [key]: !s[key] }));
	}
</script>

<label class="setting-item" class:checked={$settings.showWindZones} for="set-show-wind-zones">
	<input
		type="checkbox"
		class="btn-check"
		id="set-show-wind-zones"
		checked={$settings.showWindZones}
		onchange={() => toggleSetting('showWindZones')}
	/>
	<div class="setting-content">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 16 16"
			class="setting-icon"
		>
			<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1" fill="none" />
			<line x1="8" y1="8" x2="8" y2="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			<path d="M 6 4 L 8 2 L 10 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
		<div class="setting-label">
			<strong>Wind Zones</strong>
			<small>Show sailing zones on hover</small>
		</div>
	</div>
</label>

{#if $settings.showWindZones}
	<div class="setting-item setting-item-range">
		<div class="setting-content">
			<div class="setting-label">
				<strong>Wind Zones Opacity</strong>
				<small>{Math.round($settings.windZonesOpacity * 100)}%</small>
			</div>
			<input
				type="range"
				class="opacity-slider"
				min="0"
				max="1"
				step="0.05"
				value={$settings.windZonesOpacity}
				oninput={(e) => {
					const value = parseFloat((e.target as HTMLInputElement).value);
					settings.update(s => ({ ...s, windZonesOpacity: value }));
				}}
			/>
		</div>
	</div>
	<div class="setting-item setting-item-range">
		<div class="setting-content">
			<div class="setting-label">
				<strong>Wind Zones Size</strong>
				<small>{Math.round($settings.windZonesSize * 100)}%</small>
			</div>
			<input
				type="range"
				class="opacity-slider"
				min="0.5"
				max="2.0"
				step="0.1"
				value={$settings.windZonesSize}
				oninput={(e) => {
					const value = parseFloat((e.target as HTMLInputElement).value);
					settings.update(s => ({ ...s, windZonesSize: value }));
				}}
			/>
		</div>
	</div>
{/if}
