/**
 * Game Store - Compatibility Layer
 * Re-exports from gameStore.ts and gameActions.ts for backward compatibility
 */

// Re-export all state stores
export {
	game,
	players,
	turnCount,
	isStart,
	currentWindScenario,
	currentWind,
	previousWind,
	gameWidth,
	gameHeight,
	marks
} from './gameStore';

// Re-export all actions
export { gameActions } from './gameActions';
