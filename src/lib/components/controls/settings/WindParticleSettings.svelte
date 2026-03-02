<script lang="ts">
	import { settings } from '$lib/stores/settings';

	function toggleSetting(key: keyof typeof $settings) {
		settings.update(s => ({ ...s, [key]: !s[key] }));
	}
</script>

<label
	class="setting-item"
	class:checked={$settings.showWindIndicators}
	for="set-show-wind-indicators"
>
	<input
		type="checkbox"
		class="btn-check"
		id="set-show-wind-indicators"
		checked={$settings.showWindIndicators}
		onchange={() => toggleSetting('showWindIndicators')}
	/>
	<div class="setting-content">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			fill="currentColor"
			viewBox="0 0 16 16"
			class="setting-icon"
		>
			<path
				d="M 8 2 L 8 12 M 8 2 L 5 6 M 8 2 L 11 6"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<div class="setting-label">
			<strong>Wind Particles</strong>
			<small>Show animated wind flow</small>
		</div>
	</div>
</label>

{#if $settings.showWindIndicators}
	<div class="setting-item setting-item-range">
		<div class="setting-content">
			<div class="setting-label">
				<strong>Particle Density</strong>
				<small>{Math.round($settings.windParticlesDensity * 100)}%</small>
			</div>
			<input
				type="range"
				class="opacity-slider"
				min="0.5"
				max="5.0"
				step="0.1"
				value={$settings.windParticlesDensity}
				oninput={(e) => {
					const value = parseFloat((e.target as HTMLInputElement).value);
					settings.update(s => ({ ...s, windParticlesDensity: value }));
				}}
			/>
		</div>
	</div>
	<div class="setting-item setting-item-range">
		<div class="setting-content">
			<div class="setting-label">
				<strong>Particle Opacity</strong>
				<small>{Math.round($settings.windParticlesOpacity * 100)}%</small>
			</div>
			<input
				type="range"
				class="opacity-slider"
				min="0"
				max="3.0"
				step="0.05"
				value={$settings.windParticlesOpacity}
				oninput={(e) => {
					const value = parseFloat((e.target as HTMLInputElement).value);
					settings.update(s => ({ ...s, windParticlesOpacity: value }));
				}}
			/>
		</div>
	</div>
	<div class="setting-item setting-item-range">
		<div class="setting-content">
			<div class="setting-label">
				<strong>Particle Speed</strong>
				<small>{Math.round($settings.windParticlesSpeed * 100)}%</small>
			</div>
			<input
				type="range"
				class="opacity-slider"
				min="0.5"
				max="2.0"
				step="0.1"
				value={$settings.windParticlesSpeed}
				oninput={(e) => {
					const value = parseFloat((e.target as HTMLInputElement).value);
					settings.update(s => ({ ...s, windParticlesSpeed: value }));
				}}
			/>
		</div>
	</div>
	<div class="setting-item setting-item-range">
		<div class="setting-content">
			<div class="setting-label">
				<strong>Streak Length</strong>
				<small>{Math.round($settings.windParticlesLength * 100)}%</small>
			</div>
			<input
				type="range"
				class="opacity-slider"
				min="0.5"
				max="2.0"
				step="0.1"
				value={$settings.windParticlesLength}
				oninput={(e) => {
					const value = parseFloat((e.target as HTMLInputElement).value);
					settings.update(s => ({ ...s, windParticlesLength: value }));
				}}
			/>
		</div>
	</div>
{/if}
