import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Settings {
	showBoats: boolean;
	showTracks: boolean;
	showLanelines: boolean;
	showWindIndicators: boolean;
	showGrid: boolean;
	showWindZones: boolean;
	windZonesOpacity: number; // 0-1 range for wind zones opacity
	windZonesSize: number; // 0.5-2.0 multiplier for wind zones size (1.0 = default)
	windParticlesDensity: number; // 0.5-2.0 multiplier for particle density (1.0 = default)
	windParticlesOpacity: number; // 0-1 range for particle opacity (0.6 = default)
	windParticlesSpeed: number; // 0.5-2.0 multiplier for particle speed (1.0 = default)
	windParticlesLength: number; // 0.5-2.0 multiplier for streak length (1.0 = default)
	showDirtyAir: boolean;
	enableDirtyAirEffects: boolean;
}

const defaultSettings: Settings = {
	showBoats: true,
	showTracks: true,
	showLanelines: true,
	showWindIndicators: true,
	showGrid: true,
	showWindZones: true,
	windZonesOpacity: 0.4, // Default opacity (40%)
	windZonesSize: 1.0, // Default size multiplier (100%)
	windParticlesDensity: 1.0, // Default density multiplier (100%)
	windParticlesOpacity: 0.6, // Default opacity (60%)
	windParticlesSpeed: 1.0, // Default speed multiplier (100%)
	windParticlesLength: 1.0, // Default length multiplier (100%)
	showDirtyAir: false,
	enableDirtyAirEffects: false
};

const STORAGE_KEY = 'settings';

function createSettingsStore() {
	// Initialize with defaults or stored values
	let initialValue = defaultSettings;

	if (browser) {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				initialValue = { ...defaultSettings, ...parsed };
			} catch (e) {
				console.error('Failed to load settings from localStorage:', e);
			}
		}
	}

	const { subscribe, set, update } = writable<Settings>(initialValue);

	return {
		subscribe,
		set: (value: Settings) => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
			}
			set(value);
		},
		update: (updater: (current: Settings) => Settings) => {
			update(current => {
				const updated = updater(current);
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				}
				return updated;
			});
		},
		reset: () => {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set(defaultSettings);
		}
	};
}

export const settings = createSettingsStore();
