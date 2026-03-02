<script lang="ts">
	export let direction: number = 0;
	export let speed: number = 0;
</script>

<div class="compass-container">
	<div class="compass">
		<svg viewBox="0 0 80 80" width="72" height="72">
			<circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
			<circle cx="40" cy="40" r="36" fill="rgba(0,0,0,0.55)" />

			<line x1="40" y1="6" x2="40" y2="10" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
			<line x1="40" y1="70" x2="40" y2="74" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
			<line x1="6" y1="40" x2="10" y2="40" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
			<line x1="70" y1="40" x2="74" y2="40" stroke="rgba(255,255,255,0.5)" stroke-width="1" />

			<text x="40" y="18" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="8" font-weight="600">N</text>
			<text x="40" y="68" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="7">S</text>
			<text x="15" y="43" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="7">W</text>
			<text x="65" y="43" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="7">E</text>

			<g transform="rotate({direction} 40 40)">
				<polygon points="40,10 35,30 40,26 45,30" fill="rgba(100,180,255,0.85)" stroke="#fff" stroke-width="0.5" />
				<line x1="40" y1="26" x2="40" y2="60" stroke="rgba(100,180,255,0.5)" stroke-width="1.5" stroke-linecap="round" />
			</g>
		</svg>
	</div>
	<div class="compass-readout">
		<span class="compass-dir">{direction.toFixed(0)}°</span>
		{#if speed > 0}
			<span class="compass-speed">{speed.toFixed(1)} kn</span>
		{/if}
	</div>
</div>

<style>
	.compass-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.compass {
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
	}

	.compass-readout {
		display: flex;
		align-items: baseline;
		gap: 5px;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
	}

	.compass-dir {
		font-size: 13px;
		font-weight: 700;
		color: #fff;
		font-variant-numeric: tabular-nums;
	}

	.compass-speed {
		font-size: 10px;
		color: rgba(255, 255, 255, 0.6);
		font-weight: 500;
	}
</style>
