<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import WindSelector from '$lib/components/controls/WindSelector.svelte';
	import SettingsPanel from '$lib/components/controls/SettingsPanel.svelte';
	import PlayerControl from '$lib/components/controls/PlayerControl.svelte';
	import { players, gameActions, game, isStart, turnCount } from '$lib/stores/game';
	import HelpModal from '$lib/components/modals/HelpModal.svelte';
	import { logger } from '$lib/infrastructure/logging/logger';

	let showHelpModal = false;

	function handleAddPlayer() {
		if (!$game) {
			logger.warn('Cannot add player: no game exists. Please select a wind scenario first.', 'LeftSidebar');
			return;
		}
		try {
			gameActions.addPlayer();
		} catch (error) {
			logger.error(
				'Failed to add player',
				error instanceof Error ? error : new Error(String(error)),
				'LeftSidebar'
			);
			alert('Failed to add player. Please check the console for details.');
		}
	}

	function handleAddAIPlayer(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
		if (!$game) {
			logger.warn('Cannot add AI player: no game exists. Please select a wind scenario first.', 'LeftSidebar');
			return;
		}
		try {
			gameActions.addAIPlayer(difficulty);
		} catch (error) {
			logger.error(
				'Failed to add AI player',
				error instanceof Error ? error : new Error(String(error)),
				'LeftSidebar'
			);
			alert('Failed to add AI player. Please check the console for details.');
		}
	}

	function handleStartRace() {
		if (!$game) {
			logger.warn('Cannot start race: no game exists.', 'LeftSidebar');
			return;
		}
		try {
			gameActions.startRace();
			logger.info('Race started from sidebar', 'LeftSidebar');
		} catch (error) {
			logger.error(
				'Failed to start race',
				error instanceof Error ? error : new Error(String(error)),
				'LeftSidebar'
			);
			alert('Failed to start race. Please check the console for details.');
		}
	}

	function handleTurn() {
		gameActions.turn();
	}

	function handleBackTurn() {
		gameActions.backTurn();
	}
</script>

<div class="sidebar sidebar-left">
	<div class="sidebar-content">
		<!-- Sidebar Header -->
		<div class="sidebar-header">
			<h2 class="sidebar-title">Tactical Sailing Simulator</h2>
			<button
				class="btn btn-sm btn-outline-secondary"
				on:click={() => (showHelpModal = true)}
				aria-label="Open help"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					fill="currentColor"
					viewBox="0 0 16 16"
				>
					<path
						d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
					/>
					<path
						d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.196-.9.324-1.176.787-1.176 1.54v.111H7.82c0-.596.145-1.02.8-1.32.655-.31 1.354-.495 1.354-1.338 0-1.072-.92-1.744-2.143-1.744-1.22 0-2.18.747-2.18 1.713 0 .688.482.976 1.102 1.165l.803.211c.918.238 1.466.86 1.466 1.853v.111h-1.11v-.111c0-.478-.245-.84-.727-1.047l-.803-.21c-.884-.23-1.4-.892-1.4-1.792 0-1.163.956-2.03 2.18-2.03 1.22 0 2.143.867 2.143 2.03 0 .712-.29 1.304-.787 1.653h-.002z"
					/>
				</svg>
				Help
			</button>
		</div>

		<!-- Wind Selector Section -->
		<div class="sidebar-section">
			<WindSelector />
		</div>

		<!-- Player Controls Section -->
		<div class="sidebar-section">
			<div class="d-flex justify-content-between align-items-center mb-2">
				<h3 class="section-title mb-0">Players</h3>
				<div class="btn-group" role="group">
					<button
						class="btn btn-sm btn-outline-primary"
						on:click={handleAddPlayer}
						title="Add Human Player"
						aria-label="Add new human player"
						disabled={!$game}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							fill="currentColor"
							viewBox="0 0 16 16"
						>
							<path
								d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"
							/>
						</svg>
						Add
					</button>
					<button
						class="btn btn-sm btn-outline-success"
						on:click={() => handleAddAIPlayer('medium')}
						title="Add AI Player (Medium difficulty)"
						aria-label="Add new AI player"
						disabled={!$game}
					>
						🤖 AI
					</button>
				</div>
			</div>
			{#if !$game}
				<p class="text-muted small mb-2">
					<strong>No game started.</strong><br />
					Select a wind scenario above to create a game.
				</p>
			{:else if $players.length === 0}
				<p class="text-muted small mb-2">No players yet. Click "Add" to add players.</p>
			{:else}
				{#each $players as player, playerIndex}
					<PlayerControl {player} {playerIndex} />
				{/each}
			{/if}

			<!-- Game Actions Section - Below Player List -->
			{#if $game}
				<div class="mt-3">
					{#if $isStart}
						<button class="btn btn-primary btn-lg w-100" on:click={handleStartRace}>
							Start Race
						</button>
					{:else}
						<div class="action-buttons">
							<button
								class="btn btn-secondary"
								on:click={handleBackTurn}
								disabled={$turnCount === 0}
							>
								← Back
							</button>
							<button class="btn btn-primary" on:click={handleTurn}>
								Next Turn →
							</button>
						</div>
						<div class="turn-counter text-center mt-2">
							<span class="text-muted">Turn:</span>
							<strong>{$turnCount}</strong>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Settings Section -->
		<div class="sidebar-section">
			<SettingsPanel />
		</div>
	</div>
</div>

<HelpModal bind:isOpen={showHelpModal} />

<style>
	.sidebar-section {
		margin-bottom: var(--spacing-lg);
	}

	.section-title {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
	}

	.action-buttons {
		display: flex;
		gap: var(--spacing-sm);
		width: 100%;
	}

	.action-buttons .btn {
		flex: 1;
	}

	.turn-counter {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>

