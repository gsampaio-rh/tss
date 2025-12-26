/**
 * Adapter to bridge between vanilla JS settings and Svelte store
 * This allows gradual migration - use this to connect old code to new store
 */

import { settings } from '$lib/stores/settings';
import type { Settings } from '$lib/stores/settings';

// Export settings object that old code can use
let currentSettings: Settings = {
  showBoats: true,
  showTracks: true,
  showLanelines: true,
  showWindIndicators: true,
  showGrid: true,
};

// Subscribe to store changes and update local object
settings.subscribe(value => {
  currentSettings = value;
});

/**
 * Get current settings (for use in vanilla JS code)
 */
export function getSettings(): Settings {
  return currentSettings;
}

/**
 * Apply settings to DOM (for gradual migration)
 * This mimics the old applySettings() function
 */
export function applySettingsToDOM() {
  const s = getSettings();
  
  // Apply showTracks
  const trackCont = document.getElementById('track-cont');
  if (trackCont) {
    trackCont.style.opacity = s.showTracks ? '100%' : '0';
  }
  
  // Apply showLanelines
  const upMarkLanelines = document.getElementById('upmarklines');
  if (upMarkLanelines) {
    upMarkLanelines.style.opacity = s.showLanelines ? '1' : '0';
  }
  
  // Apply showBoats
  const gameArea = document.getElementById('game-area');
  if (gameArea) {
    if (s.showBoats) {
      gameArea.setAttribute('data-show-boats', 'full');
    } else {
      gameArea.setAttribute('data-show-boats', 'dot');
    }
  }
  
  // Apply showWindIndicators
  const windIndicators = document.getElementById('wind-indicators');
  if (windIndicators) {
    windIndicators.style.display = s.showWindIndicators ? '' : 'none';
  }
}

// Auto-apply when settings change (for gradual migration)
settings.subscribe(() => {
  applySettingsToDOM();
});

