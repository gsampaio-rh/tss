<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let isPinching: boolean;
	export let isFooting: boolean;

	// Calculate stall amount (0..1) for smooth transitions
	// 0 = fully flowing, 1 = fully stalled
	$: leewardStallAmount = isFooting ? 1.0 : 0.0;
	$: windwardStallAmount = isPinching ? 1.0 : 0.0;

	// Determine state: FLOW (0), ON_EDGE (0.3-0.7), STALL (1.0)
	function getState(stallAmount: number): 'FLOW' | 'ON_EDGE' | 'STALL' {
		if (stallAmount < 0.3) return 'FLOW';
		if (stallAmount < 0.7) return 'ON_EDGE';
		return 'STALL';
	}

	$: leewardState = getState(leewardStallAmount);
	$: windwardState = getState(windwardStallAmount);

	// Less saturated colors
	const COLOR_FLOW = '#4a9e5f'; // Muted green
	const COLOR_STALL = '#c85a5a'; // Muted red
	const COLOR_ON_EDGE = '#b8a04a'; // Muted yellow/orange

	function getColor(state: 'FLOW' | 'ON_EDGE' | 'STALL'): string {
		if (state === 'FLOW') return COLOR_FLOW;
		if (state === 'STALL') return COLOR_STALL;
		return COLOR_ON_EDGE;
	}

	$: leewardColor = getColor(leewardState);
	$: windwardColor = getColor(windwardState);

	// Animation state
	let t = 0;
	let raf: number | null = null;

	// Path strings for each strand - initialize with initial paths
	let leewardPath1 = 'M 20,30 L 105,30';
	let leewardPath2 = 'M 22,30 L 104,30';
	let leewardPath3 = 'M 18,30 L 106,30';
	let windwardPath1 = 'M 20,55 L 105,55';
	let windwardPath2 = 'M 22,55 L 104,55';
	let windwardPath3 = 'M 18,55 L 106,55';

	// Tunables
	const N = 7; // Points along strand
	const baseAft = { x: 1, y: 0.02 }; // Flowing direction (mostly aft)
	const baseDroop = { x: 0.55, y: 0.9 }; // Stalled direction (down and slightly aft)

	// Deterministic pseudo-random
	function hash(n: number, offset: number): number {
		return ((Math.sin((n + offset) * 999.123) * 43758.5453) % 1 + 0.5);
	}

	function smoothNoise(u: number, offset: number): number {
		const i = Math.floor(u);
		const f = u - i;
		const a = hash(i, offset);
		const b = hash(i + 1, offset);
		const s = f * f * (3 - 2 * f); // Smoothstep
		return a + (b - a) * s;
	}

	function makePath(
		time: number,
		x0: number,
		y0: number,
		length: number,
		stallAmount: number,
		hashOffset: number
	): string {
		// Interpolate direction based on stall amount
		const dirX = baseAft.x + (baseDroop.x - baseAft.x) * stallAmount;
		const dirY = baseAft.y + (baseDroop.y - baseAft.y) * stallAmount;

		// Animation parameters based on state
		const state = getState(stallAmount);
		let amp: number, freq: number, jitter: number, flickChance: number;

		if (state === 'FLOW') {
			amp = 2.2;
			freq = 5.5;
			jitter = 0.8;
			flickChance = 0.015;
		} else if (state === 'ON_EDGE') {
			amp = 4.0;
			freq = 3.5;
			jitter = 1.0;
			flickChance = 0.04; // More flicking near edge
		} else {
			// STALL
			amp = 6.5;
			freq = 2.2;
			jitter = 1.2;
			flickChance = 0.04;
		}

		// Occasional flick
		const flick = smoothNoise(time * 0.7, hashOffset) < flickChance ? 1 : 0;

		// Generate points along strand
		const pts: { x: number; y: number }[] = [];
		for (let i = 0; i < N; i++) {
			const s = i / (N - 1); // 0..1 along strand
			const baseX = x0 + dirX * (length * s);
			const baseY = y0 + dirY * (length * s);

			// Displacement grows toward tip
			const grow = s * s;

			// Non-periodic wobble (mix two noises)
			const n1 = (smoothNoise(time * freq + i * 2.1, hashOffset) - 0.5) * 2;
			const n2 = (smoothNoise(time * (freq * 0.6) + i * 5.7 + 10, hashOffset) - 0.5) * 2;

			// Perpendicular to strand direction
			const perpX = -dirY;
			const perpY = dirX;

			// Wobble + flick
			const wobble = (n1 * 0.8 + n2 * 0.5) * amp * grow + flick * amp * 0.6 * grow;

			// Small fast twitch
			const twitch = Math.sin(time * 18 + i * 1.7) * jitter * (0.2 + 0.8 * grow);

			pts.push({
				x: baseX + perpX * (wobble + twitch),
				y: baseY + perpY * (wobble + twitch)
			});
		}

		// Convert to smooth path with quadratic curves
		let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
		for (let i = 1; i < pts.length - 1; i++) {
			const cx = pts[i].x;
			const cy = pts[i].y;
			const nx = (pts[i].x + pts[i + 1].x) / 2;
			const ny = (pts[i].y + pts[i + 1].y) / 2;
			d += ` Q ${cx.toFixed(2)},${cy.toFixed(2)} ${nx.toFixed(2)},${ny.toFixed(2)}`;
		}
		d += ` T ${pts[pts.length - 1].x.toFixed(2)},${pts[pts.length - 1].y.toFixed(2)}`;
		return d;
	}

	function animate() {
		t += 1 / 60;

		// Update leeward strands
		leewardPath1 = makePath(t, 20, 30, 85, leewardStallAmount, 0);
		leewardPath2 = makePath(t, 22, 30, 82, leewardStallAmount, 100);
		leewardPath3 = makePath(t, 18, 30, 88, leewardStallAmount, 200);

		// Update windward strands
		windwardPath1 = makePath(t, 20, 55, 85, windwardStallAmount, 300);
		windwardPath2 = makePath(t, 22, 55, 82, windwardStallAmount, 400);
		windwardPath3 = makePath(t, 18, 55, 88, windwardStallAmount, 500);

		raf = requestAnimationFrame(animate);
	}

	onMount(() => {
		// Initialize paths immediately
		animate();
		// Then start animation loop
		raf = requestAnimationFrame(animate);
	});

	onDestroy(() => {
		if (raf !== null) {
			cancelAnimationFrame(raf);
		}
	});
</script>

<div class="tell-tales-container">
	<div class="tell-tale-label">Tell Tales</div>
	<div class="tell-tales-perspective">
		<svg width="200" height="90" viewBox="0 0 200 90" class="tell-tales-sail-view">
			<!-- Sail outline (subtle luff curve) -->
			<path
				d="M 15,20 Q 15,50 15,80"
				stroke="rgba(0,0,0,0.08)"
				stroke-width="1.5"
				fill="none"
				stroke-linecap="round"
				class="sail-outline"
			/>

			<!-- Leeward tell tales (top) -->
			<!-- Tape/attachment points -->
			<rect x="14" y="27" width="10" height="6" rx="2" fill="rgba(0,0,0,0.15)" class="tape" />
			<rect x="16" y="27" width="10" height="6" rx="2" fill="rgba(0,0,0,0.12)" class="tape" />
			<rect x="12" y="27" width="10" height="6" rx="2" fill="rgba(0,0,0,0.12)" class="tape" />

			<!-- Strands: body + highlight for taper effect -->
			<path
				d={leewardPath1}
				stroke={leewardColor}
				stroke-width="2.2"
				opacity="0.55"
				fill="none"
				stroke-linecap="round"
				class="strand-body"
			/>
			<path
				d={leewardPath1}
				stroke={leewardColor}
				stroke-width="1.2"
				fill="none"
				stroke-linecap="round"
				class="strand-highlight"
			/>

			<path
				d={leewardPath2}
				stroke={leewardColor}
				stroke-width="2.0"
				opacity="0.5"
				fill="none"
				stroke-linecap="round"
				class="strand-body"
			/>
			<path
				d={leewardPath2}
				stroke={leewardColor}
				stroke-width="1.0"
				fill="none"
				stroke-linecap="round"
				class="strand-highlight"
			/>

			<path
				d={leewardPath3}
				stroke={leewardColor}
				stroke-width="2.1"
				opacity="0.52"
				fill="none"
				stroke-linecap="round"
				class="strand-body"
			/>
			<path
				d={leewardPath3}
				stroke={leewardColor}
				stroke-width="1.1"
				fill="none"
				stroke-linecap="round"
				class="strand-highlight"
			/>

			<!-- Leeward label -->
			<text
				x="110"
				y="33"
				font-size="9"
				fill={leewardColor}
				font-weight="400"
				opacity="0.8"
				class="tell-tale-label-text"
			>
				Leeward
			</text>

			<!-- Windward tell tales (bottom) -->
			<!-- Tape/attachment points -->
			<rect x="14" y="52" width="10" height="6" rx="2" fill="rgba(0,0,0,0.15)" class="tape" />
			<rect x="16" y="52" width="10" height="6" rx="2" fill="rgba(0,0,0,0.12)" class="tape" />
			<rect x="12" y="52" width="10" height="6" rx="2" fill="rgba(0,0,0,0.12)" class="tape" />

			<!-- Strands: body + highlight for taper effect -->
			<path
				d={windwardPath1}
				stroke={windwardColor}
				stroke-width="2.2"
				opacity="0.55"
				fill="none"
				stroke-linecap="round"
				class="strand-body"
			/>
			<path
				d={windwardPath1}
				stroke={windwardColor}
				stroke-width="1.2"
				fill="none"
				stroke-linecap="round"
				class="strand-highlight"
			/>

			<path
				d={windwardPath2}
				stroke={windwardColor}
				stroke-width="2.0"
				opacity="0.5"
				fill="none"
				stroke-linecap="round"
				class="strand-body"
			/>
			<path
				d={windwardPath2}
				stroke={windwardColor}
				stroke-width="1.0"
				fill="none"
				stroke-linecap="round"
				class="strand-highlight"
			/>

			<path
				d={windwardPath3}
				stroke={windwardColor}
				stroke-width="2.1"
				opacity="0.52"
				fill="none"
				stroke-linecap="round"
				class="strand-body"
			/>
			<path
				d={windwardPath3}
				stroke={windwardColor}
				stroke-width="1.1"
				fill="none"
				stroke-linecap="round"
				class="strand-highlight"
			/>

			<!-- Windward label -->
			<text
				x="110"
				y="58"
				font-size="9"
				fill={windwardColor}
				font-weight="400"
				opacity="0.8"
				class="tell-tale-label-text"
			>
				Windward
			</text>
		</svg>
	</div>
</div>

<style>
	.tell-tales-container {
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border-light);
	}

	.tell-tale-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-bottom: 8px;
		font-weight: var(--font-weight-semibold);
	}

	.tell-tales-perspective {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.tell-tales-sail-view {
		display: block;
		margin: 0 auto;
	}

	.sail-outline {
		pointer-events: none;
	}

	.tape {
		pointer-events: none;
	}

	.strand-body {
		pointer-events: none;
		filter: none; /* Remove heavy drop shadow */
	}

	.strand-highlight {
		pointer-events: none;
		filter: none;
	}

	.tell-tale-label-text {
		font-family: system-ui, -apple-system, sans-serif;
		pointer-events: none;
	}
</style>
