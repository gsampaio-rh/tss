<script lang="ts">
  import type { Boat } from '$lib/types/boat';
  import { GRID_SIZE } from '$lib/types/game';
  
  export let boat: Boat;
  export let playerIndex: number = 0;
  
  import { currentWind } from '$lib/stores/game';
  
  let boatElement: HTMLDivElement;
  let hovered = false;
  
  function handleMouseEnter() {
    hovered = true;
    document.body.setAttribute('data-hover-player', playerIndex.toString());
  }
  
  function handleMouseLeave() {
    hovered = false;
    document.body.removeAttribute('data-hover-player');
  }
  
  function handleClick() {
    const currentFocused = document.body.getAttribute('data-focused-player');
    if (currentFocused === playerIndex.toString()) {
      document.body.removeAttribute('data-focused-player');
    } else {
      document.body.setAttribute('data-focused-player', playerIndex.toString());
    }
  }
  
  // Calculate wind angle arc for hover visualization
  $: windAngle = $currentWind * 2;
  $: boatHeading = boat.rotation;
  $: relativeAngle = ((boatHeading - windAngle + 180) % 360) - 180;
  
  // Calculate arc path for wind angle visualization
  function getArcPath(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): string {
    const startRad = startAngle * Math.PI / 180;
    const endRad = endAngle * Math.PI / 180;
    const startX = centerX + radius * Math.sin(startRad);
    const startY = centerY - radius * Math.cos(startRad);
    const endX = centerX + radius * Math.sin(endRad);
    const endY = centerY - radius * Math.cos(endRad);
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  }
  
  function formatCssPx(val: number): string {
    return val.toFixed(3) + 'px';
  }
  
  function formatCssDeg(val: number): string {
    return val.toFixed(3) + 'deg';
  }
  
  $: sx = boat.tack ? 1 : -1;
  $: boatSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -10 14 20" class="boat-full-svg">
      <path d="M -4 7.5 L 4 7.5 C 5 1.5 5 -2.5 2.5 -9 L -2.5 -9 C -5 -2.5 -5 1.5 -4 7.5 Z" stroke="gray" stroke-width=".5" fill="currentColor" />
      <path d="M 0 -6 C 2 -4 3 -1 2 6" stroke="white" fill="none" stroke-width="1" />
      <ellipse rx="0.7" ry="0.7" cx="0" cy="-6" />
    </svg>
  `;
  
</script>

<div 
  bind:this={boatElement}
  class="game-elem pn-boat"
  class:hovered={hovered}
  data-player-index={playerIndex.toString()}
  role="button"
  tabindex="0"
  style="
    left: {formatCssPx(boat.x * GRID_SIZE)};
    top: {formatCssPx(boat.y * GRID_SIZE)};
    rotate: {formatCssDeg(boat.rotation)};
    transform: scaleX({sx});
    color: {boat.color};
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(255,255,255,0.5));
    cursor: pointer;
  "
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? handleClick() : null}
>
  {@html boatSvg}
  
  <!-- Wind Angle Arc (shown on hover) -->
  {#if hovered}
    <svg 
      class="wind-angle-indicator"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      style="
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        pointer-events: none;
        z-index: 102;
      "
    >
      <!-- Wind direction line -->
      <line 
        x1="50" 
        y1="50" 
        x2="50" 
        y2="10"
        stroke="#666"
        stroke-width="1"
        stroke-dasharray="2 2"
        opacity="0.5"
        transform="rotate({windAngle} 50 50)"
      />
      <!-- Boat heading line -->
      <line 
        x1="50" 
        y1="50" 
        x2="50" 
        y2="10"
        stroke={boat.color}
        stroke-width="2"
        opacity="0.8"
        transform="rotate({boatHeading} 50 50)"
      />
      <!-- Angle arc (simplified) -->
      {#if Math.abs(relativeAngle) > 2}
        <path 
          d={getArcPath(50, 50, 40, 0, relativeAngle)}
          fill={relativeAngle > 0 ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)'}
          stroke={relativeAngle > 0 ? '#28a745' : '#dc3545'}
          stroke-width="1"
          opacity="0.6"
          transform="rotate({windAngle} 50 50)"
        />
      {/if}
    </svg>
  {/if}
</div>

<style>
  .pn-boat {
    width: calc(14px * var(--boat-scale, 1.4));
    height: calc(20px * var(--boat-scale, 1.4));
    margin-left: calc(-7px * var(--boat-scale, 1.4));
    margin-top: calc(-10px * var(--boat-scale, 1.4));
    transform-origin: center;
    position: absolute;
    transition: top 0.5s ease-in-out, left 0.5s ease-in-out, rotate 0.2s ease-in-out;
    z-index: 100;
  }
  
  .pn-boat:hover {
    filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4)) drop-shadow(0 0 12px rgba(255,255,255,0.7));
    transform: scale(1.1);
  }
  
</style>
