<script lang="ts">
	export let label: string;
	export let showInfoIcon: boolean = false;
	export let onInfoClick: (() => void) | null = null;
	export let infoAriaLabel: string = '';
</script>

<div class="metric-card">
	<div class="metric-label">
		<span>{label}</span>
		{#if onInfoClick}
			<button
				type="button"
				class="info-icon"
				on:click|stopPropagation={onInfoClick}
				aria-label={infoAriaLabel || `Learn more about ${label}`}
			>
				ℹ️
			</button>
		{/if}
	</div>
	<slot />
</div>

<style>
	.metric-card {
		background: var(--color-bg-primary);
		padding: var(--spacing-sm);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--color-border-light);
	}

	.metric-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-xs);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-xs);
	}

	.info-icon {
		background: none;
		border: none;
		cursor: pointer;
		font-size: var(--font-size-xs);
		opacity: 0.6;
		transition: opacity 0.2s;
		padding: 0;
		line-height: 1;
	}

	.info-icon:hover {
		opacity: 1;
	}
</style>

