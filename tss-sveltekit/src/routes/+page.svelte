<script lang="ts">
  import SettingsPanel from '$lib/components/controls/SettingsPanel.svelte';
  import PlayerControl from '$lib/components/controls/PlayerControl.svelte';
  import WindSelector from '$lib/components/controls/WindSelector.svelte';
  import GameCanvas from '$lib/components/game/GameCanvas.svelte';
  import LiftKnockIndicator from '$lib/components/game/LiftKnockIndicator.svelte';
  import PlayerTacticalCard from '$lib/components/game/PlayerTacticalCard.svelte';
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

<div class="app-layout">
  <!-- Left Sidebar - Controls and Settings -->
  <div class="sidebar sidebar-left">
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
  <div class="game-stage-container">
    {#if $game}
      <GameCanvas />
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
  <div class="sidebar sidebar-right">
    <div class="sidebar-content">
      <!-- Player Tactical Cards - Always visible during race -->
      {#if $game && !$isStart}
        <div class="sidebar-section">
          <div class="section-header">
            <h6 class="section-title">Boat Tactical Data</h6>
          </div>
          <div class="section-content">
            {#each $players as player, i}
              <PlayerTacticalCard boat={player} playerIndex={i} />
            {/each}
          </div>
        </div>
      {/if}
      
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
                                role="button"
                                tabindex="0"
                                aria-label={$players[playerIdx].name || `Player ${playerIdx + 1}`}
                                on:mouseenter={() => highlightPlayer(playerIdx)}
                                on:mouseleave={() => unhighlightPlayer()}
                                on:click={() => focusPlayer(playerIdx)}
                                on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? focusPlayer(playerIdx) : null}
                                title={$players[playerIdx].name || `Player ${playerIdx + 1}`}
                              ></span>
                              <span 
                                class="player-name-link"
                                role="button"
                                tabindex="0"
                                aria-label={$players[playerIdx].name || `Player ${playerIdx + 1}`}
                                on:mouseenter={() => highlightPlayer(playerIdx)}
                                on:mouseleave={() => unhighlightPlayer()}
                                on:click={() => focusPlayer(playerIdx)}
                                on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? focusPlayer(playerIdx) : null}
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
                      role="button"
                      tabindex="0"
                      aria-label={`Focus on ${$players[insight.playerIndex].name || `Player ${insight.playerIndex + 1}`}`}
                      on:mouseenter={() => highlightPlayer(insight.playerIndex)}
                      on:mouseleave={() => unhighlightPlayer()}
                      on:click={() => focusPlayer(insight.playerIndex)}
                      on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? focusPlayer(insight.playerIndex) : null}
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
  
  /* Page-specific overrides only */
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
</style>