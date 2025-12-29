<script lang="ts">
	import type { Boat } from '$lib/types/boat';
	import { TurnType } from '$lib/types/game';
	import { gameActions, isStart } from '$lib/stores/game';

	export let player: Boat;
	export let playerIndex: number;

	let playerName: string = player.name || '';
	let selectedTurn: TurnType = player.turntype || TurnType.Forward;

	// Update local state when player changes
	$: if (player) {
		playerName = player.name || '';
		selectedTurn = player.turntype || TurnType.Forward;
	}

	function handleNameChange() {
		player.name = playerName || `Player ${playerIndex + 1}`;
	}

	// Update player name reactively
	$: if (playerName !== player.name) {
		player.name = playerName || `Player ${playerIndex + 1}`;
	}

	function handleTurnChange(turnType: TurnType) {
		console.log(
			`[PLAYER CONTROL] Boat: ${player.name || `Player ${playerIndex + 1}`}, Turn change: ${TurnType[turnType]}`
		);
		console.log(
			`  Current state: tack=${player.tack}, rotation=${player.rotation.toFixed(1)}°, turntype=${TurnType[player.turntype]}`
		);
		console.log(`  New turntype: ${TurnType[turnType]}`);

		selectedTurn = turnType;
		player.turntype = turnType;

		console.log(`  After update: turntype=${TurnType[player.turntype]}`);
		console.log(`  Player object turntype property is now: ${TurnType[player.turntype]}`);
	}

	function handleDelete() {
		gameActions.removePlayer(playerIndex);
	}

	function handleToggleAI() {
		if (player.isAI) {
			gameActions.toggleAIPlayer(playerIndex);
		} else {
			// Convert to AI with medium difficulty
			gameActions.toggleAIPlayer(playerIndex, 'medium');
		}
	}

	function formatFinishTime(time: number): string {
		const min = Math.floor(time / 60);
		const sec = Math.floor(time % 60);
		return `${min}:${Math.floor(sec / 10)}${Math.floor(sec % 10)}`;
	}
</script>

<div class="player-control-group compact" class:finished={player.finished !== false}>
	{#if $isStart}
		<!-- Start Phase Controls - Compact -->
		<div class="input-group my-1 start-controls compact-controls">
			<span class="input-group-text">
				<div class="pn-control-color" style="background-color: {player.color};"></div>
			</span>

			<input
				type="text"
				class="form-control"
				class:ai-player={player.isAI}
				placeholder="Name"
				bind:value={playerName}
				on:blur={handleNameChange}
				disabled={player.isAI}
			/>

			{#if player.isAI}
				<span class="input-group-text ai-badge" title="AI Player ({player.aiDifficulty || 'medium'})">
					🤖
				</span>
			{/if}

			<button
				class="btn btn-outline-secondary toggle-ai-btn"
				type="button"
				on:click={handleToggleAI}
				title={player.isAI ? 'Convert to Human Player' : 'Convert to AI Player'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					fill="currentColor"
					viewBox="0 0 16 16"
				>
					{#if player.isAI}
						<path
							d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
						/>
						<path
							d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 2.923 4.863a.75.75 0 0 1 1.06-1.061l3.494 3.493 3.494-3.493a.75.75 0 0 1 1.06 1.06z"
						/>
					{:else}
						<path
							d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
						/>
						<path
							d="M5.03 11.03a.75.75 0 0 1-1.06-1.06l3.494-3.494L4.97 3.47a.75.75 0 0 1 1.06-1.06l3.494 3.494L13.03 2.47a.75.75 0 0 1 1.06 1.06L10.596 7.03l3.494 3.494a.75.75 0 1 1-1.06 1.06L9.536 8.09 5.03 11.03z"
						/>
					{/if}
				</svg>
			</button>

			<button
				class="btn btn-outline-danger delete-btn"
				type="button"
				on:click={handleDelete}
				title="Delete Player: Remove this player from the game"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					fill="currentColor"
					viewBox="0 0 16 16"
				>
					<path
						d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"
					/>
				</svg>
			</button>
		</div>
	{:else}
		<!-- Race Phase Controls - Compact -->
		<div
			class="input-group my-1 race-controls compact-controls"
			data-current-tack={player.tack ? 'port' : 'starboard'}
		>
			<span class="input-group-text">
				<div class="pn-control-color" style="background-color: {player.color};"></div>
			</span>

			<div class="col-form-label border col name-input small-text" class:ai-player={player.isAI}>
				<strong>{player.name || `P${playerIndex + 1}`}</strong>
				{#if player.isAI}
					<span class="ai-badge-small" title="AI Player ({player.aiDifficulty || 'medium'})">🤖</span>
				{/if}
			</div>

			<!-- Turn Selection Radio Buttons -->
			<div class="btn-group" role="group" class:disabled={player.isAI}>
				<!-- Forward Button -->
				<input
					type="radio"
					class="btn-check"
					id="forward-{playerIndex}"
					name="turn-{playerIndex}"
					checked={selectedTurn === TurnType.Forward}
					on:change={() => handleTurnChange(TurnType.Forward)}
				/>
				<label
					class="btn btn-outline-primary label-control {player.tack
						? 'port-forward-btn'
						: 'starboard-forward-btn'}"
					for="forward-{playerIndex}"
					title="Forward: Continue sailing on current tack, adjusting to wind shifts"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon-sm"
						viewBox="0 0 16 16"
						style="width: 16px; height: 16px;"
					>
						{#if player.tack}
							<!-- Port Forward -->
							<polyline
								points="2,14 14,2"
								fill="none"
								stroke="currentColor"
								stroke-linejoin="miter"
								stroke-width="1.7"
							/>
							<polyline
								points="13,8 14,2 8,3"
								fill="none"
								stroke="currentColor"
								stroke-linejoin="miter"
								stroke-linecap="round"
								stroke-width="1.7"
							/>
							<ellipse rx="1.8" ry="1.8" cx="2" cy="14" fill="currentColor" />
						{:else}
							<!-- Starboard Forward -->
							<polyline
								points="14,14 2,2"
								fill="none"
								stroke="currentColor"
								stroke-linejoin="miter"
								stroke-width="1.7"
							/>
							<polyline
								points="3,8 2,2 8,3"
								fill="none"
								stroke="currentColor"
								stroke-linejoin="miter"
								stroke-linecap="round"
								stroke-width="1.7"
							/>
							<ellipse rx="1.8" ry="1.8" cx="14" cy="14" fill="currentColor" />
						{/if}
					</svg>
				</label>

				<!-- Tack Button -->
				<input
					type="radio"
					class="btn-check"
					id="tack-{playerIndex}"
					name="turn-{playerIndex}"
					checked={selectedTurn === TurnType.Tack}
					on:change={() => handleTurnChange(TurnType.Tack)}
				/>
				<label
					class="btn btn-outline-primary label-control {player.tack
						? 'port-tack-btn'
						: 'starboard-tack-btn'}"
					for="tack-{playerIndex}"
					title="Tack: Change direction by turning through the wind (port ↔ starboard)"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon-sm"
						viewBox="0 0 16 16"
						style="width: 16px; height: 16px;"
					>
						{#if player.tack}
							<!-- Port Tack -->
							<polyline
								points="8,14 14,8 8,2"
								fill="none"
								stroke="currentColor"
								stroke-linejoin="miter"
								stroke-width="1.7"
							/>
							<polyline
								points="8,7 7,1 13,2"
								fill="none"
								stroke="currentColor"
								stroke-linejoin="miter"
								stroke-linecap="round"
								stroke-width="1.7"
							/>
							<ellipse rx="1.8" ry="1.8" cx="8" cy="14" fill="currentColor" />
						{:else}
							<!-- Starboard Tack -->
							<polyline
								points="8,14 2,8 8,2"
								fill="none"
								stroke="currentColor"
								stroke-linejoin="miter"
								stroke-width="1.7"
							/>
							<polyline
								points="8,7 9,1 3,2"
								fill="none"
								stroke="currentColor"
								stroke-linejoin="miter"
								stroke-linecap="round"
								stroke-width="1.7"
							/>
							<ellipse rx="1.8" ry="1.8" cx="8" cy="14" fill="currentColor" />
						{/if}
					</svg>
				</label>

				<!-- To Mark Button -->
				<input
					type="radio"
					class="btn-check"
					id="tomark-{playerIndex}"
					name="turn-{playerIndex}"
					checked={selectedTurn === TurnType.ToMark}
					on:change={() => handleTurnChange(TurnType.ToMark)}
				/>
				<label
					class="btn btn-outline-primary label-control"
					for="tomark-{playerIndex}"
					title="To Mark: Head directly toward the windward mark (when near layline)"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon-lg"
						viewBox="0 0 16 16"
						style="width: 20px; height: 20px;"
					>
						<ellipse rx="3" ry="3" cx="4" cy="7" stroke="currentColor" stroke-width="1" fill="none"
						></ellipse>
						<ellipse rx="1" ry="1" cx="4" cy="7" fill="currentColor"></ellipse>
						<path
							fill-rule="evenodd"
							fill="currentColor"
							stroke="currentColor"
							transform="translate(7, 11.5) rotate(-75) scale(0.5)"
							d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"
						/>
					</svg>
				</label>
			</div>
		</div>

		<!-- Finish Controls (if finished) -->
		{#if player.finished !== false}
			<div class="input-group my-1 finish-controls">
				<span class="input-group-text">
					<div class="pn-control-color" style="background-color: {player.color};"></div>
				</span>

				<div class="col-form-label border col name-input">
					{player.name || `Player ${playerIndex + 1}`}
				</div>

				<span class="input-group-text">
					<div class="pn-control-finish-time">
						{formatFinishTime(player.finished)}
					</div>
				</span>
			</div>
		{/if}
	{/if}
</div>

<style>
	.player-control-group {
		margin-bottom: 0.5rem;
	}

	.player-control-group.compact {
		margin-bottom: 0.35rem;
	}

	.player-control-group.finished {
		opacity: 0.6;
	}

	.ai-player {
		background-color: rgba(40, 167, 69, 0.1);
		font-style: italic;
	}

	.ai-badge {
		background-color: rgba(40, 167, 69, 0.2);
		font-size: 0.9rem;
		padding: 0.25rem 0.5rem;
	}

	.ai-badge-small {
		font-size: 0.75rem;
		margin-left: 0.25rem;
		opacity: 0.7;
	}

	.name-input.ai-player {
		background-color: rgba(40, 167, 69, 0.1);
	}

	.btn-group.disabled {
		pointer-events: none;
		opacity: 0.6;
	}

	.toggle-ai-btn {
		padding: 0.25rem 0.5rem;
	}

	.compact-controls {
		font-size: 0.85rem;
	}

	.pn-control-color {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 1px solid #fff;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
	}

	.compact-controls .pn-control-color {
		width: 14px;
		height: 14px;
	}

	.name-input {
		font-size: 0.85rem;
		min-width: 80px;
		text-align: left;
		padding: 0.3rem 0.5rem;
	}

	.name-input.small-text {
		font-size: 0.8rem;
		padding: 0.25rem 0.4rem;
	}

	.icon-sm {
		width: 14px;
		height: 14px;
	}

	.icon-lg {
		width: 18px;
		height: 18px;
	}

	.pn-control-finish-time {
		font-weight: 600;
		color: #28a745;
		font-size: 0.85rem;
	}

	.delete-btn {
		padding: 0.3rem 0.4rem;
		font-size: 0.85rem;
	}

	.label-control {
		padding: 0.3rem 0.4rem;
		min-width: 36px;
		font-size: 0.85rem;
	}

	.compact-controls .label-control {
		padding: 0.25rem 0.35rem;
		min-width: 32px;
	}

	.race-controls[data-current-tack='port'] .port-forward-btn,
	.race-controls[data-current-tack='port'] .port-tack-btn {
		border-color: #0d6efd;
		background-color: rgba(13, 110, 253, 0.1);
	}

	.race-controls[data-current-tack='starboard'] .starboard-forward-btn,
	.race-controls[data-current-tack='starboard'] .starboard-tack-btn {
		border-color: #0d6efd;
		background-color: rgba(13, 110, 253, 0.1);
	}
</style>
