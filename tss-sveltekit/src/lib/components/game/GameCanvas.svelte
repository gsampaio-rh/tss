<script lang="ts">
  import { game, players, marks, gameWidth, gameHeight, currentWind, turnCount } from '$lib/stores/game';
  import { settings } from '$lib/stores/settings';
  import { GRID_SIZE, getBoatColorHex } from '$lib/types/game';
  import Boat from './Boat.svelte';
  import Marks from './Marks.svelte';
  import WindParticles from './WindParticles.svelte';
  import ScaleIndicator from './ScaleIndicator.svelte';
  import GridLabels from './GridLabels.svelte';
  import GridLines from './GridLines.svelte';
import BoatTacticalLines from './BoatTacticalLines.svelte';
import WindZones from './WindZones.svelte';
import DirtyAirZones from './DirtyAirZones.svelte';
import { onMount, afterUpdate } from 'svelte';
  
  let gameArea: HTMLDivElement;
  let gameCont: HTMLDivElement;
  let lastGameWidth = 0;
  let lastGameHeight = 0;
  let hoveredPlayerIndex: string | null = null;
  
  // Track hovered player from body attribute - reactive
  $: {
    if (typeof document !== 'undefined') {
      hoveredPlayerIndex = document.body.getAttribute('data-hover-player');
    }
  }
  
  onMount(() => {
    // Create a MutationObserver to watch for changes to body attributes
    const observer = new MutationObserver(() => {
      hoveredPlayerIndex = document.body.getAttribute('data-hover-player');
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-hover-player']
    });
    
    hoveredPlayerIndex = document.body.getAttribute('data-hover-player');
    
    return () => observer.disconnect();
  });
  
  function formatCssPx(val: number): string {
    return val.toFixed(3) + 'px';
  }
  
  function formatCssDeg(val: number): string {
    return val.toFixed(3) + 'deg';
  }
  
  function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
    return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
  }
  
  function renderGridSize() {
    if (!$game || !gameCont || !gameArea) return;
    
    const w = gameCont.clientWidth;
    const h = gameCont.clientHeight;
    
    if (w === 0 || h === 0) return; // Container not sized yet
    
    // Game area should have the actual game size in pixels
    const gameWidthPx = $game.width * GRID_SIZE;
    const gameHeightPx = $game.height * GRID_SIZE;
    
    // Set game-area to actual game dimensions
    gameArea.style.width = formatCssPx(gameWidthPx);
    gameArea.style.height = formatCssPx(gameHeightPx);
    
    // Calculate scale to fit within container
    const scaleX = w / gameWidthPx;
    const scaleY = h / gameHeightPx;
    
    // Use the smaller scale to ensure content fits completely within container
    // This prevents overflow-x into sidebars
    const scale = Math.min(scaleX, scaleY);
    
    // Center the game-area within the container
    const scaledWidth = gameWidthPx * scale;
    const scaledHeight = gameHeightPx * scale;
    const left = (w - scaledWidth) / 2;
    const top = (h - scaledHeight) / 2;
    
    // Apply transform to scale and position
    // The overflow: hidden on game-canvas-wrapper and game-stage-container will clip any overflow
    gameArea.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
    gameArea.style.transformOrigin = 'top left';
  }
  
  // Only re-render when game dimensions change
  $: if ($game && ($game.width !== lastGameWidth || $game.height !== lastGameHeight)) {
    lastGameWidth = $game.width;
    lastGameHeight = $game.height;
    if (gameCont && gameArea) {
      // Use requestAnimationFrame to avoid blocking
      requestAnimationFrame(() => {
        renderGridSize();
      });
    }
  }
  
  afterUpdate(() => {
    if ($game && gameCont && gameArea) {
      requestAnimationFrame(() => {
        renderGridSize();
      });
    }
  });
  
  onMount(() => {
    // Initial render after a short delay to ensure container is sized
    setTimeout(() => {
      renderGridSize();
    }, 0);
    
    window.addEventListener('resize', renderGridSize);
    window.addEventListener('orientationchange', renderGridSize);
    
    return () => {
      window.removeEventListener('resize', renderGridSize);
      window.removeEventListener('orientationchange', renderGridSize);
    };
  });
  
  // Generate track points for a player
  function getTrackPoints(player: typeof $players[0]): string {
    if (!$game) return '';
    
    let points = '';
    for (let i = 0; i < player.turns.length && i < $game.turncount + 1; i++) {
      for (let j = 0; j < player.turns[i].points.length; j++) {
        const pt = player.turns[i].points[j];
        points += ' ' + pt.x.toFixed(3) + ',' + pt.y.toFixed(3);
      }
    }
    return points;
  }
  
  // Wind direction display
  $: windDisplayAngle = $currentWind * 2;
  $: windLabel = $currentWind > 0 ? `+${$currentWind}º` : `${$currentWind}º`;
  
  // Up mark position (mark index 2)
  $: upMark = $marks[2];
  $: upMarkX = upMark ? upMark.x * GRID_SIZE : 0;
  $: upMarkY = upMark ? upMark.y * GRID_SIZE : 0;
  
  // Start line (between marks[0] and marks[1])
  $: startMark1 = $marks[0];
  $: startMark2 = $marks[1];
  $: startLineX1 = startMark1 ? startMark1.x * GRID_SIZE : 0;
  $: startLineY1 = startMark1 ? startMark1.y * GRID_SIZE : 0;
  $: startLineX2 = startMark2 ? startMark2.x * GRID_SIZE : 0;
  $: startLineY2 = startMark2 ? startMark2.y * GRID_SIZE : 0;
  
  // Layline angles (matches original game logic)
  // These are the angles boats sail at when on the layline: -45-wind (port) and 45-wind (starboard)
  $: portLaylineAngle = -45 - $currentWind;
  $: starboardLaylineAngle = 45 - $currentWind;
  
  // Laylines extend FROM the mark BACKWARD (downwind) toward the start area
  // They show the boundary: "if you're outside this line, you can't make the mark without tacking"
  // Length: extend far enough to intersect the approach corridor from the start
  $: laylineLength = $game ? Math.max($game.width, $game.height) * 1.5 : 100;
  
  // Calculate where laylines should extend to (toward start area)
  // They should intersect the approach corridor where boats are sailing from
  $: startLineCenterX = startMark1 && startMark2 ? (startMark1.x + startMark2.x) / 2 : ($game ? $game.width / 2 : 0);
  $: startLineY = startMark1 ? startMark1.y : ($game ? $game.height - 2 : 0);
  
  // Extend laylines from mark backward along the layline angles
  // This creates the boundary that intersects the approach corridor
  $: portLaylineEndX = upMark ? upMark.x + Math.sin((portLaylineAngle + 180) * Math.PI / 180) * laylineLength : 0;
  $: portLaylineEndY = upMark ? upMark.y - Math.cos((portLaylineAngle + 180) * Math.PI / 180) * laylineLength : 0;
  $: starboardLaylineEndX = upMark ? upMark.x + Math.sin((starboardLaylineAngle + 180) * Math.PI / 180) * laylineLength : 0;
  $: starboardLaylineEndY = upMark ? upMark.y - Math.cos((starboardLaylineAngle + 180) * Math.PI / 180) * laylineLength : 0;
</script>

{#if $game}
  <div 
    bind:this={gameCont} 
    class="game-canvas-wrapper"
    data-show-boats={$settings.showBoats ? 'full' : 'dot'}
  >
    <div 
      bind:this={gameArea}
      class="game-area"
    >
      <!-- Background -->
      <svg 
        viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)} 
        class="game-background"
      ></svg>
      
      <!-- Grid Lines (visual grid for spatial reference - major/minor structure) -->
      <GridLines gameWidth={$game.width} gameHeight={$game.height} />
      
      <!-- Grid Reference Labels (for tactical distance reference) -->
      <GridLabels gameWidth={$game.width} gameHeight={$game.height} />
      
      <!-- Scale Indicator (boat length reference) -->
      <ScaleIndicator gameWidth={$game.width} gameHeight={$game.height} />
      
      <!-- Tracks -->
      {#if $settings.showTracks}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="game-tracks" 
          viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
        >
          {#each $players as player, playerIndex}
            {@const trackOpacity = 0.4}
            {@const trackWidth = 0.08}
            {@const trackColor = getBoatColorHex(player.color)}
            <polyline 
              class="player-track"
              data-player-index={playerIndex.toString()}
              points={getTrackPoints(player)}
              stroke={trackColor}
              fill="none"
              stroke-width={trackWidth}
              opacity={trackOpacity}
            />
          {/each}
        </svg>
      {/if}
      
      <!-- Marks -->
      <Marks marks={$marks} />
      
      <!-- Tactical Lines (Course Axis, Wind Axis) -->
      {#each $players as player, playerIndex}
        <BoatTacticalLines boat={player} {playerIndex} />
      {/each}
      
      <!-- Wind Zones (shown when enabled, on boat hover) -->
      {#if $settings.showWindZones}
        {#each $players as player, playerIndex}
          <WindZones boat={player} {playerIndex} show={true} />
        {/each}
      {/if}
      
      <!-- Dirty Air Zones (shown for all boats when enabled) -->
      {#if $settings.showDirtyAir}
        {#each $players as player, playerIndex}
          <DirtyAirZones boat={player} {playerIndex} show={true} />
        {/each}
      {/if}
      
      <!-- Boats -->
      {#if $settings.showBoats}
        {#each $players as player, playerIndex (playerIndex)}
          <Boat boat={player} playerIndex={playerIndex} />
        {/each}
      {/if}
      
      <!-- Wind Particles -->
      <WindParticles />
      
        <!-- Laylines (from up mark) - Decision-defining elements -->
        {#if $settings.showLanelines && upMark}
          <!-- Laylines SVG - extends from windward mark across full field -->
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
            class="game-laylines"
          >
            <!-- Laylines: boundaries of the approach corridor -->
            <!-- Extend FROM the mark BACKWARD (downwind) toward the start area -->
            <!-- Shows: "if you're outside this boundary, you can't make the mark without tacking" -->
            <!-- Port layline: boundary for port-tack approach -->
            <line 
              x1={upMark.x} 
              y1={upMark.y} 
              x2={portLaylineEndX} 
              y2={portLaylineEndY}
              stroke="#8FA3BF" 
              stroke-width="0.08"
              stroke-opacity="0.6"
              stroke-dasharray="0.5 1.5"
              stroke-linecap="round"
            ></line>
            <!-- Starboard layline: boundary for starboard-tack approach -->
            <line 
              x1={upMark.x} 
              y1={upMark.y} 
              x2={starboardLaylineEndX} 
              y2={starboardLaylineEndY}
              stroke="#8FA3BF" 
              stroke-width="0.08"
              stroke-opacity="0.6"
              stroke-dasharray="0.5 1.5"
              stroke-linecap="round"
            ></line>
          </svg>
          
          <!-- Layline proximity indicators (perpendicular ticks from boats) -->
          {#each $players as player}
            {#if player.finished === false}
              {@const distToMark = Math.sqrt(
                Math.pow(player.x - upMark.x, 2) + Math.pow(player.y - upMark.y, 2)
              )}
              {#if distToMark < 12 && distToMark > 2}
                {@const angleToMark = Math.atan2(upMark.y - player.y, upMark.x - player.x) * 180 / Math.PI}
                {@const windAngle = $currentWind * 2}
                {@const laylineAngle1 = windAngle - 45}
                {@const laylineAngle2 = windAngle + 45}
                {@const angleDiff1 = Math.abs(((angleToMark - laylineAngle1 + 180) % 360) - 180)}
                {@const angleDiff2 = Math.abs(((angleToMark - laylineAngle2 + 180) % 360) - 180)}
                {@const nearLayline = angleDiff1 < 8 || angleDiff2 < 8}
                {#if nearLayline}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 10 10"
                    class="layline-proximity-indicator"
                    style="
                      left: {formatCssPx(player.x * GRID_SIZE)};
                      top: {formatCssPx(player.y * GRID_SIZE)};
                      width: 10px;
                      height: 10px;
                      margin-left: -5px;
                      margin-top: -5px;
                      opacity: {Math.max(0.3, 0.7 - distToMark / 20)};
                      pointer-events: none;
                      z-index: 50;
                    "
                  >
                    <line 
                      x1="5" 
                      y1="5" 
                      x2="5" 
                      y2="0" 
                      stroke={getBoatColorHex(player.color)}
                      stroke-width="0.15"
                      stroke-linecap="round"
                      transform="rotate({angleDiff1 < angleDiff2 ? laylineAngle1 - angleToMark : laylineAngle2 - angleToMark} 5 5)"
                    />
                  </svg>
                {/if}
              {/if}
            {/if}
          {/each}
        {/if}
      
      <!-- Start Line (dotted) -->
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        class="game-start-line"
        viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
      >
        <line 
          id="start-line" 
          stroke-dasharray="0.4 0.6" 
          stroke-width="0.12" 
          stroke="#6B8EC6"
          stroke-linecap="round"
          x1={startMark1 ? startMark1.x : 0}
          y1={startMark1 ? startMark1.y : 0}
          x2={startMark2 ? startMark2.x : 0}
          y2={startMark2 ? startMark2.y : 0}
        />
      </svg>
    </div>
    
    <!-- Wind Indicator Group - positioned outside game-area to avoid transform issues -->
    <div class="wind-indicator-group">
      <!-- Wind Arrow Container (base rotation) -->
      <div
        class="wind-arrow-container"
        style="rotate: {formatCssDeg(windDisplayAngle)};"
      >
        <!-- Wind Arrow (with subtle animation) -->
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 12 32" 
          class="wind-arrow-animated"
        >
          <path d="M 1 14 L 6 22 L 11 14 M 4 2 V 15 M 8 2 V 15" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </div>
      
      <!-- Wind Label -->
      <span class="wind-label">
        {windLabel}
      </span>
    </div>
  </div>
{/if}

<!-- Styles moved to game.css -->
