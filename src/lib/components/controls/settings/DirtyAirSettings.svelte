<script lang="ts">
	import { settings } from '$lib/stores/settings';

	function toggleSetting(key: keyof typeof $settings) {
		settings.update(s => ({ ...s, [key]: !s[key] }));
	}
</script>

<label class="setting-item" class:checked={$settings.showWindArrows} for="set-show-wind-arrows">
	<input
		type="checkbox"
		class="btn-check"
		id="set-show-wind-arrows"
		checked={$settings.showWindArrows}
		onchange={() => toggleSetting('showWindArrows')}
	/>
	<div class="setting-content">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 16 16"
			class="setting-icon"
		>
			<line x1="2" y1="8" x2="8" y2="2" stroke="#dc3545" stroke-width="1.5" stroke-linecap="round" />
			<polygon points="8,2 6.5,3.5 7.5,3.5" fill="#dc3545" />
			<line x1="2" y1="8" x2="8" y2="4" stroke="#007bff" stroke-width="1.5" stroke-linecap="round" />
			<polygon points="8,4 6.5,5 7.5,5" fill="#007bff" />
		</svg>
		<div class="setting-label">
			<strong>Show Wind Arrows</strong>
			<small>Display true wind and apparent wind vectors</small>
		</div>
	</div>
</label>

<label class="setting-item" class:checked={$settings.showDirtyAir} for="set-show-dirty-air">
	<input
		type="checkbox"
		class="btn-check"
		id="set-show-dirty-air"
		checked={$settings.showDirtyAir}
		onchange={() => toggleSetting('showDirtyAir')}
	/>
	<div class="setting-content">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 16 16"
			class="setting-icon"
		>
			<path d="M 8 2 L 8 14 M 4 6 L 8 2 L 12 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M 3 10 Q 8 8 13 10" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" />
			<path d="M 3 12 Q 8 10 13 12" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" />
		</svg>
		<div class="setting-label">
			<strong>Dirty Air Zones</strong>
			<small>Show turbulent air visualization</small>
		</div>
	</div>
</label>

<label
	class="setting-item"
	class:checked={$settings.enableDirtyAirEffects}
	for="set-enable-dirty-air-effects"
>
	<input
		type="checkbox"
		class="btn-check"
		id="set-enable-dirty-air-effects"
		checked={$settings.enableDirtyAirEffects}
		onchange={() => toggleSetting('enableDirtyAirEffects')}
	/>
	<div class="setting-content">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 16 16"
			class="setting-icon"
		>
			<path d="M 8 2 L 8 14 M 4 6 L 8 2 L 12 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M 3 10 Q 8 8 13 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
			<path d="M 3 12 Q 8 10 13 12" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
			<circle cx="12" cy="4" r="2" fill="currentColor" opacity="0.8" />
		</svg>
		<div class="setting-label">
			<strong>Dirty Air Effects</strong>
			<small>Apply speed/angle penalties</small>
		</div>
	</div>
</label>
