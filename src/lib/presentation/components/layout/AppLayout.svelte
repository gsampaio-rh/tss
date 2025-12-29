<script lang="ts">
	import { onMount } from 'svelte';
	import LeftSidebar from './LeftSidebar.svelte';
	import RightSidebar from './RightSidebar.svelte';
	import GameStage from './GameStage.svelte';
	import { windActions, initializeWindScenarios } from '$lib/stores/wind';
	import { logger } from '$lib/infrastructure/logging/logger';

	onMount(() => {
		logger.info('[AppLayout] Initializing wind scenarios', 'AppLayout');
		const defaultScenarios = initializeWindScenarios();
		windActions.loadScenarios(defaultScenarios);
		logger.info('[AppLayout] Wind scenarios initialized', 'AppLayout', { count: defaultScenarios.length });
	});
</script>

<div class="app-layout">
	<LeftSidebar />
	<GameStage />
	<RightSidebar />
</div>

