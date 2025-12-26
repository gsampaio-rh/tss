<script lang="ts">
  import { game, players, marks, gameWidth, gameHeight, currentWind, turnCount } from '$lib/stores/game';
  import { settings } from '$lib/stores/settings';
  import { GRID_SIZE } from '$lib/types/game';
  import Boat from './Boat.svelte';
  import Marks from './Marks.svelte';
  import WindParticles from './WindParticles.svelte';
  import ScaleIndicator from './ScaleIndicator.svelte';
  import GridLabels from './GridLabels.svelte';
  import GridLines from './GridLines.svelte';
  import { onMount, afterUpdate } from 'svelte';
  
  let gameArea: HTMLDivElement;
  let gameCont: HTMLDivElement;
  let lastGameWidth = 0;
  let lastGameHeight = 0;
  
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
    
    let scale: number;
    let left = 0;
    let top = 0;
    
    // Use 95% of available space to ensure map stays within bounds
    // Leave some padding to prevent overflow into sidebars
    const padding = Math.min(w * 0.025, h * 0.025); // 2.5% padding on each side
    const targetWidth = w - (padding * 2);
    const targetHeight = h - (padding * 2);
    
    const gameWidthPx = $game.width * GRID_SIZE;
    const gameHeightPx = $game.height * GRID_SIZE;
    
    // Calculate scale to fit within bounds while maintaining aspect ratio
    const scaleX = targetWidth / gameWidthPx;
    const scaleY = targetHeight / gameHeightPx;
    
    // Use the smaller scale to maintain aspect ratio and ensure it fits
    scale = Math.min(scaleX, scaleY);
    
    // Center the game area within the container
    const scaledWidth = gameWidthPx * scale;
    const scaledHeight = gameHeightPx * scale;
    left = (w - scaledWidth) / 2;
    top = (h - scaledHeight) / 2;
    
    // Ensure position is never negative (prevents overflow)
    left = Math.max(0, left);
    top = Math.max(0, top);
    
    gameArea.style.left = formatCssPx(left);
    gameArea.style.top = formatCssPx(top);
    gameArea.style.scale = scale.toString();
    gameArea.style.height = formatCssPx($game.height * GRID_SIZE);
    gameArea.style.width = formatCssPx($game.width * GRID_SIZE);
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
  <div bind:this={gameCont} id="game-cont" class="position-absolute" style="top: 0; left: 0; right: 0; bottom: 0; overflow: hidden;">
    <div 
      bind:this={gameArea}
      id="game-area" 
      style="position: absolute; overflow: hidden;"
      data-show-boats={$settings.showBoats ? 'full' : 'dot'}
    >
      <!-- Background -->
      <svg 
        viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)} 
        id="background" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #ebeaff;"
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
          id="track" 
          xmlns="http://www.w3.org/2000/svg" 
          class="game-elem svg-round-line" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
        >
          {#each $players as player, playerIndex}
            {@const isCurrentPlayer = playerIndex === 0}
            {@const trackOpacity = isCurrentPlayer ? 0.9 : 0.5}
            {@const trackWidth = isCurrentPlayer ? 0.08 : 0.05}
            <polyline 
              class="player-track"
              data-player-index={playerIndex.toString()}
              points={getTrackPoints(player)}
              stroke={player.color}
              fill="none"
              stroke-width={trackWidth}
              opacity={trackOpacity}
            />
          {/each}
        </svg>
      {/if}
      
      <!-- Marks -->
      <Marks marks={$marks} />
      
      <!-- Boats -->
      {#if $settings.showBoats}
        {#each $players as player, playerIndex}
          <Boat boat={player} playerIndex={playerIndex} />
        {/each}
      {/if}
      
      <!-- Wind Particles -->
      <WindParticles />
      
      <!-- Equal Lines -->
      {#if $settings.showEqualLines}
        <div id="lines-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; rotate: {formatCssDeg(windDisplayAngle)};">
          <svg 
            id="lines-svg" 
            stroke="gray" 
            class="w-100 h-100" 
            xmlns="http://www.w3.org/2000/svg"
            stroke-width="0.003"
            opacity="0.15"
            viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
          >
            <g id="lines-drawing">
              {#each Array($game.height * 2) as _, i}
                <line 
                  x1="0" 
                  x2={$game.width} 
                  y1={i / 2} 
                  y2={i / 2}
                />
              {/each}
            </g>
          </svg>
        </div>
      {/if}
      
        <!-- Laylines (from up mark) - Decision-defining elements -->
        {#if $settings.showLanelines && upMark}
          {@const laylineOpacity = (() => {
            // Calculate relevance based on closest boat distance to laylines
            if ($players.length === 0) return 0.4;
            let minDistance = Infinity;
            for (const player of $players) {
              if (player.finished !== false) continue;
              // Distance from boat to windward mark
              const distToMark = Math.sqrt(
                Math.pow(player.x - upMark.x, 2) + Math.pow(player.y - upMark.y, 2)
              );
              if (distToMark < minDistance) minDistance = distToMark;
            }
            // Fade if far (> 15 units), strengthen if close (< 8 units)
            if (minDistance > 15) return 0.25;
            if (minDistance < 8) return 0.6;
            return 0.4;
          })()}
          <!-- Laylines SVG - extends from windward mark across full field -->
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
            class="pn-lines game-elem laylines" 
            id="upmarklines"
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              opacity: {laylineOpacity};
              z-index: 15;
            "
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
              stroke="#444" 
              stroke-width="0.08"
              stroke-dasharray="0.5 1.5"
              stroke-linecap="round"
            ></line>
            <!-- Starboard layline: boundary for starboard-tack approach -->
            <line 
              x1={upMark.x} 
              y1={upMark.y} 
              x2={starboardLaylineEndX} 
              y2={starboardLaylineEndY}
              stroke="#444" 
              stroke-width="0.08"
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
                      stroke={player.color}
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
        id="start-line-svg"
        viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 25;"
      >
        <line 
          id="start-line" 
          stroke-dasharray="0.4 0.6" 
          stroke-width="0.12" 
          stroke="#555"
          opacity="0.7"
          stroke-linecap="round"
          x1={startMark1 ? startMark1.x : 0}
          y1={startMark1 ? startMark1.y : 0}
          x2={startMark2 ? startMark2.x : 0}
          y2={startMark2 ? startMark2.y : 0}
        />
      </svg>
    </div>
    
    <!-- Wind Indicator Group -->
    <div 
      class="wind-indicator-group"
      style="
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.95);
        padding: 8px 12px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 100;
      "
    >
      <!-- Wind Arrow Container (base rotation) -->
      <div
        class="wind-arrow-container"
        style="
          rotate: {formatCssDeg(windDisplayAngle)};
          width: 24px;
          height: 32px;
          flex-shrink: 0;
        "
      >
        <!-- Wind Arrow (with subtle animation) -->
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 12 32" 
          id="wind"
          class="wind-arrow-animated"
          style="
            width: 24px;
            height: 32px;
          "
        >
          <path d="M 1 14 L 6 22 L 11 14 M 4 2 V 15 M 8 2 V 15" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </div>
      
      <!-- Wind Label -->
      <span 
        id="wind-label"
        style="
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        "
      >
        {windLabel}
      </span>
    </div>
  </div>
{/if}

<style>
  .game-elem {
    position: absolute;
  }
  
  .svg-round-line {
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  #game-area {
    --boat-scale: 1.6; /* Increased from 1.4 to make boats more visible */
  }
  
  /* Wind arrow container handles base rotation */
  .wind-arrow-container {
    transform-origin: center bottom;
  }
  
  /* Wind arrow subtle animation - adds gentle pendulum movement */
  .wind-arrow-animated {
    animation: windPulse 3s ease-in-out infinite;
    transform-origin: center bottom;
    display: block;
  }
  
  @keyframes windPulse {
    0%, 100% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(2deg);
    }
  }
  
  /* Make wind indicator feel alive */
  .wind-indicator-group {
    transition: box-shadow 0.3s ease;
  }
  
  .wind-indicator-group:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  
  /* Focus/highlight effects */
  :global(body[data-focused-player]) .pn-boat:not([data-player-index]) {
    opacity: 0.3;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)) !important;
  }
  
  :global(body[data-focused-player]) .player-track:not([data-player-index]) {
    opacity: 0.2;
  }
  
  :global(body[data-hover-player]) .pn-boat:not([data-player-index]) {
    opacity: 0.5;
  }
  
  :global(body[data-hover-player]) .player-track:not([data-player-index]) {
    opacity: 0.3;
  }
  
  :global(body[data-focused-player]) .pn-boat[data-player-index],
  :global(body[data-hover-player]) .pn-boat[data-player-index] {
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)) drop-shadow(0 0 16px rgba(255,255,255,0.8)) !important;
    z-index: 101;
  }
  
  :global(body[data-focused-player]) .player-track[data-player-index],
  :global(body[data-hover-player]) .player-track[data-player-index] {
    opacity: 1 !important;
    stroke-width: 0.12 !important;
  }
  
  /* Start line animation on race start */
  :global(body:not(.start)) .start-line-svg .start-line {
    animation: startLinePulse 0.8s ease-out;
  }
  
  @keyframes startLinePulse {
    0% {
      stroke-width: 0.12;
      opacity: 0.7;
    }
    50% {
      stroke-width: 0.2;
      opacity: 1;
    }
    100% {
      stroke-width: 0.12;
      opacity: 0.7;
    }
  }
  
  /* Boat hover enhancement */
  .pn-boat.hovered {
    animation: boatHoverPulse 1.5s ease-in-out infinite;
  }
  
  @keyframes boatHoverPulse {
    0%, 100% {
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(255,255,255,0.5));
    }
    50% {
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)) drop-shadow(0 0 16px rgba(255,255,255,0.8));
    }
  }
  
  /* Laylines - unique visual language, distinct from grid */
  .laylines {
    z-index: 15;
  }
  
  .laylines line {
    /* Thicker, darker, dashed - decision-defining, not reference geometry */
    filter: drop-shadow(0 0 1px rgba(0,0,0,0.2));
  }
  
  .layline-proximity-indicator {
    position: absolute;
    transition: opacity 0.3s ease;
  }
</style>
