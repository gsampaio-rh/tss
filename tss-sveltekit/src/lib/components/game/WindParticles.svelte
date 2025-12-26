<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { game, currentWind } from '$lib/stores/game';
  import { settings } from '$lib/stores/settings';
  
  interface Particle {
    element: SVGPathElement;
    x: number;
    y: number;
    vx: number; // Velocity x
    vy: number; // Velocity y
    age: number;
    maxAge: number;
    opacity: number;
    size: number;
    speed: number; // Base speed multiplier
    dropLength: number; // Length of the teardrop
    dropWidth: number; // Width at the head
  }
  
  let particles: Particle[] = [];
  let animationId: number | null = null;
  let svgElement: SVGElement;
  let defsElement: SVGDefsElement | null = null;
  let lastTime = 0;
  let gradientIdCounter = 0;
  
  function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
    return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
  }
  
  // Create teardrop/droplet shape path - elegant and simple
  function createTeardropPath(x: number, y: number, angle: number, length: number, width: number): string {
    // Head center (rounded front) - 70% along the length
    const headX = x + Math.cos(angle) * length * 0.7;
    const headY = y + Math.sin(angle) * length * 0.7;
    const headRadius = width * 0.5;
    
    // Tail point (sharp end) - 30% behind center
    const tailX = x - Math.cos(angle) * length * 0.3;
    const tailY = y - Math.sin(angle) * length * 0.3;
    
    // Perpendicular direction for width
    const perpAngle = angle + Math.PI / 2;
    
    // Create smooth teardrop using quadratic curves
    // Start from tail (point)
    let pathData = `M ${tailX.toFixed(2)} ${tailY.toFixed(2)}`;
    
    // Left side: smooth curve from tail to head
    const numPoints = 8;
    for (let i = 1; i <= numPoints; i++) {
      const t = i / numPoints;
      // Smooth easing for natural taper
      const easeT = t * t * (3 - 2 * t); // Smoothstep
      
      // Position along the length
      const posX = tailX + (headX - tailX) * easeT;
      const posY = tailY + (headY - tailY) * easeT;
      
      // Width tapers smoothly from head to tail
      const currentWidth = headRadius * (1 - easeT * 0.99);
      
      // Perpendicular offset
      const offsetX = Math.cos(perpAngle) * currentWidth;
      const offsetY = Math.sin(perpAngle) * currentWidth;
      
      if (i === 1) {
        pathData += ` L ${(posX + offsetX).toFixed(2)} ${(posY + offsetY).toFixed(2)}`;
      } else {
        // Use quadratic curve for smoothness
        const prevT = (i - 1) / numPoints;
        const prevEaseT = prevT * prevT * (3 - 2 * prevT);
        const prevPosX = tailX + (headX - tailX) * prevEaseT;
        const prevPosY = tailY + (headY - tailY) * prevEaseT;
        const prevWidth = headRadius * (1 - prevEaseT * 0.99);
        const prevOffsetX = Math.cos(perpAngle) * prevWidth;
        const prevOffsetY = Math.sin(perpAngle) * prevWidth;
        
        const controlX = (prevPosX + prevOffsetX + posX + offsetX) / 2;
        const controlY = (prevPosY + prevOffsetY + posY + offsetY) / 2;
        pathData += ` Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${(posX + offsetX).toFixed(2)} ${(posY + offsetY).toFixed(2)}`;
      }
    }
    
    // Rounded head (semi-circle) - 6 points for smooth arc
    const headPoints = 6;
    for (let i = 0; i <= headPoints; i++) {
      const headAngle = angle + Math.PI / 2 + (i / headPoints) * Math.PI;
      const headPointX = headX + Math.cos(headAngle) * headRadius;
      const headPointY = headY + Math.sin(headAngle) * headRadius;
      
      if (i === 0) {
        pathData += ` L ${headPointX.toFixed(2)} ${headPointY.toFixed(2)}`;
      } else {
        // Smooth arc using quadratic curves
        pathData += ` Q ${headX.toFixed(2)} ${headY.toFixed(2)} ${headPointX.toFixed(2)} ${headPointY.toFixed(2)}`;
      }
    }
    
    // Right side (mirror of left) - back to tail
    for (let i = numPoints - 1; i >= 0; i--) {
      const t = i / numPoints;
      const easeT = t * t * (3 - 2 * t);
      
      const posX = tailX + (headX - tailX) * easeT;
      const posY = tailY + (headY - tailY) * easeT;
      const currentWidth = headRadius * (1 - easeT * 0.99);
      
      const offsetX = Math.cos(perpAngle) * currentWidth;
      const offsetY = Math.sin(perpAngle) * currentWidth;
      
      if (i === numPoints - 1) {
        pathData += ` L ${(posX - offsetX).toFixed(2)} ${(posY - offsetY).toFixed(2)}`;
      } else {
        const prevT = (i + 1) / numPoints;
        const prevEaseT = prevT * prevT * (3 - 2 * prevT);
        const prevPosX = tailX + (headX - tailX) * prevEaseT;
        const prevPosY = tailY + (headY - tailY) * prevEaseT;
        const prevWidth = headRadius * (1 - prevEaseT * 0.99);
        const prevOffsetX = Math.cos(perpAngle) * prevWidth;
        const prevOffsetY = Math.sin(perpAngle) * prevWidth;
        
        const controlX = (prevPosX - prevOffsetX + posX - offsetX) / 2;
        const controlY = (prevPosY - prevOffsetY + posY - offsetY) / 2;
        pathData += ` Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${(posX - offsetX).toFixed(2)} ${(posY - offsetY).toFixed(2)}`;
      }
    }
    
    pathData += ` Z`;
    return pathData;
  }
  
  // Create gradient for teardrop (bright at head, darker at tail)
  function createGradient(svg: SVGElement, id: string, opacity: number): SVGLinearGradientElement {
    if (!defsElement) {
      defsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defsElement, svg.firstChild);
    }
    
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', id);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '0%');
    
    // Bright white/light blue at head (0%)
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', `hsla(200, 70%, 90%, ${opacity})`);
    gradient.appendChild(stop1);
    
    // Light blue in middle (40%)
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '40%');
    stop2.setAttribute('stop-color', `hsla(205, 65%, 75%, ${opacity * 0.95})`);
    gradient.appendChild(stop2);
    
    // Medium blue (70%)
    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop3.setAttribute('offset', '70%');
    stop3.setAttribute('stop-color', `hsla(210, 55%, 60%, ${opacity * 0.8})`);
    gradient.appendChild(stop3);
    
    // Darker blue at tail (100%)
    const stop4 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop4.setAttribute('offset', '100%');
    stop4.setAttribute('stop-color', `hsla(215, 45%, 50%, ${opacity * 0.5})`);
    gradient.appendChild(stop4);
    
    defsElement.appendChild(gradient);
    return gradient;
  }
  
  // Get wind vector at a given position (simplified - assumes uniform wind for now)
  function getWindVector(x: number, y: number): { vx: number; vy: number; magnitude: number } {
    if (!$game) return { vx: 0, vy: 0, magnitude: 0 };
    
    const windDisplayAngle = $currentWind * 2;
    const moveAngleDeg = windDisplayAngle + 180; // Wind flows in opposite direction
    const moveAngleRad = moveAngleDeg * Math.PI / 180;
    
    // Base wind magnitude (can be varied based on position for turbulence)
    const baseMagnitude = 1.0;
    
    // Add slight turbulence based on position
    const turbulence = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.1;
    const magnitude = baseMagnitude + turbulence;
    
    const vx = Math.sin(moveAngleRad) * magnitude;
    const vy = -Math.cos(moveAngleRad) * magnitude;
    
    return { vx, vy, magnitude: Math.abs(magnitude) };
  }
  
  function createParticle(): Particle | null {
    if (!$game || !svgElement) return null;
    
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    particle.setAttribute('class', 'pn-wind-particle');
    
    // Spawn from edges with some randomness
    const edge = Math.floor(Math.random() * 4);
    let startX: number, startY: number;
    
    switch (edge) {
      case 0: // Top
        startX = Math.random() * $game.width;
        startY = -2;
        break;
      case 1: // Right
        startX = $game.width + 2;
        startY = Math.random() * $game.height;
        break;
      case 2: // Bottom
        startX = Math.random() * $game.width;
        startY = $game.height + 2;
        break;
      case 3: // Left
        startX = -2;
        startY = Math.random() * $game.height;
        break;
      default:
        startX = Math.random() * $game.width;
        startY = Math.random() * $game.height;
    }
    
    // Get initial wind vector
    const wind = getWindVector(startX, startY);
    const angle = Math.atan2(wind.vy, wind.vx);
    
    // Particle properties with variation
    const speedMultiplier = 0.08 + Math.random() * 0.12; // 0.08-0.20
    const maxAge = 150 + Math.random() * 150; // 150-300 frames
    const baseOpacity = 0.5 + Math.random() * 0.3; // 0.5-0.8
    const size = 0.8 + Math.random() * 0.6; // 0.8-1.4
    
    // Teardrop dimensions - bigger
    const dropLength = 0.35 + Math.random() * 0.25; // 0.35-0.60 (bigger)
    const dropWidth = 0.12 + Math.random() * 0.08; // 0.12-0.20 (bigger)
    
    // Create teardrop path - rotated 180 degrees (angle + PI)
    const pathData = createTeardropPath(startX, startY, angle + Math.PI, dropLength * size, dropWidth * size);
    particle.setAttribute('d', pathData);
    
    // Create gradient
    const gradientId = `windDrop${gradientIdCounter++}`;
    createGradient(svgElement, gradientId, baseOpacity);
    
    particle.setAttribute('fill', `url(#${gradientId})`);
    particle.setAttribute('stroke', 'none');
    particle.setAttribute('data-gradient-id', gradientId);
    particle.setAttribute('data-opacity', baseOpacity.toFixed(3));
    
    if (svgElement) {
      svgElement.appendChild(particle);
    }
    
    return {
      element: particle,
      x: startX,
      y: startY,
      vx: wind.vx * speedMultiplier,
      vy: wind.vy * speedMultiplier,
      age: 0,
      maxAge,
      opacity: baseOpacity,
      size,
      speed: speedMultiplier,
      dropLength: dropLength * size,
      dropWidth: dropWidth * size
    };
  }
  
  function updateParticleShape(particle: Particle) {
    // Calculate angle from velocity - rotated 180 degrees
    const angle = Math.atan2(particle.vy, particle.vx) + Math.PI;
    
    // Update teardrop path
    const pathData = createTeardropPath(particle.x, particle.y, angle, particle.dropLength, particle.dropWidth);
    particle.element.setAttribute('d', pathData);
    
    // Update opacity based on age
    const ageOpacity = particle.age < 10 
      ? particle.age / 10  // Fade in
      : particle.age > particle.maxAge - 20
      ? (particle.maxAge - particle.age) / 20  // Fade out
      : 1;
    
    const finalOpacity = particle.opacity * ageOpacity;
    
    // Update gradient opacity
    const gradientId = particle.element.getAttribute('data-gradient-id');
    if (gradientId && defsElement) {
      const gradient = defsElement.querySelector(`#${gradientId}`) as SVGLinearGradientElement;
      if (gradient) {
        const stops = gradient.querySelectorAll('stop');
        stops[0]?.setAttribute('stop-color', `hsla(200, 70%, 90%, ${finalOpacity})`);
        stops[1]?.setAttribute('stop-color', `hsla(205, 65%, 75%, ${finalOpacity * 0.95})`);
        stops[2]?.setAttribute('stop-color', `hsla(210, 55%, 60%, ${finalOpacity * 0.8})`);
        stops[3]?.setAttribute('stop-color', `hsla(215, 45%, 50%, ${finalOpacity * 0.5})`);
      }
    }
  }
  
  function initParticles() {
    if (!$game || !$settings.showWindIndicators) return;
    
    particles = [];
    if (svgElement) {
      while (svgElement.firstChild) {
        svgElement.removeChild(svgElement.firstChild);
      }
      svgElement.setAttribute('viewBox', formatSvgViewBox(0, 0, $game.width, $game.height));
      defsElement = null; // Reset defs
      gradientIdCounter = 0;
    }
    
    // Spawn initial particles - density based on wind magnitude
    const wind = getWindVector($game.width / 2, $game.height / 2);
    const baseDensity = 300; // Base particle count
    const densityMultiplier = 0.8 + wind.magnitude * 0.4; // Scale by wind strength
    const particleCount = Math.floor(baseDensity * densityMultiplier);
    
    for (let i = 0; i < particleCount; i++) {
      const p = createParticle();
      if (p) particles.push(p);
    }
    
    lastTime = performance.now();
    startAnimation();
  }
  
  function updateParticles(currentTime: number) {
    if (!$game || !$settings.showWindIndicators || particles.length === 0) {
      stopAnimation();
      return;
    }
    
    const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2.0); // Cap at 2x normal speed
    lastTime = currentTime;
    
    // Get wind at center for density calculation
    const centerWind = getWindVector($game.width / 2, $game.height / 2);
    const targetDensity = Math.floor(300 * (0.8 + centerWind.magnitude * 0.4));
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      particle.age++;
      
      // Get wind vector at current position (for turbulence)
      const wind = getWindVector(particle.x, particle.y);
      
      // Update velocity based on wind field (smooth interpolation)
      const smoothing = 0.1; // How quickly velocity adapts to wind
      particle.vx += (wind.vx * particle.speed - particle.vx) * smoothing;
      particle.vy += (wind.vy * particle.speed - particle.vy) * smoothing;
      
      // Update position using velocity (Euler integration)
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // Update teardrop shape
      updateParticleShape(particle);
      
      // Remove particles that are too old or left the screen
      const margin = 10;
      const shouldRemove = particle.age >= particle.maxAge ||
        particle.x < -margin || particle.x > $game.width + margin ||
        particle.y < -margin || particle.y > $game.height + margin;
      
      if (shouldRemove) {
        particle.element.remove();
        particles.splice(i, 1);
      }
    }
    
    // Spawn new particles to maintain density
    while (particles.length < targetDensity) {
      const p = createParticle();
      if (p) particles.push(p);
    }
    
    // Remove excess particles if density decreased
    while (particles.length > targetDensity * 1.2) {
      const oldest = particles.reduce((oldest, p, idx) => 
        p.age > oldest.age ? { p, age: p.age, idx } : oldest,
        { p: particles[0], age: particles[0].age, idx: 0 }
      );
      oldest.p.element.remove();
      particles.splice(oldest.idx, 1);
    }
    
    animationId = requestAnimationFrame(updateParticles);
  }
  
  function startAnimation() {
    if (animationId === null) {
      lastTime = performance.now();
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
    // Wind changed - particles will adapt naturally in next frame
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
    shape-rendering: geometricPrecision;
  }
  
  svg#wind-indicators {
    will-change: contents;
  }
</style>
