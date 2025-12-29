/**
 * Canvas Renderer
 * 
 * Handles canvas scaling and positioning logic for the game area.
 * Separates rendering concerns from component lifecycle.
 */

import { GRID_SIZE } from '$lib/types/game';
import { formatCssPx } from '$lib/utils/cssFormat';

export interface GameDimensions {
	width: number;
	height: number;
}

export interface ContainerDimensions {
	width: number;
	height: number;
}

export interface RenderResult {
	width: string;
	height: string;
	transform: string;
	transformOrigin: string;
}

/**
 * Calculate game area dimensions and scaling
 */
export function calculateGameAreaSize(
	game: GameDimensions,
	container: ContainerDimensions
): RenderResult | null {
	const w = container.width;
	const h = container.height;

	if (w === 0 || h === 0) return null; // Container not sized yet

	// Game area should have the actual game size in pixels
	const gameWidthPx = game.width * GRID_SIZE;
	const gameHeightPx = game.height * GRID_SIZE;

	// Calculate scale to fit within container
	const scaleX = w / gameWidthPx;
	const scaleY = h / gameHeightPx;

	// Use the smaller scale to ensure content fits completely within container
	// This prevents overflow-x into sidebars
	const scale = Math.min(scaleX, scaleY);

	// Center the game-area within the container
	const scaledWidth = gameWidthPx * scale;
	const scaledHeight = gameHeightPx * scale;
	const left = (w - scaledWidth) / 2;
	const top = (h - scaledHeight) / 2;

	return {
		width: formatCssPx(gameWidthPx),
		height: formatCssPx(gameHeightPx),
		transform: `translate(${left}px, ${top}px) scale(${scale})`,
		transformOrigin: 'top left'
	};
}

/**
 * Render game area size to DOM element
 */
export function renderGameAreaSize(
	gameArea: HTMLElement,
	game: GameDimensions,
	container: HTMLElement
): void {
	const result = calculateGameAreaSize(game, {
		width: container.clientWidth,
		height: container.clientHeight
	});

	if (!result) return;

	gameArea.style.width = result.width;
	gameArea.style.height = result.height;
	gameArea.style.transform = result.transform;
	gameArea.style.transformOrigin = result.transformOrigin;
}

