<script lang="ts">
  import SettingsPanel from '$lib/components/controls/SettingsPanel.svelte';
  import PlayerControl from '$lib/components/controls/PlayerControl.svelte';
  import WindSelector from '$lib/components/controls/WindSelector.svelte';
  import GameCanvas from '$lib/components/game/GameCanvas.svelte';
  import LiftKnockIndicator from '$lib/components/game/LiftKnockIndicator.svelte';
  import { settings } from '$lib/stores/settings';
  import { game, players, turnCount, isStart, gameActions, currentWind, previousWind } from '$lib/stores/game';
  import { windScenarios, windActions, initializeWindScenarios } from '$lib/stores/wind';
  import { COLORS } from '$lib/types/game';
  import { calculateLiftHeader, calculateVMGEfficiency, angleDiff, getOptimalHeading } from '$lib/utils/gameLogic';
  import { onMount } from 'svelte';
  
  // Initialize wind scenarios on mount
  onMount(() => {
    const scenarios = initializeWindScenarios();
    windActions.loadScenarios(scenarios);
    
    // Create initial game if scenarios are loaded
    if (scenarios.length > 0) {
      gameActions.createGame(2, scenarios[0]);
    }
  });
  
  let raceStarting = false;
  let raceStarted = false;
  
  // Sidebar state - collapsible sections
  let settingsExpanded = false;
  
  // Compute tactical insights for all players
  $: tacticalInsights = (() => {
    if (!$game || $isStart) return { hasImportantInsights: false, insights: [], groupedInsights: [] };
    
      const insights: Array<{
      playerIndex: number;
      player: typeof $players[0];
      level: 'advantage' | 'watch' | 'act' | 'optimal' | 'neutral';
      message: string;
      detail: string;
      liftAmount: number;
      relativeAngle: number;
      isAhead: boolean;
      isBehind: boolean;
      relativeToOthers: number;
      windEvent: 'lift' | 'header' | null;
      vmgEfficiency: number;
    }> = [];
    
    $players.forEach((player, i) => {
      // Get windward mark position
      const windwardMark = $game.marks[2];
      if (!windwardMark) return;
      
      // Calculate lift/header using correct method (relative to course axis)
      const windDirPrev = $previousWind;
      const windDirNow = $currentWind;
      
      // Only calculate lift/header if we have a previous wind value (not first turn)
      let liftHeaderResult: { isLift: boolean; isHeader: boolean; errorChange: number; errorBefore: number; errorAfter: number } | null = null;
      if ($turnCount > 0 && windDirPrev !== windDirNow) {
        liftHeaderResult = calculateLiftHeader(
          player,
          player.x,
          player.y,
          windwardMark.x,
          windwardMark.y,
          windDirPrev,
          windDirNow,
          true // isUpwind
        );
        
        // Validate invariant: lift on one tack = header on other
        // Calculate for opposite tack to verify
        const oppositeTack = !player.tack;
        const oppositeResult = calculateLiftHeader(
          { ...player, tack: oppositeTack } as typeof player,
          player.x,
          player.y,
          windwardMark.x,
          windwardMark.y,
          windDirPrev,
          windDirNow,
          true
        );
        
        if (liftHeaderResult.isLift === oppositeResult.isLift) {
          console.error(`[INVALID WIND SHIFT] Both tacks show same result:`, {
            currentTack: player.tack ? 'Port' : 'Starboard',
            currentResult: liftHeaderResult.isLift ? 'LIFT' : 'HEADER',
            oppositeResult: oppositeResult.isLift ? 'LIFT' : 'HEADER',
            windDirPrev,
            windDirNow
          });
        }
      }
      
      // Calculate VMG efficiency
      const vmgEfficiency = calculateVMGEfficiency(
        player.rotation,
        player.x,
        player.y,
        windwardMark.x,
        windwardMark.y,
        1.0, // boat speed
        true // isUpwind
      );
      
      // Use lift/header result if available, otherwise fall back to angle-based calculation
      const isLifted = liftHeaderResult ? liftHeaderResult.isLift : false;
      const isHeader = liftHeaderResult ? liftHeaderResult.isHeader : false;
      const liftAmount = liftHeaderResult ? liftHeaderResult.errorChange : 0;
      const isSignificant = liftAmount > 5;
      const isSevere = liftAmount > 15;
      
      const otherPlayers = $players.filter((p, idx) => idx !== i);
      const relativeToOthers = otherPlayers.length > 0 ? (() => {
        const thisDist = Math.sqrt(player.x ** 2 + player.y ** 2);
        const othersAvgDist = otherPlayers.reduce((sum, p) => sum + Math.sqrt(p.x ** 2 + p.y ** 2), 0) / otherPlayers.length;
        return thisDist - othersAvgDist;
      })() : 0;
      const isAhead = relativeToOthers < -2;
      const isBehind = relativeToOthers > 2;
      
      let level: 'advantage' | 'watch' | 'act' | 'optimal' | 'neutral' = 'neutral';
      let message = '';
      let detail = '';
      const windEvent: 'lift' | 'header' | null = liftHeaderResult 
        ? (liftHeaderResult.isLift ? 'lift' : liftHeaderResult.isHeader ? 'header' : null)
        : null;
      
      if (player.finished !== false) {
        level = 'neutral';
        message = 'Finished';
        detail = '';
      } else if (windEvent === 'lift' && isSevere) {
        // Wind event: LIFT
        level = 'advantage';
        message = `LIFT +${liftAmount.toFixed(0)}°`;
        detail = 'Angle improved — maintain course';
      } else if (windEvent === 'lift' && isSignificant) {
        level = 'advantage';
        message = `LIFT +${liftAmount.toFixed(0)}°`;
        detail = 'Slight angle improvement';
      } else if (windEvent === 'header' && isSevere) {
        // Wind event: HEADER
        level = 'act';
        message = `HEADER -${liftAmount.toFixed(0)}°`;
        detail = 'Angle worsened — consider tacking soon';
      } else if (windEvent === 'header' && isSignificant) {
        level = 'watch';
        message = `HEADER -${liftAmount.toFixed(0)}°`;
        detail = 'Angle worsened — watch and consider tack';
      } else if (vmgEfficiency < 0.85) {
        // Performance state: VMG Low
        level = 'act';
        message = 'VMG Low';
        detail = `Efficiency ${(vmgEfficiency * 100).toFixed(0)}% — outside optimal range`;
      } else if (vmgEfficiency >= 0.95) {
        level = 'optimal';
        message = 'Optimal';
        detail = `VMG efficiency ${(vmgEfficiency * 100).toFixed(0)}% — maximizing progress`;
      } else {
        level = 'neutral';
        message = 'Sailing';
        detail = `VMG efficiency ${(vmgEfficiency * 100).toFixed(0)}%`;
      }
      
      insights.push({
        playerIndex: i,
        player,
        level,
        message,
        detail,
        liftAmount,
        relativeAngle: liftHeaderResult ? liftHeaderResult.errorChange : 0,
        isAhead,
        isBehind,
        relativeToOthers,
        windEvent,
        vmgEfficiency
      });
    });
    
    // Group similar insights
    const groupedInsights: Array<{
      type: string;
      players: number[];
      message: string;
      level: 'advantage' | 'watch' | 'act' | 'optimal' | 'neutral';
    }> = [];
    
    // Group by similar disadvantage/advantage
    const disadvantagePlayers = insights.filter(i => i.level === 'act' || i.level === 'watch');
    const advantagePlayers = insights.filter(i => i.level === 'advantage');
    
    if (disadvantagePlayers.length > 1) {
      const avgKnock = disadvantagePlayers.reduce((sum, i) => sum + i.liftAmount, 0) / disadvantagePlayers.length;
      groupedInsights.push({
        type: 'group-disadvantage',
        players: disadvantagePlayers.map(i => i.playerIndex),
        message: `Multiple boats knocked (~${avgKnock.toFixed(0)}°)`,
        level: 'watch'
      });
    }
    
    if (advantagePlayers.length > 1) {
      const avgLift = advantagePlayers.reduce((sum, i) => sum + i.liftAmount, 0) / advantagePlayers.length;
      groupedInsights.push({
        type: 'group-advantage',
        players: advantagePlayers.map(i => i.playerIndex),
        message: `Multiple boats lifted (~${avgLift.toFixed(0)}°)`,
        level: 'advantage'
      });
    }
    
    const hasImportantInsights = insights.some(i => i.level === 'act' || i.level === 'watch') || groupedInsights.length > 0;
    
    return { hasImportantInsights, insights, groupedInsights };
  })();
  
  
  function handleStart() {
    // Apply all player settings first
    gameActions.applyStart();
    
    // Micro-ceremony: transition animation
    raceStarting = true;
    setTimeout(() => {
      raceStarting = false;
      raceStarted = true;
      // Then start the race
      gameActions.startRace();
      
      // Clear the "race started" message after 3 seconds
      setTimeout(() => {
        raceStarted = false;
      }, 3000);
    }, 500);
  }
  
  function handleTurn() {
    gameActions.turn();
  }
  
  function handleBackTurn() {
    gameActions.backTurn();
  }
  
  let focusedPlayerIndex: number | null = null;
  
  function highlightPlayer(index: number) {
    document.body.setAttribute('data-hover-player', index.toString());
  }
  
  function unhighlightPlayer() {
    document.body.removeAttribute('data-hover-player');
  }
  
  function focusPlayer(index: number) {
    if (focusedPlayerIndex === index) {
      focusedPlayerIndex = null;
      document.body.removeAttribute('data-focused-player');
    } else {
      focusedPlayerIndex = index;
      document.body.setAttribute('data-focused-player', index.toString());
    }
  }
</script>

<svelte:head>
  <title>TSS | Tactical Sailing Simulator</title>
  <meta name="viewport" content="width=device-width, initial-scale=0.8, maximum-scale=0.8" />
</svelte:head>

<div class="d-flex h-100" style="overflow: hidden; background: #f0f0f0;">
  <!-- Left Sidebar - Controls and Settings -->
  <div class="sidebar sidebar-left" style="width: 20%; background: #ffffff; overflow-y: auto; height: 100vh; flex-shrink: 0; box-shadow: 2px 0 10px rgba(0,0,0,0.1); border-right: 1px solid #e0e0e0;">
    <div class="sidebar-content">
      <!-- Minimal Header -->
      <div class="sidebar-header">
        <h5 class="sidebar-title">TSS</h5>
        <small class="text-muted">Tactical Sailing Simulator</small>
      </div>
      
      <!-- Wind Selector (always visible, compact) -->
      <div class="sidebar-section compact">
        <WindSelector />
      </div>
      
      <!-- PRIMARY ACTION ZONE - Context-aware, high emphasis -->
      {#if $isStart}
        <!-- START PHASE: Primary action is "Start Race" -->
        <div class="primary-action-zone start-phase">
          <button 
            class="btn btn-primary btn-lg w-100 primary-action-btn" 
            on:click={handleStart}
            disabled={raceStarting}
            style="
              font-size: 1.1rem;
              font-weight: 600;
              padding: 0.75rem 1rem;
              box-shadow: 0 4px 12px rgba(0,123,255,0.3);
            "
          >
            {#if raceStarting}
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              Starting...
            {:else}
              ▶ Start Race
            {/if}
          </button>
          
          {#if raceStarting}
            <div class="action-feedback mt-2">
              <small class="text-muted">Wind locked, positions set...</small>
            </div>
          {/if}
        </div>
        
        <!-- Players Section - Visible in start phase -->
        <div class="sidebar-section players-section">
          <div class="section-header">
            <h6 class="section-title">Players ({$players.length})</h6>
            <button 
              class="btn btn-sm btn-outline-secondary add-player-btn"
              on:click={() => gameActions.addPlayer(COLORS)}
              title="Add Player"
            >
              + Add
            </button>
          </div>
          <div class="section-content">
            {#each $players as player, i}
              <PlayerControl {player} playerIndex={i} />
            {/each}
          </div>
        </div>
      {:else}
        <!-- RACE PHASE: Primary action is "Next Turn" -->
        <div class="primary-action-zone race-phase">
          <!-- Turn Progress -->
          <div class="turn-progress mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-muted small">Turn {$turnCount}</span>
              <span class="text-muted small">Wind: {$currentWind}º</span>
            </div>
            <div class="progress" style="height: 4px; background: #e9ecef;">
              <div 
                class="progress-bar bg-primary" 
                role="progressbar" 
                style="width: {Math.min(($turnCount / 50) * 100, 100)}%; transition: width 0.3s ease;"
              ></div>
            </div>
          </div>
          
          <!-- Primary Action Button -->
          <button 
            class="btn btn-primary btn-lg w-100 primary-action-btn" 
            on:click={handleTurn}
            style="
              font-size: 1.1rem;
              font-weight: 600;
              padding: 0.75rem 1rem;
              box-shadow: 0 4px 12px rgba(0,123,255,0.3);
            "
          >
            Next Turn →
          </button>
          
          <!-- Secondary Action -->
          <button 
            class="btn btn-outline-secondary btn-sm w-100 mt-2" 
            on:click={handleBackTurn}
            style="font-size: 0.9rem;"
          >
            ← Back
          </button>
          
          {#if raceStarted}
            <div class="action-feedback mt-2">
              <small class="text-success">✓ Race started</small>
            </div>
          {/if}
        </div>
        
        <!-- Turn Selection - Compact, focused -->
        <div class="sidebar-section turn-selection-section">
          <div class="section-header">
            <h6 class="section-title">Select Turns</h6>
            <small class="text-muted">{$players.length} players</small>
          </div>
          <div class="section-content compact-players">
            {#each $players as player, i}
              <PlayerControl {player} playerIndex={i} />
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Settings - Collapsible, minimized by default -->
      <div class="sidebar-section collapsible">
        <button 
          class="section-toggle"
          on:click={() => settingsExpanded = !settingsExpanded}
          aria-expanded={settingsExpanded}
        >
          <h6 class="section-title">Settings</h6>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            fill="currentColor" 
            viewBox="0 0 16 16"
            class="toggle-icon"
            class:expanded={settingsExpanded}
          >
            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
        {#if settingsExpanded}
          <div class="section-content">
            <SettingsPanel />
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Game Canvas - 60% width, full height stage -->
  <div class="game-stage-container" style="width: 60%; height: 100vh; position: relative; background: #d5d5d5; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-left: 1px solid #bbb; border-right: 1px solid #bbb;">
    {#if $game}
      <div class="game-field-container" style="
        width: 100%; 
        height: 100%; 
        background: #ebeaff; 
        position: relative;
        border: 2px solid rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        box-shadow: 
          inset 0 0 30px rgba(0,0,0,0.08),
          0 2px 8px rgba(0,0,0,0.1);
      ">
        <GameCanvas />
      </div>
    {:else}
      <div class="d-flex align-items-center justify-content-center h-100">
        <div class="text-center">
          <h3>Loading game...</h3>
          <p class="text-muted">Initializing wind scenarios...</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Right Sidebar - Insights Only, 20% width -->
  <div class="sidebar sidebar-right" style="width: 20%; background: #ffffff; overflow-y: auto; height: 100vh; flex-shrink: 0; box-shadow: -2px 0 10px rgba(0,0,0,0.1); border-left: 1px solid #e0e0e0;">
    <div class="sidebar-content">
      <!-- Tactical Insight Panel - Contextual Coach/Referee (Always Expanded) -->
      <div class="sidebar-section tactical-insight-panel" class:has-alerts={tacticalInsights.hasImportantInsights}>
        <div class="section-header">
          <h6 class="section-title">
            {#if tacticalInsights.hasImportantInsights}
              <span class="alert-indicator">⚠</span>
            {/if}
            Race Insight
          </h6>
        </div>
        <div class="section-content">
            {#if $game && !$isStart}
              <div class="tactical-insight-content">
                <!-- Grouped Insights First (if any) -->
                {#if tacticalInsights.groupedInsights.length > 0}
                  {#each tacticalInsights.groupedInsights as group}
                    <div class="insight-card grouped" class:needs-attention={group.level === 'act' || group.level === 'watch'}>
                      <div class="insight-header">
                        <span class="insight-icon">⚠</span>
                        <div class="insight-text">
                          <strong>{group.message}</strong>
                          <div class="insight-players">
                            Players affected:
                            {#each group.players as playerIdx}
                              <span 
                                class="player-dot" 
                                style="background-color: {$players[playerIdx].color};"
                                on:mouseenter={() => highlightPlayer(playerIdx)}
                                on:mouseleave={() => unhighlightPlayer()}
                                on:click={() => focusPlayer(playerIdx)}
                                title={$players[playerIdx].name || `Player ${playerIdx + 1}`}
                              ></span>
                              <span 
                                class="player-name-link"
                                on:mouseenter={() => highlightPlayer(playerIdx)}
                                on:mouseleave={() => unhighlightPlayer()}
                                on:click={() => focusPlayer(playerIdx)}
                              >
                                {$players[playerIdx].name || `P${playerIdx + 1}`}
                              </span>
                            {/each}
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                {/if}
                
                <!-- Individual Player Insights -->
                {#each tacticalInsights.insights as insight}
                  {#if insight.level !== 'neutral' || insight.isAhead || insight.isBehind}
                    <div 
                      class="insight-card player-insight" 
                      class:needs-attention={insight.level === 'act' || insight.level === 'watch'}
                      data-player-index={insight.playerIndex.toString()}
                      on:mouseenter={() => highlightPlayer(insight.playerIndex)}
                      on:mouseleave={() => unhighlightPlayer()}
                      on:click={() => focusPlayer(insight.playerIndex)}
                    >
                      <div class="insight-header">
                        <span class="player-dot" style="background-color: {insight.player.color};"></span>
                        <div class="insight-text">
                          <div class="insight-title-row">
                            <strong>{insight.player.name || `Player ${insight.playerIndex + 1}`}</strong>
                            {#if insight.isAhead}
                              <span class="position-text">Leading by {Math.abs(insight.relativeToOthers).toFixed(1)}</span>
                            {:else if insight.isBehind}
                              <span class="position-text">Trailing by {insight.relativeToOthers.toFixed(1)}</span>
                            {/if}
                          </div>
                          <!-- Wind Event Visual Indicator -->
                          {#if insight.windEvent}
                            <LiftKnockIndicator 
                              relativeAngle={insight.windEvent === 'lift' ? insight.liftAmount : -insight.liftAmount} 
                              liftAmount={insight.liftAmount} 
                            />
                          {/if}
                          <div class="insight-detail">{insight.detail}</div>
                          {#if insight.level === 'act'}
                            <div class="insight-action">
                              <strong>Suggested actions:</strong>
                              <ul>
                                <li>Tack now to regain VMG</li>
                                <li>Continue 1–2 turns if protecting lane</li>
                              </ul>
                            </div>
                          {/if}
                        </div>
                      </div>
                      
                      <!-- Technical Details (Collapsed) -->
                      <details class="technical-details">
                        <summary>▸ Technical details</summary>
                        <div class="technical-content">
                          <div><strong>Position:</strong> ({insight.player.x.toFixed(1)}, {insight.player.y.toFixed(1)})</div>
                          <div><strong>Heading:</strong> {insight.player.rotation.toFixed(0)}º</div>
                          <div><strong>Tack:</strong> {insight.player.tack ? 'Port' : 'Starboard'}</div>
                          {#if insight.windEvent}
                            <div><strong>Wind Event:</strong> {insight.windEvent.toUpperCase()} {insight.windEvent === 'lift' ? '+' : '-'}{insight.liftAmount.toFixed(1)}°</div>
                          {/if}
                          <div><strong>VMG Efficiency:</strong> {(insight.vmgEfficiency * 100).toFixed(1)}%</div>
                        </div>
                      </details>
                    </div>
                  {/if}
                {/each}
                
                <!-- Quiet State Message -->
                {#if !tacticalInsights.hasImportantInsights && tacticalInsights.insights.every(i => i.level === 'neutral' || i.level === 'optimal')}
                  <div class="quiet-state">
                    <small class="text-muted">All boats sailing optimally. No tactical alerts.</small>
                  </div>
                {/if}
              </div>
            {:else if $isStart}
              <div class="quiet-state">
                <small class="text-muted">Race hasn't started yet. Insights will appear during the race.</small>
              </div>
            {:else}
              <p class="text-muted small">Loading...</p>
            {/if}
          </div>
      </div>
    </div>
  </div>
</div>

<style>
  :global(html, body) {
    height: 100%;
    margin: 0;
    padding: 0;
  }
  
  :global(#app) {
    height: 100%;
  }
  
  .sidebar {
    display: flex;
    flex-direction: column;
  }
  
  .sidebar-left {
    min-width: 200px;
  }
  
  .sidebar-right {
    min-width: 250px;
  }
  
  .sidebar-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .sidebar-header {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e9ecef;
    margin-bottom: 0.5rem;
  }
  
  .sidebar-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #212529;
    margin: 0;
    line-height: 1.2;
  }
  
  /* Primary Action Zone - High emphasis */
  .primary-action-zone {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border: 2px solid #007bff;
    border-radius: 8px;
    padding: 1.25rem;
    box-shadow: 0 4px 12px rgba(0,123,255,0.15);
  }
  
  .primary-action-btn {
    transition: all 0.2s ease;
  }
  
  .primary-action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,123,255,0.4) !important;
  }
  
  .primary-action-btn:active {
    transform: translateY(0);
  }
  
  .action-feedback {
    text-align: center;
  }
  
  /* Sidebar Sections */
  .sidebar-section {
    background: #ffffff;
  }
  
  .sidebar-section.compact {
    margin-bottom: 0;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .section-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #495057;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .section-content {
    padding-top: 0.5rem;
  }
  
  .section-content.compact-players {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  /* Collapsible Sections */
  .sidebar-section.collapsible {
    border-top: 1px solid #e9ecef;
    padding-top: 0.75rem;
  }
  
  .section-toggle {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: none;
    border: none;
    padding: 0.5rem 0;
    cursor: pointer;
    color: #495057;
    transition: color 0.2s;
  }
  
  .section-toggle:hover {
    color: #007bff;
  }
  
  .section-toggle .section-title {
    margin: 0;
  }
  
  .toggle-icon {
    transition: transform 0.2s ease;
    color: #6c757d;
  }
  
  .toggle-icon.expanded {
    transform: rotate(180deg);
  }
  
  /* Turn Progress */
  .turn-progress {
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 4px;
  }
  
  /* Players Section */
  .players-section {
    border-top: 1px solid #e9ecef;
    padding-top: 0.75rem;
  }
  
  .add-player-btn {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  
  /* Turn Selection Section */
  .turn-selection-section {
    border-top: 1px solid #e9ecef;
    padding-top: 0.75rem;
  }
  
  /* Game State Content */
  /* Tactical Insight Panel - Minimal, Scalable Design */
  .tactical-insight-panel.has-alerts .section-title {
    font-weight: 600;
  }
  
  .alert-indicator {
    margin-right: 0.25rem;
    color: #f59e0b;
    font-weight: 600;
  }
  
  .tactical-insight-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  /* Insight Cards - White, Clean, Scalable */
  .insight-card {
    padding: 0.75rem;
    background: #ffffff;
    border-left: 2px solid transparent;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .insight-card.needs-attention {
    border-left-color: #f59e0b;
  }
  
  .insight-card:hover {
    background: #fafafa;
  }
  
  .insight-header {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  /* Player Identity - Small Color Dot */
  .player-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 0.35rem;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .player-dot:hover {
    transform: scale(1.3);
  }
  
  /* Insight Icon - Single Amber Color */
  .insight-icon {
    color: #f59e0b;
    font-size: 0.9rem;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
  
  /* Insight Text - Typography Hierarchy */
  .insight-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .insight-title-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .insight-title-row strong {
    font-size: 0.9rem;
    color: #212529;
    font-weight: 600;
  }
  
  .position-text {
    font-size: 0.75rem;
    color: #6c757d;
    font-weight: 400;
  }
  
  .insight-message {
    font-size: 0.85rem;
    color: #212529;
    font-weight: 500;
  }
  
  .insight-detail {
    font-size: 0.8rem;
    color: #495057;
    line-height: 1.4;
  }
  
  .insight-action {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e9ecef;
    font-size: 0.8rem;
    color: #495057;
  }
  
  .insight-action strong {
    color: #212529;
    font-weight: 600;
  }
  
  .insight-action ul {
    margin: 0.25rem 0 0 0;
    padding-left: 1.2rem;
    list-style-type: disc;
  }
  
  .insight-action li {
    margin-top: 0.15rem;
  }
  
  /* Grouped Insights - Player List */
  .insight-players {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #6c757d;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .player-name-link {
    color: #495057;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: transparent;
    transition: text-decoration-color 0.2s;
  }
  
  .player-name-link:hover {
    text-decoration-color: #495057;
  }
  
  /* Technical Details - Collapsed, Neutral */
  .technical-details {
    margin-top: 0.5rem;
    font-size: 0.75rem;
  }
  
  .technical-details summary {
    cursor: pointer;
    color: #6c757d;
    user-select: none;
    padding: 0.25rem 0;
  }
  
  .technical-details summary:hover {
    color: #495057;
  }
  
  .technical-content {
    margin-top: 0.5rem;
    padding: 0.5rem 0 0 0.75rem;
    border-left: 1px solid #e9ecef;
    font-size: 0.7rem;
    color: #6c757d;
    line-height: 1.6;
  }
  
  .technical-content div {
    margin-bottom: 0.25rem;
  }
  
  .quiet-state {
    text-align: center;
    padding: 1rem;
    color: #6c757d;
    font-style: italic;
    font-size: 0.85rem;
  }
  
  .wind-deviation {
    margin-top: 0.25rem;
    padding-top: 0.25rem;
    border-top: 1px solid #e9ecef;
  }
  
  .badge-sm {
    padding: 0.2rem 0.4rem;
    font-size: 0.65rem;
  }
  
  /* Player Cards */
  .player-card {
    opacity: 1;
    transition: opacity 0.3s, transform 0.2s, background-color 0.2s, border-color 0.2s;
  }
  
  .player-card:hover {
    background-color: #f8f9fa;
    border-color: #007bff !important;
    transform: translateX(2px);
  }
  
  :global(body[data-focused-player]) .player-card:not([data-player-index]),
  :global(body[data-focused-player]) .player-card-small:not([data-player-index]) {
    opacity: 0.3;
  }
  
  :global(body[data-hover-player]) .player-card:not([data-player-index]),
  :global(body[data-hover-player]) .player-card-small:not([data-player-index]) {
    opacity: 0.5;
  }
  
  :global(body[data-focused-player]) .player-card[data-player-index],
  :global(body[data-hover-player]) .player-card[data-player-index],
  :global(body[data-focused-player]) .player-card-small[data-player-index],
  :global(body[data-hover-player]) .player-card-small[data-player-index] {
    background-color: #e7f3ff;
    border-color: #007bff !important;
    box-shadow: 0 2px 4px rgba(0,123,255,0.2);
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .alert {
    animation: fadeIn 0.3s ease-out;
  }
  
  /* Game stage container */
  .game-stage-container {
    background: linear-gradient(to bottom, #d8d8d8 0%, #d0d0d0 100%);
  }
  
  .game-field-container {
    transition: box-shadow 0.3s ease;
  }
  
  .game-field-container:hover {
    box-shadow: 
      inset 0 0 30px rgba(0,0,0,0.08),
      0 4px 12px rgba(0,0,0,0.15) !important;
  }
</style>