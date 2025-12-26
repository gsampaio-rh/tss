<script lang="ts">
  import { settings } from '$lib/stores/settings';
  import { onMount, onDestroy } from 'svelte';
  
  let screenWidth = 0;
  let screenHeight = 0;
  
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

