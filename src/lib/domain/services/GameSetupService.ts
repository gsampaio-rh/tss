/**
 * Game Setup Service
 * Handles game initialization and boat placement logic
 */

import { Position } from '../value-objects/Position';
import type { Boat } from '../../types/boat';
import type { MarkEntity } from '../entities/Mark';

export class GameSetupService {
	/**
	 * Place boats on the start line based on their start position preferences
	 */
	static placeBoatsOnStart(
		boats: Boat[],
		marks: MarkEntity[],
		gameHeight: number
	): void {
		if (marks.length < 2) {
			throw new Error('Need at least 2 marks to place boats');
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

		// Place boats on left side
		const startDist = 0.5;
		const leftMark = marks[0];
		for (let i = 0; i < boatsStartLeft.length; i++) {
			boatsStartLeft[i].x = leftMark.x + 1 + i * startDist;
			boatsStartLeft[i].y = gameHeight - 2;
		}

		// Place boats in middle
		const middleX = (marks[0].x + marks[1].x) / 2;
		for (let i = 0; i < boatsStartMiddle.length; i++) {
			let k = 0.5;
			switch (i) {
				case 0:
				case 1:
					k = 1;
					break;
				case 3:
					k = 0.6;
					break;
			}
			if (i < 2) {
				k = 1;
			}
			if (i % 2 === 0) {
				boatsStartMiddle[i].x = -i * startDist * k + middleX;
			} else {
				boatsStartMiddle[i].x = i * startDist * k + middleX;
			}
			boatsStartMiddle[i].y = gameHeight - 2;
		}

		// Place boats on right side
		const rightMark = marks[1];
		for (let i = 0; i < boatsStartRight.length; i++) {
			boatsStartRight[i].x = rightMark.x - 1 - i * startDist;
			boatsStartRight[i].y = gameHeight - 2;
		}
	}
}


