<script lang="ts">
  import { settings } from '$lib/stores/settings';
  import { gameLogs } from '$lib/stores/gameLogs';
  import { onMount, onDestroy } from 'svelte';
  
  let screenWidth = 0;
  let screenHeight = 0;
  
  function handleExportLogs() {
    if ($gameLogs) {
      gameLogs.downloadLog();
    }
  }
  
  $: hasLogs = $gameLogs !== null;
  
  function updateScreenSize() {
    if (typeof window !== 'undefined') {
      screenWidth = window.innerWidth;
      screenHeight = window.innerHeight;
    }
  }
  
  onMount(() => {
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
  });
  
  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateScreenSize);
    }
  });
  
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
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" class="setting-icon">
        <path fill="none" stroke="currentColor" stroke-width="0.5"
              d="m6.3 15-.5-.4-.5-.4-.5-.4.5-.4.5-.3.6-.3.6-.3.6-.3.6-.3.6-.3.7-.2-.3-.4-.4-.4-.4-.4-.4-.4-.4-.4-.5-.4-.4-.4-.5-.4-.5-.3-.5-.4.5-.4.5-.4.5-.4.6-.3.5-.4.5-.4.4-.4"></path>
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
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="-5.6247 -10 11.2494 18.5"
             style="transform: rotate(45deg);" class="setting-icon">
        <path d="M -4 7.5 L 4 7.5 C 5 1.5 5 -2.5 2.5 -9 L -2.5 -9 C -5 -2.5 -5 1.5 -4 7.5 Z"
              stroke="currentColor" stroke-width="1" fill="none" />
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
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="-8 0 16 16" class="setting-icon">
        <path d="M -8 12 L 0 4 L 8 12" stroke="currentColor" stroke-width=".5" fill="none"></path>
        <ellipse rx="1.5" ry="1.5" cx="0" cy="4" fill="currentColor"></ellipse>
      </svg>
        <div class="setting-label">
          <strong>Show Laylines</strong>
          <small>Display optimal approach angles</small>
        </div>
      </div>
    </label>

    <!-- Show Wind Indicators -->
    <label class="setting-item" class:checked={$settings.showWindIndicators} for="set-show-wind-indicators">
    <input 
      type="checkbox" 
      class="btn-check" 
      id="set-show-wind-indicators"
      checked={$settings.showWindIndicators}
      onchange={() => toggleSetting('showWindIndicators')}
    />
      <div class="setting-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" class="setting-icon">
        <path d="M 8 2 L 8 12 M 8 2 L 5 6 M 8 2 L 11 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
        <div class="setting-label">
          <strong>Wind Particles</strong>
          <small>Show animated wind flow</small>
        </div>
  </div>
    </label>

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
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" class="setting-icon">
          <path d="M 0 0 L 16 0 M 0 4 L 16 4 M 0 8 L 16 8 M 0 12 L 16 12 M 0 16 L 16 16" 
                stroke="currentColor" stroke-width="0.5" fill="none"/>
          <path d="M 0 0 L 0 16 M 4 0 L 4 16 M 8 0 L 8 16 M 12 0 L 12 16 M 16 0 L 16 16" 
                stroke="currentColor" stroke-width="0.5" fill="none"/>
      </svg>
        <div class="setting-label">
          <strong>Show Grid</strong>
          <small>Display tactical grid reference</small>
        </div>
      </div>
    </label>

    <!-- Show Wind Zones -->
    <label class="setting-item" class:checked={$settings.showWindZones} for="set-show-wind-zones">
      <input 
        type="checkbox" 
        class="btn-check" 
        id="set-show-wind-zones"
        checked={$settings.showWindZones}
        onchange={() => toggleSetting('showWindZones')}
      />
      <div class="setting-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" class="setting-icon">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1" fill="none"/>
          <line x1="8" y1="8" x2="8" y2="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 6 4 L 8 2 L 10 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="setting-label">
          <strong>Wind Zones</strong>
          <small>Show sailing zones on hover</small>
        </div>
      </div>
    </label>

    <!-- Show Dirty Air Zones -->
    <label class="setting-item" class:checked={$settings.showDirtyAir} for="set-show-dirty-air">
      <input 
        type="checkbox" 
        class="btn-check" 
        id="set-show-dirty-air"
        checked={$settings.showDirtyAir}
        onchange={() => toggleSetting('showDirtyAir')}
      />
      <div class="setting-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" class="setting-icon">
          <path d="M 8 2 L 8 14 M 4 6 L 8 2 L 12 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 3 10 Q 8 8 13 10" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round"/>
          <path d="M 3 12 Q 8 10 13 12" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round"/>
      </svg>
        <div class="setting-label">
          <strong>Dirty Air Zones</strong>
          <small>Show turbulent air visualization</small>
        </div>
      </div>
    </label>

    <!-- Enable Dirty Air Effects -->
    <label class="setting-item" class:checked={$settings.enableDirtyAirEffects} for="set-enable-dirty-air-effects">
      <input 
        type="checkbox" 
        class="btn-check" 
        id="set-enable-dirty-air-effects"
        checked={$settings.enableDirtyAirEffects}
        onchange={() => toggleSetting('enableDirtyAirEffects')}
      />
      <div class="setting-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" class="setting-icon">
          <path d="M 8 2 L 8 14 M 4 6 L 8 2 L 12 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 3 10 Q 8 8 13 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path d="M 3 12 Q 8 10 13 12" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <circle cx="12" cy="4" r="2" fill="currentColor" opacity="0.8"/>
      </svg>
        <div class="setting-label">
          <strong>Dirty Air Effects</strong>
          <small>Apply speed/angle penalties</small>
        </div>
      </div>
    </label>

    <!-- Screen Resolution (Info Only) -->
    <div class="setting-item info-item">
      <div class="setting-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" class="setting-icon">
          <path d="M0 0h16v16H0V0zm1 1v6h14V1H1zm0 8v6h14V9H1zm1-7h12v4H2V2zm0 8h12v4H2v-4z"/>
      </svg>
        <div class="setting-label">
          <strong>Screen Resolution</strong>
          <small>{screenWidth} × {screenHeight} px</small>
        </div>
      </div>
    </div>

    <!-- Export Game Logs -->
    <div class="setting-item action-item">
      <button 
        class="btn btn-outline-primary btn-sm w-100"
        onclick={handleExportLogs}
        disabled={!hasLogs}
        title="Export game logs as JSON"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 0.5rem;">
          <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.854 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293V6.5z"/>
          <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
        </svg>
        Export Logs
      </button>
    </div>
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
  
  .setting-item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #ffffff;
  }
  
  .setting-item:hover {
    background: #f8f9fa;
    border-color: #007bff;
  }
  
  .setting-item.checked {
    background: #e7f3ff;
    border-color: #007bff;
  }
  
  .setting-item.info-item {
    cursor: default;
    background: #f8f9fa;
    border-color: #dee2e6;
  }
  
  .setting-item.info-item:hover {
    background: #f8f9fa;
    border-color: #dee2e6;
  }
  
  .setting-item.action-item {
    padding: 0.5rem;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    background: #ffffff;
  }
  
  .setting-item.action-item button {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .setting-item.action-item button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .setting-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }
  
  .setting-icon {
    flex-shrink: 0;
    color: #495057;
  }
  
  .setting-item.checked .setting-icon {
    color: #007bff;
  }
  
  .setting-label {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    flex: 1;
  }
  
  .setting-label strong {
    font-size: 0.85rem;
    color: #212529;
    font-weight: 600;
  }
  
  .setting-label small {
    font-size: 0.75rem;
    color: #6c757d;
    line-height: 1.2;
  }
  
  .setting-item.checked .setting-label strong {
    color: #007bff;
  }
  
  .btn-check {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
</style>

