<script lang="ts">
  import type { Boat } from '$lib/types/boat';
  import { GRID_SIZE, getBoatColorHex } from '$lib/types/game';
  
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
    color: {getBoatColorHex(boat.color)};
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(255,255,255,0.5));
    cursor: pointer;
  "
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? handleClick() : null}
>
  {@html boatSvg}
  
  <!-- Wind Angle Arc removed - now using WindZones component instead -->
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
