<script lang="ts">
	import WindSelector from '$lib/components/controls/WindSelector.svelte';
	import PlayerControl from '$lib/components/controls/PlayerControl.svelte';
	import { players, gameActions, game, isStart, turnCount } from '$lib/stores/game';
	import HelpModal from '$lib/components/modals/HelpModal.svelte';
	import SettingsModal from '$lib/components/modals/SettingsModal.svelte';
	import { logger } from '$lib/infrastructure/logging/logger';

	let showHelpModal = false;
	let showSettingsModal = false;

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
			<div class="header-buttons">
				<button
					class="btn btn-sm btn-outline-secondary"
					on:click={() => (showSettingsModal = true)}
					aria-label="Open settings"
					title="Settings"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						fill="currentColor"
						viewBox="0 0 16 16"
					>
						<path
							d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"
						/>
						<path
							d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.292-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.292c.415.764-.42 1.6-1.185 1.184l-.292-.159a1.873 1.873 0 0 0-2.692 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.693-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.292A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"
						/>
					</svg>
				</button>
				<button
					class="btn btn-sm btn-outline-secondary"
					on:click={() => (showHelpModal = true)}
					aria-label="Open help"
					title="Help"
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
				</button>
			</div>
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

	</div>
</div>

<SettingsModal bind:isOpen={showSettingsModal} />
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

	.header-buttons {
		display: flex;
		gap: var(--spacing-xs);
	}

	.header-buttons .btn {
		padding: 0.25rem 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-buttons .btn svg {
		margin: 0;
	}
</style>

