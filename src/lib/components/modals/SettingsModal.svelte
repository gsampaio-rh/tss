<script lang="ts">
	import Modal from '$lib/presentation/components/shared/Modal.svelte';
	import SettingsPanel from '$lib/components/controls/SettingsPanel.svelte';

	export let isOpen: boolean = false;
</script>

<Modal open={isOpen} title="Settings" size="lg" on:close={() => (isOpen = false)}>
	<SettingsPanel />
</Modal>

