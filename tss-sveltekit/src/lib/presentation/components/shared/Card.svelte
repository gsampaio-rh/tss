<script lang="ts">
	export let title: string | undefined = undefined;
	export let subtitle: string | undefined = undefined;
	export let variant: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' = 'default';
	export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
	export let collapsible: boolean = false;
	export let collapsed: boolean = false;

	let isCollapsed = collapsed;

	function toggleCollapse() {
		if (collapsible) {
			isCollapsed = !isCollapsed;
		}
	}
</script>

<div class="card card-{variant}">
	{#if title || subtitle}
		<div
			class="card-header"
			class:collapsible
			on:click={toggleCollapse}
			on:keydown={(e) => {
				if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
					e.preventDefault();
					toggleCollapse();
				}
			}}
			role={collapsible ? 'button' : undefined}
			tabindex={collapsible ? 0 : undefined}
			aria-expanded={collapsible ? !isCollapsed : undefined}
		>
			{#if title}
				<h5 class="card-title">{title}</h5>
			{/if}
			{#if subtitle}
				<h6 class="card-subtitle text-muted">{subtitle}</h6>
			{/if}
			{#if collapsible}
				<span class="collapse-icon">{isCollapsed ? '▼' : '▲'}</span>
			{/if}
		</div>
	{/if}
	<div class="card-body" class:collapsed={isCollapsed} class:padding-{padding}>
		{#if !isCollapsed}
			<slot />
		{/if}
	</div>
	{#if $$slots.footer}
		<div class="card-footer">
			<slot name="footer" />
		</div>
	{/if}
</div>

<style>
	.card {
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-md);
		background: var(--color-bg-secondary);
		box-shadow: var(--shadow-sm);
		margin-bottom: var(--spacing-md);
	}

	.card-header {
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--color-border-medium);
		background: var(--color-bg-tertiary);
	}

	.card-header.collapsible {
		cursor: pointer;
		user-select: none;
	}

	.card-header.collapsible:hover {
		background: var(--color-bg-secondary);
	}

	.card-header.collapsible:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
	}

	.card-title {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
	}

	.card-subtitle {
		margin: var(--spacing-xs) 0 0 0;
		font-size: var(--font-size-sm);
	}

	.collapse-icon {
		float: right;
		font-size: var(--font-size-xs);
	}

	.card-body {
		padding: var(--spacing-md);
		transition: max-height 0.3s ease-out;
	}

	.card-body.padding-none {
		padding: 0;
	}

	.card-body.padding-sm {
		padding: var(--spacing-sm);
	}

	.card-body.padding-md {
		padding: var(--spacing-md);
	}

	.card-body.padding-lg {
		padding: var(--spacing-lg);
	}

	.card-body.collapsed {
		max-height: 0;
		overflow: hidden;
		padding-top: 0;
		padding-bottom: 0;
	}

	.card-footer {
		padding: var(--spacing-md);
		border-top: 1px solid var(--color-border-medium);
		background: var(--color-bg-tertiary);
	}
</style>

