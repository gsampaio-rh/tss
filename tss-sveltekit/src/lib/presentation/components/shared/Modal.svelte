<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let open: boolean = false;
	export let title: string = '';
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let closeOnBackdrop: boolean = true;
	export let closeOnEscape: boolean = true;

	const dispatch = createEventDispatcher();

	let modalElement: HTMLDivElement | undefined = undefined;
	let backdropElement: HTMLDivElement | undefined = undefined;

	function handleClose() {
		if (open) {
			dispatch('close');
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (closeOnBackdrop && backdropElement && event.target === backdropElement) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (closeOnEscape && event.key === 'Escape' && open) {
			handleClose();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	$: if (open) {
		// Prevent body scroll when modal is open
		document.body.style.overflow = 'hidden';
	} else {
		document.body.style.overflow = '';
	}
</script>

{#if open}
	<div
		bind:this={backdropElement}
		class="modal-backdrop"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		tabindex="-1"
	>
		<div
			bind:this={modalElement}
			class="modal modal-{size}"
			on:click|stopPropagation
		>
			<div class="modal-header">
				{#if title}
					<h5 id="modal-title" class="modal-title">{title}</h5>
				{/if}
				<button
					type="button"
					class="modal-close"
					on:click={handleClose}
					aria-label="Close modal"
				>
					×
				</button>
			</div>
			<div class="modal-body">
				<slot />
			</div>
			{#if $$slots.footer}
				<div class="modal-footer">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	.modal {
		background: var(--color-bg-primary);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-xl);
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		animation: slideIn 0.2s ease-out;
		overflow: hidden;
	}

	.modal-sm {
		width: 300px;
	}

	.modal-md {
		width: 500px;
	}

	.modal-lg {
		width: 800px;
	}

	.modal-xl {
		width: 1200px;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--color-border-medium);
	}

	.modal-title {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 24px;
		line-height: 1;
		cursor: pointer;
		color: var(--color-text-secondary);
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		transition: background-color var(--transition-base);
	}

	.modal-close:hover {
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
	}

	.modal-body {
		padding: var(--spacing-md);
		overflow-y: auto;
		flex: 1;
	}

	.modal-footer {
		padding: var(--spacing-md);
		border-top: 1px solid var(--color-border-medium);
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>

