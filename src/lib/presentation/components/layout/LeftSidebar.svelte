<script lang="ts">
	import WindSelector from '$lib/components/controls/WindSelector.svelte';
	import PlayerControl from '$lib/components/controls/PlayerControl.svelte';
	import { players, gameActions, game, isStart, turnCount } from '$lib/stores/game';
	import ImportPanel from '$lib/components/replay/ImportPanel.svelte';
	import WindInput from '$lib/components/replay/WindInput.svelte';
	import CourseMarksPanel from '$lib/components/replay/CourseMarksPanel.svelte';
	import { appMode, session } from '$lib/stores/session';
	import { logger } from '$lib/infrastructure/logging/logger';

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
			<h2 class="sidebar-title">{$appMode === 'replay' ? 'Replay' : 'Simulation'}</h2>
		</div>

		{#if $appMode === 'replay'}
			<!-- GPX Replay Section -->
			<div class="sidebar-section">
				<h3 class="section-title">GPX Replay</h3>
				<ImportPanel />
			</div>

			{#if $session}
				<div class="sidebar-section">
					<CourseMarksPanel />
				</div>
				<div class="sidebar-section">
					<WindInput />
				</div>
			{/if}
		{:else}
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
		{/if}

	</div>
</div>

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

