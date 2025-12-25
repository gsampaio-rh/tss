<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { game, currentWind } from '$lib/stores/game';
  import { settings } from '$lib/stores/settings';
  import { GRID_SIZE } from '$lib/types/game';
  
  interface Particle {
    element: SVGLineElement;
    x: number;
    y: number;
    speed: number;
    lineLength: number;
  }
  
  let particles: Particle[] = [];
  let animationId: number | null = null;
  let svgElement: SVGElement;
  
  function formatCssPx(val: number): string {
    return val.toFixed(3) + 'px';
  }
  
  function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
    return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
  }
  
  function createParticle(randomStart: boolean = true): Particle | null {
    if (!$game) return null;
    
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    particle.setAttribute('class', 'pn-wind-particle');
    
    let startX: number, startY: number;
    if (randomStart) {
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: // Top edge
          startX = Math.random() * $game.width;
          startY = -1;
          break;
        case 1: // Right edge
          startX = $game.width + 1;
          startY = Math.random() * $game.height;
          break;
        case 2: // Bottom edge
          startX = Math.random() * $game.width;
          startY = $game.height + 1;
          break;
        case 3: // Left edge
          startX = -1;
          startY = Math.random() * $game.height;
          break;
        default:
          startX = Math.random() * $game.width;
          startY = Math.random() * $game.height;
      }
    } else {
      startX = Math.random() * $game.width;
      startY = Math.random() * $game.height;
    }
    
    const lineLength = Math.random() * 0.15 + 0.1; // Smaller line segments (0.1-0.25 game units)
    
    // Use game coordinates directly (viewBox handles scaling)
    particle.setAttribute('x1', startX.toFixed(2));
    particle.setAttribute('y1', startY.toFixed(2));
    particle.setAttribute('x2', startX.toFixed(2));
    particle.setAttribute('y2', startY.toFixed(2));
    
    particle.setAttribute('stroke', 'rgba(60, 60, 60, 0.6)');
    particle.setAttribute('stroke-width', '0.08'); // Much thinner stroke
    particle.setAttribute('stroke-linecap', 'round');
    
    if (svgElement) {
      svgElement.appendChild(particle);
    }
    
    return {
      element: particle,
      x: startX,
      y: startY,
      speed: Math.random() * 0.12 + 0.08,
      lineLength
    };
  }
  
  function initParticles() {
    if (!$game || !$settings.showWindIndicators) return;
    
    particles = [];
    if (svgElement) {
      while (svgElement.firstChild) {
        svgElement.removeChild(svgElement.firstChild);
      }
      // Use game coordinates, not pixel coordinates
      svgElement.setAttribute('viewBox', formatSvgViewBox(0, 0, $game.width, $game.height));
    }
    
    const particleCount = 120;
    for (let i = 0; i < particleCount; i++) {
      const p = createParticle(true);
      if (p) particles.push(p);
    }
    
    startAnimation();
  }
  
  function updateParticles() {
    if (!$game || !$settings.showWindIndicators || particles.length === 0) {
      stopAnimation();
      return;
    }
    
    const windDisplayAngle = $currentWind * 2;
    const moveAngleDeg = windDisplayAngle + 180;
    const moveAngleRad = moveAngleDeg * Math.PI / 180;
    
    const dx = Math.sin(moveAngleRad);
    const dy = -Math.cos(moveAngleRad);
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      particle.x += dx * particle.speed;
      particle.y += dy * particle.speed;
      
      // Use game coordinates directly (viewBox handles scaling)
      const x1 = particle.x;
      const y1 = particle.y;
      const x2 = x1 + dx * particle.lineLength;
      const y2 = y1 + dy * particle.lineLength;
      
      particle.element.setAttribute('x1', x1.toFixed(2));
      particle.element.setAttribute('y1', y1.toFixed(2));
      particle.element.setAttribute('x2', x2.toFixed(2));
      particle.element.setAttribute('y2', y2.toFixed(2));
      
      const margin = 5;
      if (particle.x < -margin || particle.x > $game.width + margin ||
          particle.y < -margin || particle.y > $game.height + margin) {
        particle.element.remove();
        particles.splice(i, 1);
        
        const newP = createParticle(true);
        if (newP) particles.push(newP);
      }
    }
    
    while (particles.length < 120) {
      const p = createParticle(true);
      if (p) particles.push(p);
    }
    
    animationId = requestAnimationFrame(updateParticles);
  }
  
  function startAnimation() {
    if (animationId === null) {
      animationId = requestAnimationFrame(updateParticles);
    }
  }
  
  function stopAnimation() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }
  
  $: if ($game && $settings.showWindIndicators) {
    initParticles();
  } else {
    stopAnimation();
    if (svgElement) {
      while (svgElement.firstChild) {
        svgElement.removeChild(svgElement.firstChild);
      }
    }
    particles = [];
  }
  
  $: if ($currentWind !== undefined && particles.length > 0) {
    // Wind changed, particles will update in next frame
  }
  
  onDestroy(() => {
    stopAnimation();
  });
</script>

{#if $game && $settings.showWindIndicators}
  <svg 
    bind:this={svgElement}
    id="wind-indicators" 
    xmlns="http://www.w3.org/2000/svg" 
    class="game-elem" 
    viewBox={formatSvgViewBox(0, 0, $game.width, $game.height)}
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"
  ></svg>
{/if}

<style>
  .pn-wind-particle {
    pointer-events: none;
    z-index: 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
</style>
