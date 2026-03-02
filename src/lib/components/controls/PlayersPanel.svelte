<script lang="ts">
	import PlayerControl from './PlayerControl.svelte';
	import { players, gameActions, game, isStart, turnCount } from '$lib/stores/game';
	import { logger } from '$lib/infrastructure/logging/logger';

	function handleAddPlayer() {
		if (!$game) {
			logger.warn('Cannot add player: no game exists.', 'PlayersPanel');
			return;
		}
		try {
			gameActions.addPlayer();
		} catch (error) {
			logger.error('Failed to add player', error instanceof Error ? error : new Error(String(error)), 'PlayersPanel');
			alert('Failed to add player. Please check the console for details.');
		}
	}

	function handleAddAIPlayer(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
		if (!$game) {
			logger.warn('Cannot add AI player: no game exists.', 'PlayersPanel');
			return;
		}
		try {
			gameActions.addAIPlayer(difficulty);
		} catch (error) {
			logger.error('Failed to add AI player', error instanceof Error ? error : new Error(String(error)), 'PlayersPanel');
			alert('Failed to add AI player. Please check the console for details.');
		}
	}

	function handleStartRace() {
		if (!$game) return;
		try {
			gameActions.startRace();
			logger.info('Race started', 'PlayersPanel');
		} catch (error) {
			logger.error('Failed to start race', error instanceof Error ? error : new Error(String(error)), 'PlayersPanel');
			alert('Failed to start race. Please check the console for details.');
		}
	}
</script>

<div class="players-panel">
	<div class="player-actions-row">
		<div class="btn-group" role="group">
			<button
				class="panel-btn panel-btn-primary"
				on:click={handleAddPlayer}
				title="Add Human Player"
				disabled={!$game}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
					<path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
				</svg>
				Add
			</button>
			<button
				class="panel-btn panel-btn-success"
				on:click={() => handleAddAIPlayer('medium')}
				title="Add AI Player (Medium)"
				disabled={!$game}
			>
				AI
			</button>
		</div>
	</div>

	{#if !$game}
		<p class="panel-hint">Select a wind scenario above to start.</p>
	{:else if $players.length === 0}
		<p class="panel-hint">No players yet. Click "Add" to add players.</p>
	{:else}
		{#each $players as player, playerIndex}
			<PlayerControl {player} {playerIndex} />
		{/each}
	{/if}

	{#if $game}
		<div class="game-actions">
			{#if $isStart}
				<button class="panel-btn panel-btn-primary full-width" on:click={handleStartRace}>
					Start Race
				</button>
			{:else}
				<div class="action-buttons">
					<button
						class="panel-btn panel-btn-secondary"
						on:click={() => gameActions.backTurn()}
						disabled={$turnCount === 0}
					>
						Back
					</button>
					<button class="panel-btn panel-btn-primary" on:click={() => gameActions.turn()}>
						Next Turn
					</button>
				</div>
				<div class="turn-counter">
					<span>Turn:</span>
					<strong>{$turnCount}</strong>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.players-panel {
		width: 100%;
	}

	.player-actions-row {
		display: flex;
		justify-content: flex-start;
		margin-bottom: 8px;
	}

	.btn-group {
		display: flex;
		gap: 4px;
	}

	.panel-hint {
		font-size: 11px;
		color: var(--color-text-secondary);
		margin: 0 0 8px 0;
		line-height: 1.4;
	}

	.game-actions {
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid var(--color-border-light);
	}

	.action-buttons {
		display: flex;
		gap: 6px;
		width: 100%;
	}

	.action-buttons .panel-btn {
		flex: 1;
	}

	.turn-counter {
		font-size: 11px;
		color: var(--color-text-secondary);
		text-align: center;
		margin-top: 6px;
	}

	.panel-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 5px 12px;
		font-size: 11px;
		font-weight: 600;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border-medium);
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.panel-btn:hover:not(:disabled) {
		background: var(--color-bg-tertiary);
	}

	.panel-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.panel-btn-primary {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}

	.panel-btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.panel-btn-secondary {
		background: var(--color-bg-secondary);
		border-color: var(--color-border-medium);
		color: var(--color-text-primary);
	}

	.panel-btn-success {
		background: transparent;
		border-color: var(--color-success);
		color: var(--color-success);
	}

	.panel-btn-success:hover:not(:disabled) {
		background: rgba(40, 167, 69, 0.08);
	}

	.full-width {
		width: 100%;
	}
</style>
