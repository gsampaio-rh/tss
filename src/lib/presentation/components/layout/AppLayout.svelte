<script lang="ts">
	import { onMount } from 'svelte';
	import LeftSidebar from './LeftSidebar.svelte';
	import RightSidebar from './RightSidebar.svelte';
	import GameStage from './GameStage.svelte';
	import HelpModal from '$lib/components/modals/HelpModal.svelte';
	import SettingsModal from '$lib/components/modals/SettingsModal.svelte';
	import { windActions, initializeWindScenarios } from '$lib/stores/wind';
	import { appMode } from '$lib/stores/session';
	import { logger } from '$lib/infrastructure/logging/logger';

	let showHelpModal = false;
	let showSettingsModal = false;

	onMount(() => {
		logger.info('[AppLayout] Initializing wind scenarios', 'AppLayout');
		const defaultScenarios = initializeWindScenarios();
		windActions.loadScenarios(defaultScenarios);
		logger.info('[AppLayout] Wind scenarios initialized', 'AppLayout', { count: defaultScenarios.length });
	});
</script>

<div class="app-root">
	<!-- Top Bar -->
	<header class="top-bar">
		<div class="top-bar-left">
			<span class="top-bar-logo">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -10 14 20" width="18" height="24">
					<path d="M -4 7.5 L 4 7.5 C 5 1.5 5 -2.5 2.5 -9 L -2.5 -9 C -5 -2.5 -5 1.5 -4 7.5 Z"
						stroke="#fff" stroke-width=".5" fill="var(--color-primary)" />
					<path d="M 0 -6 C 2 -4 3 -1 2 6" stroke="white" fill="none" stroke-width="1" />
				</svg>
			</span>
			<span class="top-bar-title">Tactical Sailing Simulator</span>
		</div>

		<div class="top-bar-center">
			<div class="mode-toggle">
				<button
					class="mode-btn"
					class:active={$appMode === 'simulation'}
					on:click={() => appMode.set('simulation')}
				>Simulation</button>
				<button
					class="mode-btn"
					class:active={$appMode === 'replay'}
					on:click={() => appMode.set('replay')}
				>Replay</button>
			</div>
		</div>

		<div class="top-bar-right">
			<button
				class="top-bar-icon-btn"
				on:click={() => (showSettingsModal = true)}
				aria-label="Open settings"
				title="Settings"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
					<path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
					<path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.292-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.292c.415.764-.42 1.6-1.185 1.184l-.292-.159a1.873 1.873 0 0 0-2.692 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.693-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.292A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
				</svg>
			</button>
			<button
				class="top-bar-icon-btn"
				on:click={() => (showHelpModal = true)}
				aria-label="Open help"
				title="Help"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
					<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
					<path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.196-.9.324-1.176.787-1.176 1.54v.111H7.82c0-.596.145-1.02.8-1.32.655-.31 1.354-.495 1.354-1.338 0-1.072-.92-1.744-2.143-1.744-1.22 0-2.18.747-2.18 1.713 0 .688.482.976 1.102 1.165l.803.211c.918.238 1.466.86 1.466 1.853v.111h-1.11v-.111c0-.478-.245-.84-.727-1.047l-.803-.21c-.884-.23-1.4-.892-1.4-1.792 0-1.163.956-2.03 2.18-2.03 1.22 0 2.143.867 2.143 2.03 0 .712-.29 1.304-.787 1.653h-.002z"/>
				</svg>
			</button>
		</div>
	</header>

	<SettingsModal bind:isOpen={showSettingsModal} />
	<HelpModal bind:isOpen={showHelpModal} />

	<!-- Main content area -->
	<div class="app-layout">
		<LeftSidebar />
		<GameStage />
		<RightSidebar />
	</div>
</div>

<style>
	.app-root {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.top-bar {
		height: 40px;
		min-height: 40px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16px;
		background: #1a1f2e;
		color: #fff;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		z-index: 100;
		flex-shrink: 0;
	}

	.top-bar-left {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 200px;
	}

	.top-bar-logo {
		display: flex;
		align-items: center;
	}

	.top-bar-title {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.3px;
		opacity: 0.9;
	}

	.top-bar-center {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.top-bar-right {
		min-width: 200px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 4px;
	}

	.top-bar-icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		color: rgba(255, 255, 255, 0.5);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.top-bar-icon-btn:hover {
		color: rgba(255, 255, 255, 0.9);
		background: rgba(255, 255, 255, 0.1);
	}

	.mode-toggle {
		display: flex;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		padding: 2px;
		gap: 2px;
	}

	.mode-btn {
		padding: 4px 20px;
		border: none;
		background: transparent;
		color: rgba(255, 255, 255, 0.55);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.mode-btn:hover:not(.active) {
		color: rgba(255, 255, 255, 0.8);
		background: rgba(255, 255, 255, 0.05);
	}

	.mode-btn.active {
		background: var(--color-primary);
		color: #fff;
		box-shadow: 0 1px 4px rgba(0, 123, 255, 0.3);
	}
</style>

