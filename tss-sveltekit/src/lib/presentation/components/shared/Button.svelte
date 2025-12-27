<script lang="ts">
	export let variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled: boolean = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let fullWidth: boolean = false;
	export let loading: boolean = false;

	let classes = `btn btn-${variant} btn-${size}`;
	if (fullWidth) classes += ' w-100';
</script>

<button
	class={classes}
	{type}
	{disabled}
	on:click
	on:keydown
	on:focus
	on:blur
	role="button"
	aria-disabled={disabled || loading}
>
	{#if loading}
		<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
	{/if}
	<slot />
</button>

<style>
	button:disabled {
		cursor: not-allowed;
		opacity: 0.65;
	}
</style>


