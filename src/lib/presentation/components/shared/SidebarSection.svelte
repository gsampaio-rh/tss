<script lang="ts">
	export let title: string;
	export let tooltip: string = '';
	export let open: boolean = true;

	function toggle() {
		open = !open;
	}
</script>

<div class="sidebar-section">
	<button class="section-header" on:click={toggle}>
		<span class="section-chevron" class:open>
			<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
				<path d="M3 2l4 3-4 3z"/>
			</svg>
		</span>
		<span class="section-label">{title}</span>
		{#if tooltip}
			<span class="section-info">
				<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
					<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
					<path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
				</svg>
				<span class="info-tooltip">{tooltip}</span>
			</span>
		{/if}
	</button>
	{#if open}
		<div class="section-body">
			<slot />
		</div>
	{/if}
</div>

<style>
	.sidebar-section {
		margin-bottom: 2px;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		padding: 8px 10px;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: background 0.12s ease;
		text-align: left;
	}

	.section-header:hover {
		background: var(--color-bg-primary);
	}

	.section-chevron {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		color: var(--color-text-secondary);
		transition: transform 0.2s ease;
		transform: rotate(0deg);
	}

	.section-chevron.open {
		transform: rotate(90deg);
	}

	.section-label {
		flex: 1;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--color-text-secondary);
	}

	.section-info {
		position: relative;
		display: flex;
		align-items: center;
		color: var(--color-text-secondary);
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.section-header:hover .section-info {
		opacity: 0.5;
	}

	.section-info:hover {
		opacity: 1 !important;
	}

	.info-tooltip {
		display: none;
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 6px;
		width: 210px;
		padding: 8px 10px;
		background: var(--color-text-primary);
		color: var(--color-bg-secondary);
		font-size: 11px;
		font-weight: 400;
		line-height: 1.45;
		letter-spacing: 0;
		text-transform: none;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		z-index: var(--z-tooltip);
		pointer-events: none;
	}

	.section-info:hover .info-tooltip {
		display: block;
	}

	.section-body {
		padding: 8px 10px 12px 30px;
	}
</style>
