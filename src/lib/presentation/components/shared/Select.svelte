<script lang="ts">
	export let label: string | undefined = undefined;
	export let id: string | undefined = undefined;
	export let value: string | number = '';
	export let options: Array<{ value: string | number; label: string }> = [];
	export let placeholder: string = '';
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let error: string | undefined = undefined;
	export let helpText: string | undefined = undefined;
	export let size: 'sm' | 'md' | 'lg' = 'md';

	$: inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
	$: hasError = error !== undefined && error !== '';
</script>

<div class="form-group">
	{#if label}
		<label for={inputId} class="form-label">
			{label}
			{#if required}
				<span class="text-danger">*</span>
			{/if}
		</label>
	{/if}
	<select
		{id}
		class="form-select form-select-{size}"
		class:is-invalid={hasError}
		{disabled}
		{required}
		bind:value
		on:change
		on:blur
		on:focus
		aria-invalid={hasError}
		aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
	>
		{#if placeholder}
			<option value="" disabled>{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	{#if error}
		<div id="{inputId}-error" class="invalid-feedback" role="alert">
			{error}
		</div>
	{/if}
	{#if helpText && !error}
		<div id="{inputId}-help" class="form-text">
			{helpText}
		</div>
	{/if}
</div>

<style>
	.form-group {
		margin-bottom: var(--spacing-md);
	}

	.form-label {
		display: block;
		margin-bottom: var(--spacing-xs);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
	}

	.form-select {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-sm);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		transition: border-color var(--transition-base), box-shadow var(--transition-base);
		cursor: pointer;
	}

	.form-select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
	}

	.form-select:disabled {
		background: var(--color-bg-tertiary);
		cursor: not-allowed;
		opacity: 0.65;
	}

	.form-select.is-invalid {
		border-color: var(--color-danger);
	}

	.form-select.is-invalid:focus {
		border-color: var(--color-danger);
		box-shadow: 0 0 0 3px rgba(var(--color-danger-rgb), 0.1);
	}

	.invalid-feedback {
		display: block;
		margin-top: var(--spacing-xs);
		color: var(--color-danger);
		font-size: var(--font-size-sm);
	}

	.form-text {
		display: block;
		margin-top: var(--spacing-xs);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}
</style>

