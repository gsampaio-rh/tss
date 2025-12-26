<script lang="ts">
  import type { Boat } from '$lib/types/boat';
  import { GRID_SIZE, getBoatColorHex } from '$lib/types/game';
  
  export let boat: Boat;
  export let playerIndex: number = 0;
  
  import { currentWind, isStart, game, gameActions, players } from '$lib/stores/game';
  import { onMount, onDestroy } from 'svelte';
  
  let boatElement: HTMLDivElement;
  let hovered = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialBoatX = 0;
  let initialBoatY = 0;
  
  function handleMouseEnter() {
    hovered = true;
    document.body.setAttribute('data-hover-player', playerIndex.toString());
  }
  
  function handleMouseLeave() {
    hovered = false;
    document.body.removeAttribute('data-hover-player');
  }
  
  function handleClick() {
    // Don't focus if we're in start phase and might be dragging
    if ($isStart && isDragging) {
      return;
    }
    
    const currentFocused = document.body.getAttribute('data-focused-player');
    if (currentFocused === playerIndex.toString()) {
      document.body.removeAttribute('data-focused-player');
    } else {
      document.body.setAttribute('data-focused-player', playerIndex.toString());
    }
  }
  
  function handleMouseDown(e: MouseEvent) {
    if (!$isStart) return;
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialBoatX = boat.x;
    initialBoatY = boat.y;
    
    // Add global listeners
    if (typeof document !== 'undefined') {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    e.preventDefault();
    e.stopPropagation();
  }
  
  function handleMouseMove(e: MouseEvent) {
    if (!$isStart || !isDragging) return;
    
    const gameHeight = $game?.height || 0;
    const startMark1 = $game?.marks[0];
    const startMark2 = $game?.marks[1];
    
    if (!startMark1 || !startMark2) return;
    
    // Calculate delta in game units
    const deltaX = (e.clientX - dragStartX) / GRID_SIZE;
    
    // Calculate new position
    let newX = initialBoatX + deltaX;
    
    // Constrain X to be between the start marks (with some margin)
    const minX = Math.min(startMark1.x, startMark2.x) + 0.5;
    const maxX = Math.max(startMark1.x, startMark2.x) - 0.5;
    newX = Math.max(minX, Math.min(maxX, newX));
    
    // Keep Y on the start line (height - 2)
    const startLineY = gameHeight - 2;
    
    // Update boat position
    boat.x = newX;
    boat.y = startLineY;
  }
  
  function handleMouseUp(e: MouseEvent) {
    if (!$isStart || !isDragging) return;
    
    isDragging = false;
    
    // Remove global listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    // Save custom position
    if ($game) {
      gameActions.updateStartPosition(playerIndex, boat.x);
    }
  }
  
  onDestroy(() => {
    // Cleanup listeners on destroy
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  });
  
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
  
  // Reactive statements to ensure component updates when boat properties change
  // Watch the players store to force reactivity when boats move
  $: currentBoat = $players?.[playerIndex];
  $: boatX = currentBoat?.x ?? boat?.x ?? 0;
  $: boatY = currentBoat?.y ?? boat?.y ?? 0;
  $: boatRotation = currentBoat?.rotation ?? boat?.rotation ?? 0;
  
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
          left: {formatCssPx(boatX * GRID_SIZE)};
          top: {formatCssPx(boatY * GRID_SIZE)};
          rotate: {formatCssDeg(boatRotation)};
    transform: scaleX({sx});
    color: {getBoatColorHex(boat.color)};
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(255,255,255,0.5));
    cursor: {$isStart ? 'grab' : 'pointer'};
  "
  class:dragging={isDragging}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:mousedown={handleMouseDown}
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
  
  .pn-boat.dragging {
    cursor: grabbing !important;
    z-index: 102;
    transition: none;
  }
  
  :global(body:not(.start)) .pn-boat.dragging {
    cursor: pointer !important;
  }
  
</style>
