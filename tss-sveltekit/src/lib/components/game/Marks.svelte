<script lang="ts">
  import type { Mark } from '$lib/types/game';
  import { GRID_SIZE } from '$lib/types/game';
  
  export let marks: Mark[] = [];
  
  function formatCssPx(val: number): string {
    return val.toFixed(3) + 'px';
  }
  
  // Mark labels
  const markLabels = ['Pin', 'Boat', 'Windward'];
  
  let hoveredMarkIndex: number | null = null;
  
  function handleMarkHover(index: number) {
    hoveredMarkIndex = index;
  }
  
  function handleMarkLeave() {
    hoveredMarkIndex = null;
  }
  
  function handleMarkClick() {
    // Could add click functionality here
  }
</script>

{#each marks as mark, i}
  <div 
    class="game-elem pn-mark mark-{i}"
    class:hovered={hoveredMarkIndex === i}
    style="left: {formatCssPx(mark.x * GRID_SIZE)}; top: {formatCssPx(mark.y * GRID_SIZE)};"
    on:mouseenter={() => handleMarkHover(i)}
    on:mouseleave={handleMarkLeave}
    on:click={handleMarkClick}
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMarkClick()}
    role="button"
    tabindex="0"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" style="width: 36px; height: 36px;">
      <!-- Outer halo (hit target / visibility) -->
      <circle 
        cx="18" 
        cy="18" 
        r="16" 
        fill="rgba(0, 0, 0, 0.15)" 
        class="mark-halo"
      />
      
      {#if i === 2}
        <!-- Up mark (dashed ring) -->
        <circle 
          cx="18" 
          cy="18" 
          r="12" 
          fill="none" 
          stroke="rgba(0, 0, 0, 0.45)" 
          stroke-width="2" 
          stroke-dasharray="2 2"
          class="mark-ring"
        />
        <circle 
          cx="18" 
          cy="18" 
          r="2.5" 
          fill="#6d2121"
          class="mark-center"
        />
      {:else}
        <!-- Regular mark (solid ring) -->
        <circle 
          cx="18" 
          cy="18" 
          r="12" 
          fill="none" 
          stroke="rgba(0, 0, 0, 0.45)" 
          stroke-width="2"
          class="mark-ring"
        />
        <circle 
          cx="18" 
          cy="18" 
          r="3" 
          fill="#6d2121"
          class="mark-center"
        />
      {/if}
    </svg>
    
    <!-- Label (only for up mark or when helpful) -->
    {#if i === 2}
      <div class="mark-label">
        {markLabels[i]}
      </div>
    {/if}
  </div>
{/each}

<style>
  .pn-mark {
    --mark-scale: 1;
    width: 36px;
    height: 36px;
    margin-left: -18px;
    margin-top: -18px;
    position: absolute;
    cursor: pointer;
    z-index: 90;
    transition: transform 0.2s, filter 0.2s;
  }
  
  .pn-mark:hover,
  .pn-mark.hovered {
    transform: scale(1.15);
    z-index: 91;
    animation: markPulse 1.5s ease-in-out infinite;
  }
  
  .pn-mark:hover .mark-halo,
  .pn-mark.hovered .mark-halo {
    fill: rgba(0, 0, 0, 0.25);
  }
  
  .pn-mark:hover .mark-ring,
  .pn-mark.hovered .mark-ring {
    stroke: rgba(0, 0, 0, 0.6);
    stroke-width: 2.5;
  }
  
  @keyframes markPulse {
    0%, 100% {
      transform: scale(1.15);
    }
    50% {
      transform: scale(1.2);
    }
  }
  
  .mark-label {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    pointer-events: none;
  }
  
  .mark-halo {
    transition: fill 0.2s;
  }
  
  .mark-ring {
    transition: stroke 0.2s, stroke-width 0.2s;
  }
</style>
