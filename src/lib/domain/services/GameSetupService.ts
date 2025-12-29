/**
 * Game Setup Service
 * Handles game initialization and boat placement logic
 */

import { Position } from '../value-objects/Position';
import type { Boat } from '../../types/boat';
import { MarkEntity } from '../entities/Mark';
import { MarkType } from '../../types/game';

export class GameSetupService {
	/**
	 * Calculate required start line size based on number of boats
	 * Ensures adequate spacing for all boats
	 */
	static calculateRequiredStartLineSize(boatCount: number, baseStartSize: number = 15): number {
		if (boatCount === 0) {
			return baseStartSize;
		}

		// Spacing constants
		const BOAT_SPACING = 2.5;
		const EDGE_OFFSET = 1.5;
		const MIN_MARGIN = 2.0; // Minimum margin from game edges

		// Calculate space needed for boats
		// Worst case: all boats in one section (left, middle, or right)
		// Space = edge offset + (boats - 1) * spacing + edge offset
		const spaceNeeded = EDGE_OFFSET + (boatCount - 1) * BOAT_SPACING + EDGE_OFFSET + MIN_MARGIN * 2;

		// Use the larger of: base size or calculated required size
		return Math.max(baseStartSize, spaceNeeded);
	}

	/**
	 * Update start marks to accommodate the required number of boats
	 */
	static updateStartMarks(
		marks: MarkEntity[],
		boatCount: number,
		gameWidth: number,
		gameHeight: number,
		baseStartSize: number = 15
	): MarkEntity[] {
		if (marks.length < 2) {
			return marks; // Can't update without start marks
		}

		const requiredStartSize = this.calculateRequiredStartLineSize(boatCount, baseStartSize);
		
		// Ensure start line doesn't exceed game width (with margins)
		const maxStartSize = gameWidth - 4; // Leave 2 units margin on each side
		const actualStartSize = Math.min(requiredStartSize, maxStartSize);

		// Calculate new mark positions (centered)
		const leftX = (gameWidth - actualStartSize) / 2;
		const rightX = gameWidth - (gameWidth - actualStartSize) / 2;

		// Update start marks, preserve other marks
		const updatedMarks = [...marks];
		updatedMarks[0] = new MarkEntity(
			new Position(leftX, gameHeight - 2),
			MarkType.StartLeft
		);
		updatedMarks[1] = new MarkEntity(
			new Position(rightX, gameHeight - 2),
			MarkType.StartRight
		);

		return updatedMarks;
	}

	/**
	 * Place boats on the start line based on their start position preferences
	 * Also updates start marks to accommodate all boats
	 */
	static placeBoatsOnStart(
		boats: Boat[],
		marks: MarkEntity[],
		gameHeight: number,
		gameWidth?: number,
		baseStartSize?: number
	): MarkEntity[] {
		if (marks.length < 2) {
			throw new Error('Need at least 2 marks to place boats');
		}

		// Update start marks if gameWidth and baseStartSize are provided
		let updatedMarks = marks;
		if (gameWidth !== undefined && baseStartSize !== undefined) {
			updatedMarks = this.updateStartMarks(marks, boats.length, gameWidth, gameHeight, baseStartSize);
		}

		const boatsStartLeft: Boat[] = [];
		const boatsStartMiddle: Boat[] = [];
		const boatsStartRight: Boat[] = [];

		// Group boats by start position preference
		for (const boat of boats) {
			// If boat has custom position, preserve it
			if (boat.customStartX !== undefined) {
				boat.x = boat.customStartX;
				boat.y = gameHeight - 2;
				continue;
			}

			if (boat.startPos === 0) {
				boatsStartLeft.push(boat);
			} else if (boat.startPos === 2) {
				boatsStartRight.push(boat);
			} else {
				boatsStartMiddle.push(boat);
			}
		}

		// Sort boats by start priority
		function compareBoatStartPriority(a: Boat, b: Boat): number {
			return a.startPriority - b.startPriority;
		}

		boatsStartLeft.sort(compareBoatStartPriority);
		boatsStartMiddle.sort(compareBoatStartPriority);
		boatsStartRight.sort(compareBoatStartPriority);

		// Spacing between boats: 2.5 game units (approximately 2-3 boat lengths)
		// This ensures boats are clearly separated and easy to distinguish
		const BOAT_SPACING = 2.5;
		const EDGE_OFFSET = 1.5; // Distance from mark to first boat

		const leftMark = updatedMarks[0];
		const rightMark = updatedMarks[1];
		const middleX = (leftMark.x + rightMark.x) / 2;

		// Place boats on left side (from left mark outward)
		for (let i = 0; i < boatsStartLeft.length; i++) {
			boatsStartLeft[i].x = leftMark.x + EDGE_OFFSET + i * BOAT_SPACING;
			boatsStartLeft[i].y = gameHeight - 2;
		}

		// Place boats in middle (centered around middle, alternating left/right)
		for (let i = 0; i < boatsStartMiddle.length; i++) {
			// Calculate offset from center: boats alternate left/right
			// First boat at center, then spread outward symmetrically
			// Pattern: center, right, left, further right, further left, etc.
			if (i === 0) {
				// First boat at center
				boatsStartMiddle[i].x = middleX;
			} else {
				// Subsequent boats alternate left/right
				const pairIndex = Math.floor((i - 1) / 2) + 1; // 1, 1, 2, 2, 3, 3, ...
				const direction = i % 2 === 1 ? 1 : -1; // Odd indices go right, even go left
				const offset = pairIndex * BOAT_SPACING;
				boatsStartMiddle[i].x = middleX + direction * offset;
			}
			boatsStartMiddle[i].y = gameHeight - 2;
		}

		// Place boats on right side (from right mark outward)
		for (let i = 0; i < boatsStartRight.length; i++) {
			boatsStartRight[i].x = rightMark.x - EDGE_OFFSET - i * BOAT_SPACING;
			boatsStartRight[i].y = gameHeight - 2;
		}

		return updatedMarks;
	}
}


