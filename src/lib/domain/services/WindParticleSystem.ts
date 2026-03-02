/**
 * Wind Particle System
 * 
 * Manages the lifecycle and physics of wind particles for visualization.
 * Uses streaks with transforms, shared gradients, depth layering, streamlines, and gusts.
 */

import { createUnitStreakPath, createSharedGradients } from '$lib/utils/windParticleUtils';
import { calculateApparentWind, calculateDisturbedWind } from '$lib/utils/apparentWind';
import { BoatMovementService } from './BoatMovementService';
import { Angle } from '../value-objects/Angle';

export interface Particle {
	element: SVGPathElement;
	x: number;
	y: number;
	vx: number; // Velocity x
	vy: number; // Velocity y
	age: number;
	maxAge: number;
	opacity: number;
	size: number;
	speed: number; // Base speed multiplier (stored, not modified)
	baseSpeed: number; // Original speed multiplier (for dirty air calculations)
	streakLength: number; // Length of the streak
	streakWidth: number; // Width at the head
	isNear: boolean; // Depth layer (near = bigger, brighter)
	streamlineId: number; // Which streamline this particle belongs to
	dirtyAirWeight: number; // 0-1 weight for dirty air effects
	dirtyAirBoatId: number | null; // Which boat is affecting this particle
}

export interface WindVector {
	vx: number;
	vy: number;
	magnitude: number;
}

export interface GameDimensions {
	width: number;
	height: number;
}

export interface BoatPosition {
	x: number;
	y: number;
	rotation: number; // Boat heading in degrees
}

export interface ParticleSystemConfig {
	game: GameDimensions | null;
	currentWind: number; // Wind angle in game units
	showWindIndicators: boolean;
	boats?: BoatPosition[]; // Array of boat positions for dirty air detection
	density?: number; // 0.5-2.0 multiplier for particle density (default 1.0)
	opacity?: number; // 0-1 range for particle opacity (default 0.6)
	speed?: number; // 0.5-2.0 multiplier for particle speed (default 1.0)
	length?: number; // 0.5-2.0 multiplier for streak length (default 1.0)
}

export interface ParticleSystemCallbacks {
	onParticleCreated?: (particle: Particle) => void;
	onParticleRemoved?: (particle: Particle) => void;
}

/**
 * Wind Particle System
 * Manages particle creation, updates, and cleanup
 */
export class WindParticleSystem {
	private particles: Particle[] = [];
	private animationId: number | null = null;
	private svgElement: SVGElement | null = null;
	private defsElement: SVGDefsElement | null = null;
	private lastTime = 0;
	private config: ParticleSystemConfig;
	private callbacks: ParticleSystemCallbacks;
	
	// Streamlines: coherent bands of particles
	private streamlines: Array<{ x: number; y: number; angle: number }> = [];
	private numStreamlines = 6;
	
	// Gust system: time-varying wind magnitude
	private gustTime = 0;
	private gustMagnitude = 1.0;
	
	// Noise function for turbulence
	private noiseSeed = Math.random() * 1000;

	constructor(config: ParticleSystemConfig, callbacks: ParticleSystemCallbacks = {}) {
		this.config = config;
		this.callbacks = callbacks;
	}

	/**
	 * Initialize the particle system with an SVG element
	 */
	initialize(svgElement: SVGElement): void {
		this.svgElement = svgElement;
		this.defsElement = null;
		this.gustTime = 0;
		this.gustMagnitude = 1.0;
	}

	/**
	 * Simple noise function for turbulence
	 */
	private noise(x: number, y: number, t: number): number {
		const n = Math.sin(x * 0.02 + this.noiseSeed) * Math.cos(y * 0.02 + this.noiseSeed * 1.3) * Math.sin(t * 0.2 + this.noiseSeed * 0.7);
		return (n + 1) / 2; // Normalize to 0..1
	}

	/**
	 * Smoothstep function for smooth falloffs
	 */
	private smoothstep(edge0: number, edge1: number, x: number): number {
		const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
		return t * t * (3 - 2 * t);
	}

	/**
	 * Calculate apparent wind direction for a boat (with leeway effects)
	 * Uses shared utility function that includes leeway-induced flow rotation
	 */
	private calculateApparentWindForBoat(boatRotation: number, trueWindDirDeg: number, boatSpeedMultiplier: number): { vx: number; vy: number; angle: number } {
		const apparentWind = calculateApparentWind(boatRotation, trueWindDirDeg, boatSpeedMultiplier);
		return {
			vx: apparentWind.vx,
			vy: apparentWind.vy,
			angle: apparentWind.angle
		};
	}


	/**
	 * Detect dirty air influence from boats
	 * Uses simple wedge detection matching the visual zones (straight downwind wedges)
	 * Returns weight (0-1) and boat ID affecting the particle
	 */
	private detectDirtyAir(particleX: number, particleY: number, windDir: { vx: number; vy: number }): { weight: number; boatId: number | null } {
		if (!this.config.boats || this.config.boats.length === 0) {
			return { weight: 0, boatId: null };
		}

		const BOAT_LENGTH = 1.0;
		
		// Blanket Zone: narrow wedge on leeward side, 3-4 boat lengths
		const BLANKET_LENGTH = 4 * BOAT_LENGTH;
		const BLANKET_ANGLE_SPREAD = 15; // ±15° wedge
		
		// Backwind Zone: curved zone wrapping around stern/windward, 8-10 boat lengths
		const BACKWIND_LENGTH = 10 * BOAT_LENGTH;
		const BACKWIND_ANGLE_SPREAD = 30; // ±30° wedge (wider)
		
		/**
		 * Determine which side is leeward (away from wind)
		 * Returns: -1 for port tack (leeward is port/left), +1 for starboard tack (leeward is starboard/right)
		 */
		function getLeewardSide(boatRotation: number, windDir: number): number {
			const windFromBoat = ((windDir - boatRotation + 180) % 360) - 180;
			return windFromBoat > 0 ? -1 : 1;
		}

		// True wind direction
		const trueWindMag = Math.sqrt(windDir.vx * windDir.vx + windDir.vy * windDir.vy);
		if (trueWindMag < 0.001) return { weight: 0, boatId: null };
		const trueWindRad = Math.atan2(windDir.vx, windDir.vy);
		const trueWindDirDeg = (trueWindRad * 180) / Math.PI;

		let maxWeight = 0;
		let affectingBoatId: number | null = null;

		for (let i = 0; i < this.config.boats.length; i++) {
			const boat = this.config.boats[i];
			
			// Calculate boat speed multiplier for leeway calculation
			const boatHeading = Angle.fromDegrees(boat.rotation);
			const windDirection = Angle.fromDegrees(trueWindDirDeg);
			const boatSpeedMultiplier = BoatMovementService.calculateSpeedMultiplier(boatHeading, windDirection);
			
			// Calculate apparent wind for this boat (with leeway effects)
			const apparentWindResult = this.calculateApparentWindForBoat(boat.rotation, trueWindDirDeg, boatSpeedMultiplier);
			const apparentWindMag = Math.sqrt(apparentWindResult.vx * apparentWindResult.vx + apparentWindResult.vy * apparentWindResult.vy);
			if (apparentWindMag < 0.001) continue;
			
			const apparentWindDir = apparentWindResult.angle;
			
			// Downwind direction = opposite of apparent wind (where wind flows TO)
			const downwindDir = (apparentWindDir + 180) % 360;
			const downwindRad = (downwindDir * Math.PI) / 180;
			
			// Determine leeward and windward sides
			const leewardSide = getLeewardSide(boat.rotation, trueWindDirDeg);
			const windwardSide = -leewardSide;
			
			// Vector from boat to particle
			const dx = particleX - boat.x;
			const dy = particleY - boat.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			
			// Skip if too far away
			if (dist > BACKWIND_LENGTH) continue;
			
			// Calculate angle from boat to particle
			const particleAngleRad = Math.atan2(dx, -dy); // Note: -dy because y increases downward
			const particleAngleDeg = (particleAngleRad * 180) / Math.PI;
			
			// Distance along downwind direction (positive = downwind)
			const downwindNormX = Math.sin(downwindRad);
			const downwindNormY = -Math.cos(downwindRad);
			const d = dx * downwindNormX + dy * downwindNormY;
			
			// Skip if upwind of boat
			if (d < 0) continue;
			
			let weight = 0;
			
			// Check Blanket Zone (narrow wedge on leeward side, ±15°, 3-4 boat lengths)
			if (d <= BLANKET_LENGTH) {
				// Blanket zone center: downwind with slight leeward bias
				const blanketCenterDir = (downwindDir + leewardSide * 5 + 360) % 360; // 5° bias toward leeward
				let angleDiff = particleAngleDeg - blanketCenterDir;
				while (angleDiff > 180) angleDiff -= 360;
				while (angleDiff < -180) angleDiff += 360;
				
				if (Math.abs(angleDiff) <= BLANKET_ANGLE_SPREAD) {
					const distanceFactor = this.smoothstep(BLANKET_LENGTH, 0, d);
					const angleFactor = this.smoothstep(BLANKET_ANGLE_SPREAD, 0, Math.abs(angleDiff));
					weight = Math.max(weight, distanceFactor * angleFactor * 0.9); // Strong blanketing
				}
			}
			
			// Check Backwind Zone (simplified wedge on windward/stern side, ±30°, 8-10 boat lengths)
			if (d <= BACKWIND_LENGTH) {
				// Backwind zone center: downwind with windward bias
				const backwindCenterDir = (downwindDir + windwardSide * 10 + 360) % 360; // 10° bias toward windward
				let angleDiff = particleAngleDeg - backwindCenterDir;
				while (angleDiff > 180) angleDiff -= 360;
				while (angleDiff < -180) angleDiff += 360;
				
				if (Math.abs(angleDiff) <= BACKWIND_ANGLE_SPREAD) {
					const distanceFactor = this.smoothstep(BACKWIND_LENGTH, 0, d);
					const angleFactor = this.smoothstep(BACKWIND_ANGLE_SPREAD, 0, Math.abs(angleDiff));
					weight = Math.max(weight, distanceFactor * angleFactor * 0.7); // Weaker but spreads wider
				}
			}
			
			if (weight > maxWeight) {
				maxWeight = weight;
				affectingBoatId = i;
			}
		}

		return { weight: Math.min(maxWeight, 1.0), boatId: affectingBoatId };
	}
	
	/**
	 * Calculate angle difference (wrapping around 2π)
	 */
	private angleDiff(a1: number, a2: number): number {
		let diff = a1 - a2;
		while (diff > Math.PI) diff -= 2 * Math.PI;
		while (diff < -Math.PI) diff += 2 * Math.PI;
		return diff;
	}

	/**
	 * Apply dirty air effects to particle velocity
	 */
	private applyDirtyAirEffects(particle: Particle, wind: WindVector, time: number): void {
		if (particle.dirtyAirWeight < 0.01) return;

		const w = particle.dirtyAirWeight;
		
		// A. Slowdown (20-50% reduction) - apply to effective speed
		const slowdownFactor = 1.0 - 0.4 * w; // Max 40% slowdown
		const effectiveSpeed = particle.baseSpeed * slowdownFactor;
		
		// B. Turbulent jitter (perpendicular to wind)
		const windMag = Math.sqrt(wind.vx * wind.vx + wind.vy * wind.vy);
		if (windMag > 0.001) {
			const windPerpX = -wind.vy / windMag;
			const windPerpY = wind.vx / windMag;
			
			const turbStrength = 0.15; // 15% of base speed
			const noiseVal = this.noise(particle.x * 0.1, particle.y * 0.1, time * 0.3);
			const turbAmount = (noiseVal - 0.5) * 2; // -1 to 1
			
			particle.vx += windPerpX * turbAmount * turbStrength * w * effectiveSpeed;
			particle.vy += windPerpY * turbAmount * turbStrength * w * effectiveSpeed;
		}
		
		// C. Edge curl (rolling effect at plume edges)
		// This creates the "rolling sheet" look at plume boundaries
		if (w > 0.3) { // Only apply curl near edges
			const windMag = Math.sqrt(wind.vx * wind.vx + wind.vy * wind.vy);
			if (windMag > 0.001) {
				const windPerpX = -wind.vy / windMag;
				const windPerpY = wind.vx / windMag;
				
				// Edge strength increases with weight (stronger at edges)
				const edgeStrength = 0.1 * w;
				const curlAmount = Math.sin(time * 2 + particle.x * 0.5) * edgeStrength;
				
				particle.vx += windPerpX * curlAmount * effectiveSpeed;
				particle.vy += windPerpY * curlAmount * effectiveSpeed;
			}
		}
	}

	/**
	 * Smooth noise for more coherent turbulence
	 */
	private smoothNoise(x: number, y: number, t: number): number {
		const n1 = this.noise(x, y, t);
		const n2 = this.noise(x * 0.6, y * 0.6, t * 0.8);
		return (n1 * 0.7 + n2 * 0.3);
	}

	/**
	 * Initialize streamlines across the map
	 */
	private initStreamlines(): void {
		if (!this.config.game) return;
		
		this.streamlines = [];
		for (let i = 0; i < this.numStreamlines; i++) {
			// Random positions across the map
			const x = Math.random() * this.config.game.width;
			const y = Math.random() * this.config.game.height;
			const angle = Math.random() * Math.PI * 2;
			this.streamlines.push({ x, y, angle });
		}
	}

	/**
	 * Get wind vector at a given position with streamlines and gusts
	 */
	private getWindVector(x: number, y: number, time: number): WindVector {
		if (!this.config.game) return { vx: 0, vy: 0, magnitude: 0 };

		const windDisplayAngle = this.config.currentWind * 2;
		const moveAngleDeg = windDisplayAngle + 180; // Wind flows in opposite direction
		const moveAngleRad = (moveAngleDeg * Math.PI) / 180;

		// Base wind direction
		const baseVx = Math.sin(moveAngleRad);
		const baseVy = -Math.cos(moveAngleRad);

		// Gust magnitude (varies slowly with time)
		const gustNoise = this.smoothNoise(0, 0, time * 0.1);
		this.gustMagnitude = 0.8 + gustNoise * 0.4; // 0.8-1.2
		
		// Add occasional pulses
		const pulse = Math.sin(time * 0.05) > 0.95 ? 1.3 : 1.0;
		const finalGustMagnitude = this.gustMagnitude * pulse;

		// Streamline influence: particles are pulled slightly toward nearest streamline
		let streamlineInfluenceX = 0;
		let streamlineInfluenceY = 0;
		if (this.streamlines.length > 0) {
			let minDist = Infinity;
			let nearestStreamline = this.streamlines[0];
			
			for (const streamline of this.streamlines) {
				const dx = x - streamline.x;
				const dy = y - streamline.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < minDist) {
					minDist = dist;
					nearestStreamline = streamline;
				}
			}
			
			// Pull strength decreases with distance
			const pullStrength = 0.15 * Math.exp(-minDist / (this.config.game.width * 0.3));
			streamlineInfluenceX = Math.cos(nearestStreamline.angle) * pullStrength;
			streamlineInfluenceY = Math.sin(nearestStreamline.angle) * pullStrength;
		}

		// Perpendicular turbulence (Brownian jitter)
		const perpAngle = moveAngleRad + Math.PI / 2;
		const turbulence = this.smoothNoise(x * 0.02, y * 0.02, time * 0.2);
		const perpMagnitude = (turbulence - 0.5) * 0.15; // -0.075 to 0.075
		const perpX = Math.cos(perpAngle) * perpMagnitude;
		const perpY = Math.sin(perpAngle) * perpMagnitude;

		// Combine all components
		const vx = (baseVx + streamlineInfluenceX + perpX) * finalGustMagnitude;
		const vy = (baseVy + streamlineInfluenceY + perpY) * finalGustMagnitude;
		const magnitude = Math.sqrt(vx * vx + vy * vy);

		return { vx, vy, magnitude };
	}

	/**
	 * Determine upwind edge based on wind direction
	 */
	private getUpwindEdge(): { edge: number; startX: number; startY: number } {
		if (!this.config.game) {
			return { edge: 0, startX: 0, startY: 0 };
		}

		const windDisplayAngle = this.config.currentWind * 2;
		const moveAngleDeg = windDisplayAngle + 180; // Wind flows in opposite direction
		const moveAngleRad = (moveAngleDeg * Math.PI) / 180;

		// Determine which edge is upwind (where wind comes from)
		const vx = Math.sin(moveAngleRad);
		const vy = -Math.cos(moveAngleRad);

		// Find the edge with the strongest component
		let edge = 0; // 0=top, 1=right, 2=bottom, 3=left
		let startX = 0;
		let startY = 0;

		if (Math.abs(vy) > Math.abs(vx)) {
			// Vertical component dominates
			if (vy < 0) {
				edge = 2; // Bottom edge (wind coming from bottom)
				startX = Math.random() * this.config.game.width;
				startY = this.config.game.height + 2;
			} else {
				edge = 0; // Top edge (wind coming from top)
				startX = Math.random() * this.config.game.width;
				startY = -2;
			}
		} else {
			// Horizontal component dominates
			if (vx < 0) {
				edge = 1; // Right edge (wind coming from right)
				startX = this.config.game.width + 2;
				startY = Math.random() * this.config.game.height;
			} else {
				edge = 3; // Left edge (wind coming from left)
				startX = -2;
				startY = Math.random() * this.config.game.height;
			}
		}

		// Add some randomness to adjacent edges (10% spill)
		if (Math.random() < 0.1) {
			const adjacentEdge = (edge + Math.floor(Math.random() * 2) * 2 - 1 + 4) % 4;
			switch (adjacentEdge) {
				case 0: // Top
					startX = Math.random() * this.config.game.width;
					startY = -2;
					break;
				case 1: // Right
					startX = this.config.game.width + 2;
					startY = Math.random() * this.config.game.height;
					break;
				case 2: // Bottom
					startX = Math.random() * this.config.game.width;
					startY = this.config.game.height + 2;
					break;
				case 3: // Left
					startX = -2;
					startY = Math.random() * this.config.game.height;
					break;
			}
		}

		return { edge, startX, startY };
	}

	/**
	 * Create a new particle
	 */
	private createParticle(): Particle | null {
		if (!this.config.game || !this.svgElement) return null;

		const particle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		particle.setAttribute(
			'style',
			'pointer-events: none; z-index: 1; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; shape-rendering: geometricPrecision;'
		);

		// Spawn from upwind edge
		const { startX, startY } = this.getUpwindEdge();

		// Get initial wind vector
		const wind = this.getWindVector(startX, startY, this.gustTime);
		const angle = Math.atan2(wind.vy, wind.vx);

		// Depth layering: 30% near, 70% far
		const isNear = Math.random() < 0.3;
		
		// Get settings with defaults
		const speedSetting = this.config.speed ?? 1.0;
		const opacitySetting = this.config.opacity ?? 0.6;
		const lengthSetting = this.config.length ?? 1.0;
		
		// Particle properties with variation
		const baseSpeedMultiplier = isNear ? 0.12 + Math.random() * 0.08 : 0.08 + Math.random() * 0.12;
		const speedMultiplier = baseSpeedMultiplier * speedSetting;
		const maxAge = 200 + Math.random() * 200; // 200-400 frames (longer streaks)
		const baseOpacityRaw = isNear ? 0.6 + Math.random() * 0.2 : 0.3 + Math.random() * 0.2;
		const baseOpacity = baseOpacityRaw * opacitySetting;
		const size = isNear ? 1.0 + Math.random() * 0.4 : 0.6 + Math.random() * 0.4;

		// Streak dimensions - longer and thinner
		const baseLength = isNear ? 0.5 : 0.4;
		const streakLength = (baseLength + Math.random() * 0.3) * size * lengthSetting; // Longer streaks with length multiplier
		const streakWidth = (0.08 + Math.random() * 0.06) * size; // Thinner head

		// Assign to a streamline
		const streamlineId = Math.floor(Math.random() * this.numStreamlines);

		// Create unit streak path (centered at origin, pointing right)
		const unitPath = createUnitStreakPath(1.0, 0.15);
		particle.setAttribute('d', unitPath);
		particle.setAttribute('transform-origin', '0 0');

		// Use shared gradient (near or far)
		const gradientId = isNear ? 'windNear' : 'windFar';
		particle.setAttribute('fill', `url(#${gradientId})`);
		particle.setAttribute('stroke', 'none');

		// Initial transform
		const angleDeg = (angle * 180) / Math.PI;
		particle.setAttribute(
			'transform',
			`translate(${startX.toFixed(2)} ${startY.toFixed(2)}) rotate(${angleDeg}) scale(${streakLength.toFixed(3)})`
		);
		particle.style.opacity = `${baseOpacity}`;

		if (this.svgElement) {
			this.svgElement.appendChild(particle);
		}

		const particleData: Particle = {
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
			baseSpeed: speedMultiplier,
			streakLength,
			streakWidth,
			isNear,
			streamlineId,
			dirtyAirWeight: 0,
			dirtyAirBoatId: null
		};

		this.callbacks.onParticleCreated?.(particleData);
		return particleData;
	}

	/**
	 * Update particle position and transform
	 */
	private updateParticleShape(particle: Particle, time: number): void {
		// Calculate angle from velocity
		const angle = Math.atan2(particle.vy, particle.vx);
		const angleDeg = (angle * 180) / Math.PI;

		// Update opacity based on age
		const ageOpacity =
			particle.age < 10
				? particle.age / 10 // Fade in
				: particle.age > particle.maxAge - 20
					? (particle.maxAge - particle.age) / 20 // Fade out
					: 1;

		// Apply dirty air opacity reduction
		const dirtyAirOpacity = particle.dirtyAirWeight > 0.01 ? (1 - 0.3 * particle.dirtyAirWeight) : 1;
		const finalOpacity = particle.opacity * ageOpacity * dirtyAirOpacity;

		// Update gradient based on dirty air state
		if (particle.dirtyAirWeight > 0.01) {
			// Use red gradient for dirty air
			const gradientId = particle.isNear ? 'windNearDirty' : 'windFarDirty';
			particle.element.setAttribute('fill', `url(#${gradientId})`);
		} else {
			// Use normal gradient for clean air
			const gradientId = particle.isNear ? 'windNear' : 'windFar';
			particle.element.setAttribute('fill', `url(#${gradientId})`);
		}

		// Update transform (much cheaper than rewriting path)
		particle.element.setAttribute(
			'transform',
			`translate(${particle.x.toFixed(2)} ${particle.y.toFixed(2)}) rotate(${angleDeg}) scale(${particle.streakLength.toFixed(3)})`
		);
		particle.element.style.opacity = `${finalOpacity}`;
	}

	/**
	 * Remove a particle and clean up its resources
	 */
	private removeParticle(particle: Particle, index: number): void {
		particle.element.remove();
		this.particles.splice(index, 1);
		this.callbacks.onParticleRemoved?.(particle);
	}

	/**
	 * Initialize particles
	 */
	initParticles(): void {
		if (!this.config.game || !this.config.showWindIndicators || !this.svgElement) return;

		// Clean up all existing particles
		this.particles.forEach(particle => {
			particle.element.remove();
		});
		this.particles = [];

		// Remove all children including defs
		while (this.svgElement.firstChild) {
			this.svgElement.removeChild(this.svgElement.firstChild);
		}
		this.defsElement = null;

		// Create shared gradients
		this.defsElement = createSharedGradients(this.svgElement, null);

		// Initialize streamlines
		this.initStreamlines();

		// Reduced particle count: 150-200 instead of 300+
		const densitySetting = this.config.density ?? 1.0;
		const baseDensity = 175;
		const wind = this.getWindVector(this.config.game.width / 2, this.config.game.height / 2, this.gustTime);
		const densityMultiplier = 0.8 + wind.magnitude * 0.4;
		const particleCount = Math.floor(baseDensity * densityMultiplier * densitySetting);

		for (let i = 0; i < particleCount; i++) {
			const p = this.createParticle();
			if (p) this.particles.push(p);
		}

		this.lastTime = performance.now();
		this.startAnimation();
	}

	/**
	 * Update all particles
	 */
	private updateParticles = (currentTime: number): void => {
		if (!this.config.game || !this.config.showWindIndicators || this.particles.length === 0) {
			this.stopAnimation();
			return;
		}

		const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2.0); // Cap at 2x normal speed
		this.lastTime = currentTime;
		this.gustTime = currentTime / 1000; // Convert to seconds

		// Get wind at center for density calculation
		const densitySetting = this.config.density ?? 1.0;
		const centerWind = this.getWindVector(this.config.game.width / 2, this.config.game.height / 2, this.gustTime);
		const targetDensity = Math.floor(175 * (0.8 + centerWind.magnitude * 0.4) * densitySetting);

		for (let i = this.particles.length - 1; i >= 0; i--) {
			const particle = this.particles[i];

			particle.age++;

			// Get wind vector at current position (with streamlines and gusts)
			let wind = this.getWindVector(particle.x, particle.y, this.gustTime);

			// Detect dirty air influence
			const dirtyAir = this.detectDirtyAir(particle.x, particle.y, { vx: wind.vx, vy: wind.vy });
			particle.dirtyAirWeight = dirtyAir.weight;
			particle.dirtyAirBoatId = dirtyAir.boatId;

			// Apply disturbed wind rotation (downwash from sails) when in dirty air
			if (particle.dirtyAirWeight > 0.01 && particle.dirtyAirBoatId !== null) {
				const affectingBoat = this.config.boats?.[particle.dirtyAirBoatId];
				if (affectingBoat) {
					// Calculate distance from affecting boat
					const dx = particle.x - affectingBoat.x;
					const dy = particle.y - affectingBoat.y;
					const distance = Math.sqrt(dx * dx + dy * dy);
					
					// Calculate disturbed wind (rotates leeward)
					// Wind direction is where wind comes FROM
					const windDirDeg = (Math.atan2(wind.vx, wind.vy) * 180) / Math.PI;
					const disturbedWind = calculateDisturbedWind(
						windDirDeg, 
						distance, 
						particle.dirtyAirWeight,
						affectingBoat.rotation
					);
					
					// Rotate wind vector by disturbed angle
					const disturbedRad = (disturbedWind.angle * Math.PI) / 180;
					const windMag = Math.sqrt(wind.vx * wind.vx + wind.vy * wind.vy);
					wind = {
						vx: Math.sin(disturbedRad) * windMag * disturbedWind.speedMultiplier,
						vy: Math.cos(disturbedRad) * windMag * disturbedWind.speedMultiplier,
						magnitude: windMag * disturbedWind.speedMultiplier
					};
				}
			}

			// Apply dirty air effects before updating velocity
			if (particle.dirtyAirWeight > 0.01) {
				this.applyDirtyAirEffects(particle, wind, this.gustTime);
			}

			// Update velocity based on wind field (smooth interpolation)
			// Apply dirty air slowdown to effective speed
			const slowdownFactor = particle.dirtyAirWeight > 0.01 ? (1.0 - 0.4 * particle.dirtyAirWeight) : 1.0;
			const effectiveSpeed = particle.baseSpeed * slowdownFactor;
			
			const smoothing = particle.isNear ? 0.12 : 0.08; // Near particles respond faster
			particle.vx += (wind.vx * effectiveSpeed - particle.vx) * smoothing;
			particle.vy += (wind.vy * effectiveSpeed - particle.vy) * smoothing;

			// Update position using velocity (Euler integration)
			particle.x += particle.vx * deltaTime;
			particle.y += particle.vy * deltaTime;

			// Update streak transform and visual styling
			this.updateParticleShape(particle, this.gustTime);

			// Remove particles that are too old or left the screen
			const margin = 10;
			const shouldRemove =
				particle.age >= particle.maxAge ||
				particle.x < -margin ||
				particle.x > this.config.game.width + margin ||
				particle.y < -margin ||
				particle.y > this.config.game.height + margin;

			if (shouldRemove) {
				this.removeParticle(particle, i);
			}
		}

		// Spawn new particles to maintain density
		while (this.particles.length < targetDensity) {
			const p = this.createParticle();
			if (p) this.particles.push(p);
		}

		// Remove excess particles if density decreased
		while (this.particles.length > targetDensity * 1.2) {
			const oldest = this.particles.reduce(
				(oldest, p, idx) => (p.age > oldest.age ? { p, age: p.age, idx } : oldest),
				{ p: this.particles[0], age: this.particles[0].age, idx: 0 }
			);
			this.removeParticle(oldest.p, oldest.idx);
		}

		this.animationId = requestAnimationFrame(this.updateParticles);
	};

	/**
	 * Start animation loop
	 */
	startAnimation(): void {
		if (this.animationId === null) {
			this.lastTime = performance.now();
			this.animationId = requestAnimationFrame(this.updateParticles);
		}
	}

	/**
	 * Stop animation loop
	 */
	stopAnimation(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	/**
	 * Clean up all particles and resources
	 */
	cleanup(): void {
		this.stopAnimation();
		this.particles.forEach(particle => {
			particle.element.remove();
		});
		this.particles = [];
		if (this.svgElement) {
			while (this.svgElement.firstChild) {
				this.svgElement.removeChild(this.svgElement.firstChild);
			}
		}
		this.defsElement = null;
		this.streamlines = [];
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<ParticleSystemConfig>): void {
		this.config = { ...this.config, ...config };
		// Reinitialize streamlines if game dimensions changed
		if (config.game && this.streamlines.length === 0) {
			this.initStreamlines();
		}
	}

	/**
	 * Get current particle count
	 */
	getParticleCount(): number {
		return this.particles.length;
	}
}
