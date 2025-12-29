/**
 * Wind Particle System
 * 
 * Manages the lifecycle and physics of wind particles for visualization.
 * Separates particle system logic from rendering concerns.
 */

import { createTeardropPath, createGradient } from '$lib/utils/windParticleUtils';

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
	speed: number; // Base speed multiplier
	dropLength: number; // Length of the teardrop
	dropWidth: number; // Width at the head
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

export interface ParticleSystemConfig {
	game: GameDimensions | null;
	currentWind: number; // Wind angle in game units
	showWindIndicators: boolean;
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
	private gradientIdCounter = 0;
	private config: ParticleSystemConfig;
	private callbacks: ParticleSystemCallbacks;

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
		this.gradientIdCounter = 0;
	}

	/**
	 * Get wind vector at a given position
	 */
	private getWindVector(x: number, y: number): WindVector {
		if (!this.config.game) return { vx: 0, vy: 0, magnitude: 0 };

		const windDisplayAngle = this.config.currentWind * 2;
		const moveAngleDeg = windDisplayAngle + 180; // Wind flows in opposite direction
		const moveAngleRad = (moveAngleDeg * Math.PI) / 180;

		// Base wind magnitude (can be varied based on position for turbulence)
		const baseMagnitude = 1.0;

		// Add slight turbulence based on position
		const turbulence = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.1;
		const magnitude = baseMagnitude + turbulence;

		const vx = Math.sin(moveAngleRad) * magnitude;
		const vy = -Math.cos(moveAngleRad) * magnitude;

		return { vx, vy, magnitude: Math.abs(magnitude) };
	}

	/**
	 * Create a new particle
	 */
	private createParticle(): Particle | null {
		if (!this.config.game || !this.svgElement) return null;

		const particle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		// Apply styles directly since we're creating elements dynamically
		particle.setAttribute(
			'style',
			'pointer-events: none; z-index: 1; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; shape-rendering: geometricPrecision;'
		);

		// Spawn from edges with some randomness
		const edge = Math.floor(Math.random() * 4);
		let startX: number, startY: number;

		switch (edge) {
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
			default:
				startX = Math.random() * this.config.game.width;
				startY = Math.random() * this.config.game.height;
		}

		// Get initial wind vector
		const wind = this.getWindVector(startX, startY);
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
		const pathData = createTeardropPath(
			startX,
			startY,
			angle + Math.PI,
			dropLength * size,
			dropWidth * size
		);
		particle.setAttribute('d', pathData);

		// Create gradient
		const gradientId = `windDrop${this.gradientIdCounter++}`;
		const { defsElement } = createGradient(this.svgElement, this.defsElement, gradientId, baseOpacity);
		this.defsElement = defsElement;

		particle.setAttribute('fill', `url(#${gradientId})`);
		particle.setAttribute('stroke', 'none');
		particle.setAttribute('data-gradient-id', gradientId);
		particle.setAttribute('data-opacity', baseOpacity.toFixed(3));

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
			dropLength: dropLength * size,
			dropWidth: dropWidth * size
		};

		this.callbacks.onParticleCreated?.(particleData);
		return particleData;
	}

	/**
	 * Update particle shape and opacity
	 */
	private updateParticleShape(particle: Particle): void {
		// Calculate angle from velocity - rotated 180 degrees
		const angle = Math.atan2(particle.vy, particle.vx) + Math.PI;

		// Update teardrop path
		const pathData = createTeardropPath(
			particle.x,
			particle.y,
			angle,
			particle.dropLength,
			particle.dropWidth
		);
		particle.element.setAttribute('d', pathData);

		// Update opacity based on age
		const ageOpacity =
			particle.age < 10
				? particle.age / 10 // Fade in
				: particle.age > particle.maxAge - 20
					? (particle.maxAge - particle.age) / 20 // Fade out
					: 1;

		const finalOpacity = particle.opacity * ageOpacity;

		// Update gradient opacity
		const gradientId = particle.element.getAttribute('data-gradient-id');
		if (gradientId && this.defsElement) {
			const gradient = this.defsElement.querySelector(`#${gradientId}`) as SVGLinearGradientElement;
			if (gradient) {
				const stops = gradient.querySelectorAll('stop');
				stops[0]?.setAttribute('stop-color', `hsla(200, 70%, 90%, ${finalOpacity})`);
				stops[1]?.setAttribute('stop-color', `hsla(205, 65%, 75%, ${finalOpacity * 0.95})`);
				stops[2]?.setAttribute('stop-color', `hsla(210, 55%, 60%, ${finalOpacity * 0.8})`);
				stops[3]?.setAttribute('stop-color', `hsla(215, 45%, 50%, ${finalOpacity * 0.5})`);
			}
		}
	}

	/**
	 * Remove a particle and clean up its resources
	 */
	private removeParticle(particle: Particle, index: number): void {
		// Clean up gradient before removing particle
		const gradientId = particle.element.getAttribute('data-gradient-id');
		if (gradientId && this.defsElement) {
			const gradient = this.defsElement.querySelector(`#${gradientId}`);
			if (gradient) {
				gradient.remove();
			}
		}
		particle.element.remove();
		this.particles.splice(index, 1);
		this.callbacks.onParticleRemoved?.(particle);
	}

	/**
	 * Initialize particles
	 */
	initParticles(): void {
		if (!this.config.game || !this.config.showWindIndicators || !this.svgElement) return;

		// Clean up all existing particles and gradients
		this.particles.forEach(particle => {
			const gradientId = particle.element.getAttribute('data-gradient-id');
			if (gradientId && this.defsElement) {
				const gradient = this.defsElement.querySelector(`#${gradientId}`);
				if (gradient) {
					gradient.remove();
				}
			}
			particle.element.remove();
		});
		this.particles = [];

		// Remove all children including defs
		while (this.svgElement.firstChild) {
			this.svgElement.removeChild(this.svgElement.firstChild);
		}
		this.defsElement = null; // Reset defs
		this.gradientIdCounter = 0;

		// Spawn initial particles - density based on wind magnitude
		const wind = this.getWindVector(this.config.game.width / 2, this.config.game.height / 2);
		const baseDensity = 300; // Base particle count
		const densityMultiplier = 0.8 + wind.magnitude * 0.4; // Scale by wind strength
		const particleCount = Math.floor(baseDensity * densityMultiplier);

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

		// Get wind at center for density calculation
		const centerWind = this.getWindVector(this.config.game.width / 2, this.config.game.height / 2);
		const targetDensity = Math.floor(300 * (0.8 + centerWind.magnitude * 0.4));

		for (let i = this.particles.length - 1; i >= 0; i--) {
			const particle = this.particles[i];

			particle.age++;

			// Get wind vector at current position (for turbulence)
			const wind = this.getWindVector(particle.x, particle.y);

			// Update velocity based on wind field (smooth interpolation)
			const smoothing = 0.1; // How quickly velocity adapts to wind
			particle.vx += (wind.vx * particle.speed - particle.vx) * smoothing;
			particle.vy += (wind.vy * particle.speed - particle.vy) * smoothing;

			// Update position using velocity (Euler integration)
			particle.x += particle.vx * deltaTime;
			particle.y += particle.vy * deltaTime;

			// Update teardrop shape
			this.updateParticleShape(particle);

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
			const gradientId = particle.element.getAttribute('data-gradient-id');
			if (gradientId && this.defsElement) {
				const gradient = this.defsElement.querySelector(`#${gradientId}`);
				if (gradient) {
					gradient.remove();
				}
			}
			particle.element.remove();
		});
		this.particles = [];
		if (this.svgElement) {
			while (this.svgElement.firstChild) {
				this.svgElement.removeChild(this.svgElement.firstChild);
			}
		}
		this.defsElement = null;
		this.gradientIdCounter = 0;
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<ParticleSystemConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get current particle count
	 */
	getParticleCount(): number {
		return this.particles.length;
	}
}

