import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Settings {
  showBoats: boolean;
  showTracks: boolean;
  showLanelines: boolean;
  showWindIndicators: boolean;
  showGrid: boolean;
  showWindZones: boolean;
}

const defaultSettings: Settings = {
  showBoats: true,
  showTracks: true,
  showLanelines: true,
  showWindIndicators: true,
  showGrid: true,
  showWindZones: true,
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
    },
  };
}

export const settings = createSettingsStore();

