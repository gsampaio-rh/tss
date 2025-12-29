<script lang="ts">
	import { windScenarios, selectedWindIndex, selectedWind, windActions } from '$lib/stores/wind';
	import { gameActions, game } from '$lib/stores/game';
	import { get } from 'svelte/store';
	import type { WindScenario } from '$lib/types/wind';
	import WindEditor from '../modals/WindEditor.svelte';
	import { logger } from '$lib/infrastructure/logging/logger';
	import { onMount } from 'svelte';

	// Group scenarios by type for optgroup display
	// Store index with each scenario for selection
	interface ScenarioWithIndex extends WindScenario {
		_index: number;
	}

	$: groupedScenarios = (() => {
		logger.debug(
			'[WindSelector] Grouping scenarios',
			'WindSelector',
			{ 
				totalScenarios: $windScenarios.length,
				scenarios: $windScenarios.map(s => ({ name: s.name, type: s.type }))
			}
		);
		const groups: Record<string, ScenarioWithIndex[]> = {};
		$windScenarios.forEach((scenario, index) => {
			const type = scenario.type || 'Other';
			if (!groups[type]) {
				groups[type] = [];
			}
			groups[type].push({ ...scenario, _index: index } as ScenarioWithIndex);
		});
		logger.debug(
			'[WindSelector] Grouped scenarios',
			'WindSelector',
			{ 
				groups: Object.keys(groups),
				totalGroups: Object.keys(groups).length
			}
		);
		return groups;
	})();

	// Get display name (use name_ru if available and language is Russian, otherwise use name)
	// For now, defaulting to English - can be extended with i18n later
	function getDisplayName(scenario: WindScenario): string {
		// TODO: Add language detection/store
		return scenario.name || 'Unnamed';
	}

	function handleWindChange() {
		logger.info(
			'[WindSelector] handleWindChange called',
			'WindSelector',
			{ 
				currentIndex, 
				selectedWindIndex: $selectedWindIndex,
				totalScenarios: $windScenarios.length 
			}
		);
		
		// currentIndex is already bound and updated by Svelte
		const index = currentIndex;
		logger.debug('[WindSelector] Parsed index', 'WindSelector', { index, isNaN: isNaN(index) });
		
		if (!isNaN(index) && index >= 0 && index < $windScenarios.length) {
			const scenario = $windScenarios[index];
			logger.info(
				'[WindSelector] Wind scenario selected',
				'WindSelector',
				{ 
					index, 
					scenarioName: scenario.name,
					scenarioType: scenario.type,
					scenarioWidth: scenario.width,
					scenarioHeight: scenario.height,
					windValues: scenario.wind,
					isRandom: scenario.israndom
				}
			);

			try {
				logger.debug('[WindSelector] Calling windActions.selectWind', 'WindSelector', { index });
				windActions.selectWind(index);
				logger.debug('[WindSelector] windActions.selectWind completed', 'WindSelector');
				
				// Check if game exists
				const currentGame = get(game);
				logger.debug(
					'[WindSelector] Current game state',
					'WindSelector',
					{ 
						gameExists: !!currentGame,
						gameName: currentGame?.name,
						gamePlayers: currentGame?.players?.length
					}
				);
				
				// If no game exists, create one with default player count
				if (!currentGame) {
					const defaultPlayerCount = 2; // Default to 2 players
					logger.info(
						'[WindSelector] No game exists, creating new game',
						'WindSelector',
						{ 
							scenario: scenario.name, 
							playerCount: defaultPlayerCount 
						}
					);
					gameActions.createGame(defaultPlayerCount, scenario);
					logger.info(
						'[WindSelector] Game creation completed',
						'WindSelector',
						{ scenario: scenario.name }
					);
					
					// Verify game was created
					const verifyGame = get(game);
					logger.debug(
						'[WindSelector] Game verification',
						'WindSelector',
						{ 
							gameCreated: !!verifyGame,
							gameName: verifyGame?.name,
							playersCount: verifyGame?.players?.length
						}
					);
				} else {
					// Update game with new wind scenario
					logger.info(
						'[WindSelector] Game exists, updating wind scenario',
						'WindSelector',
						{ 
							scenario: scenario.name,
							currentGameName: currentGame.name
						}
					);
					gameActions.changeWind(scenario);
					logger.debug('[WindSelector] Wind scenario updated', 'WindSelector');
				}
			} catch (error) {
				logger.error(
					'[WindSelector] Failed to handle wind change',
					error instanceof Error ? error : new Error(String(error)),
					'WindSelector',
					{ 
						scenarioIndex: index, 
						scenarioName: scenario.name
					}
				);
				console.error('[WindSelector] Error details:', error);
				alert(`Failed to create/update game: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
			}
		} else {
			logger.warn(
				'[WindSelector] Invalid wind scenario index',
				'WindSelector',
				{ 
					index, 
					totalScenarios: $windScenarios.length,
					isNaN: isNaN(index),
					isNegative: index < 0,
					isOutOfBounds: index >= $windScenarios.length
				}
			);
		}
	}

	// Track selected index for the select element
	// Initialize with selectedWindIndex, default to 0 if no selection
	let currentIndex: number = $selectedWindIndex ?? 0;
	let previousIndex: number = currentIndex;
	let isInitialMount = true;
	
	$: {
		if ($selectedWindIndex !== undefined && $selectedWindIndex !== currentIndex) {
			logger.debug(
				'[WindSelector] Updating currentIndex from selectedWindIndex',
				'WindSelector',
				{ 
					oldIndex: currentIndex, 
					newIndex: $selectedWindIndex 
				}
			);
			currentIndex = $selectedWindIndex;
		}
	}
	
	// Log when scenarios change
	$: {
		logger.debug(
			'[WindSelector] Wind scenarios updated',
			'WindSelector',
			{ 
				count: $windScenarios.length,
				selectedIndex: $selectedWindIndex,
				currentIndex,
				scenarios: $windScenarios.map(s => s.name)
			}
		);
	}
	
	// Watch for currentIndex changes and trigger game creation if needed
	$: if (!isInitialMount && currentIndex !== previousIndex && $windScenarios.length > 0 && currentIndex >= 0 && currentIndex < $windScenarios.length) {
		logger.info(
			'[WindSelector] currentIndex changed reactively',
			'WindSelector',
			{
				previousIndex,
				newIndex: currentIndex,
				scenariosLoaded: $windScenarios.length > 0
			}
		);
		previousIndex = currentIndex;
		// Call handleWindChange to create/update game
		handleWindChange();
	}
	
	// Log when component mounts
	onMount(() => {
		logger.info(
			'[WindSelector] Component mounted',
			'WindSelector',
			{
				initialScenariosCount: $windScenarios.length,
				initialSelectedIndex: $selectedWindIndex,
				initialCurrentIndex: currentIndex,
				hasGame: !!get(game)
			}
		);
		previousIndex = currentIndex;
		
		// If scenarios are already loaded and no game exists, create one with the default scenario
		if ($windScenarios.length > 0 && !get(game)) {
			logger.info(
				'[WindSelector] Scenarios loaded on mount, creating initial game',
				'WindSelector',
				{
					defaultScenarioIndex: $selectedWindIndex,
					defaultScenarioName: $windScenarios[$selectedWindIndex]?.name
				}
			);
			// Small delay to ensure all stores are initialized
			setTimeout(() => {
				if ($windScenarios.length > 0 && !get(game)) {
					const defaultIndex = $selectedWindIndex >= 0 ? $selectedWindIndex : 0;
					const scenario = $windScenarios[defaultIndex];
					if (scenario) {
						logger.info(
							'[WindSelector] Creating game with default scenario on mount',
							'WindSelector',
							{
								scenarioName: scenario.name,
								scenarioIndex: defaultIndex
							}
						);
						gameActions.createGame(2, scenario);
					}
				}
			}, 100);
		}
	});

	// Wind editor modal state
	let windEditorOpen = false;
	let windEditorIsCreate = false;

	function handleEdit() {
		windEditorIsCreate = false;
		windEditorOpen = true;
	}

	function handleAdd() {
		windEditorIsCreate = true;
		windEditorOpen = true;
	}

	function handleManage() {
		// For now, just open edit mode
		// TODO: Create separate WindManager modal if needed
		handleEdit();
	}
</script>

<div class="wind-selector compact">
	<div class="input-group">
		<select
			class="form-select"
			bind:value={currentIndex}
			on:change={handleWindChange}
			aria-label="Select wind scenario"
		>
			{#each Object.entries(groupedScenarios) as [type, scenarios]}
				<optgroup label={type}>
					{#each scenarios as scenario}
						<option value={scenario._index}>
							{getDisplayName(scenario)}
						</option>
					{/each}
				</optgroup>
			{/each}
		</select>

		<!-- Manage Winds Button -->
		<button
			class="btn btn-outline-primary"
			type="button"
			on:click={handleManage}
			title="Manage Winds"
			aria-label="Manage wind scenarios"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				fill="currentColor"
				class="bi bi-card-list"
				viewBox="0 0 16 16"
			>
				<path
					d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"
				/>
				<path
					d="M5 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 5 8zm0-2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-1-5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM4 8a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm0 2.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"
				/>
			</svg>
		</button>

		<!-- Edit Wind Button -->
		<button
			class="btn btn-outline-primary"
			type="button"
			on:click={handleEdit}
			title="Edit wind scenario"
			aria-label="Edit current wind scenario"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				fill="currentColor"
				class="bi bi-pencil-square"
				viewBox="0 0 16 16"
			>
				<path
					d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"
				/>
				<path
					fill-rule="evenodd"
					d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
				/>
			</svg>
		</button>

		<!-- Add Wind Button -->
		<button
			class="btn btn-outline-primary"
			type="button"
			on:click={handleAdd}
			title="Add custom wind scenario"
			aria-label="Add new wind scenario"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				fill="currentColor"
				style="transform: scale(1.3);"
				class="bi bi-plus"
				viewBox="0 0 16 16"
			>
				<path
					d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"
				/>
			</svg>
		</button>
	</div>

	<!-- Wind Editor Modal -->
	<WindEditor bind:isOpen={windEditorOpen} isCreate={windEditorIsCreate} />
</div>

<style>
	.wind-selector {
		width: 100%;
	}

	.wind-selector .input-group {
		display: flex;
		flex-wrap: nowrap;
	}

	.wind-selector select {
		flex: 1;
		min-width: 0;
	}

	.wind-selector button {
		flex-shrink: 0;
		padding: 0.35rem 0.5rem;
		font-size: 0.85rem;
	}

	.wind-selector.compact {
		margin-bottom: 0.5rem;
	}

	.wind-selector.compact select {
		font-size: 0.9rem;
		padding: 0.35rem 0.5rem;
	}
</style>
