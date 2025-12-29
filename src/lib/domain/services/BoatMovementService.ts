/**
 * Boat Movement Service
 * Handles boat movement calculations and turn execution
 */

import { Position } from '../value-objects/Position';
import { Angle } from '../value-objects/Angle';
import { NavigationService } from './NavigationService';
import { DirtyAirService } from './DirtyAirService';
import { TacticalAnalysisService } from './TacticalAnalysisService';
import type { Boat } from '../../types/boat';
import type { Game } from '../../types/game';
import { TurnType } from '../../types/game';

export interface BoatMovementResult {
	points: Position[];
	finalPosition: Position;
	finalRotation: Angle;
	finalTack: boolean;
	finished: number | false;
}

/**
 * Boat Movement Service
 * 
 * Provides boat movement calculation and execution functionality.
 */
export class BoatMovementService {
	/**
	 * Execute a boat turn based on turn type
	 * 
	 * Executes a boat's turn based on the selected turn type (Forward, Tack, ToMark).
	 * Handles:
	 * - Tack execution (switching tacks and recalculating rotation)
	 * - Forward movement (recalculating rotation based on current wind)
	 * - ToMark movement (heading directly to mark when close, with smart tacking)
	 * - Dirty air effects (if enabled)
	 * - Boundary conditions (tacking at boundaries)
	 * - Finish detection (when boat reaches mark)
	 * 
	 * **Important**: 
	 * - This method recalculates rotation every turn for Forward movement to ensure 
	 *   boats respond to wind shifts. This was a critical fix for wind responsiveness.
	 * - ToMark mode now intelligently evaluates wind shifts and can tack if the opposite
	 *   tack provides significantly better VMG (>15% improvement) and the boat is not
	 *   too close to the mark (<2 units). This prevents boats from ignoring major wind
	 *   shifts when heading to the mark.
	 * 
	 * @param boat - The boat to move
	 * @param game - The current game state
	 * @param enableDirtyAirEffects - Whether to apply dirty air speed/angle penalties
	 * @returns Movement result with points, final rotation, tack, and finish status
	 * 
	 * @example
	 * ```typescript
	 * const result = BoatMovementService.executeBoatTurn(boat, game, true);
	 * boat.saveTurn(boat.turntype, result.points, result.finalRotation.degrees, result.finalTack, result.finished);
	 * ```
	 */
	static executeBoatTurn(
		boat: Boat,
		game: Game,
		enableDirtyAirEffects: boolean = false
	): BoatMovementResult {
		const initialTack = boat.tack;
		const initialRotation = Angle.fromDegrees(boat.rotation);
		const initialPosition = new Position(boat.x, boat.y);
		const initialTurnType = boat.turntype;

		// Get the turn type
		const selectedTurnType = boat.getTurn();
		boat.turntype = selectedTurnType;

		const points: Position[] = [initialPosition]; // Start with initial position for track
		let moveDist = 1;
		let currentPosition = initialPosition;
		let currentRotation = initialRotation;
		let currentTack = initialTack;
		let finished: number | false = false;

		// Get current wind for this turn
		const currentWind = Angle.fromDegrees(game.getWind(game.turncount));

		// Handle tacking
		if (boat.turntype === TurnType.Tack) {
			currentTack = !currentTack;

			if (currentTack) {
				// Port tack
				currentRotation = currentWind.add(Angle.fromDegrees(45));
			} else {
				// Starboard tack
				currentRotation = currentWind.subtract(Angle.fromDegrees(45));
			}

			boat.turntype = TurnType.Forward;
		} else {
			// For Forward movement, recalculate rotation based on current wind and tack
			// This ensures boats respond to wind shifts every turn
			if (boat.turntype === TurnType.Forward) {
				if (currentTack) {
					// Port tack: 45° + wind
					currentRotation = currentWind.add(Angle.fromDegrees(45));
				} else {
					// Starboard tack: -45° + wind
					currentRotation = currentWind.subtract(Angle.fromDegrees(45));
				}
			}
		}

		// Apply dirty air effects if enabled
		let speedMultiplier = 1.0;
		let angleAdjustment = 0;

		if (enableDirtyAirEffects) {
			const dirtyAirEffect = DirtyAirService.getDirtyAirEffect(
				boat,
				currentPosition,
				game.players,
				currentWind
			);

			if (dirtyAirEffect.inDirtyAir) {
				// Reduce speed by 15-30% based on intensity
				speedMultiplier = 1.0 - dirtyAirEffect.intensity * 0.3;
				// Adjust angle (foot off) by up to 5 degrees
				angleAdjustment = dirtyAirEffect.intensity * 5;
			}
		}

		// Execute movement
		while (moveDist > 0) {
			if (!finished) {
				const markPosition = new Position(game.marks[2].x, game.marks[2].y);
				const dist = NavigationService.distance(currentPosition, markPosition);

				if (moveDist >= dist && game.isOutLaneline(currentPosition.x, currentPosition.y)) {
					// Reached the mark
					currentPosition = new Position(markPosition.x, markPosition.y - 0.1);
					points.push(currentPosition);
					moveDist -= dist;
					finished = game.turncount * 60 + (60 - moveDist * 60);
					currentTack = false;
					currentRotation = Angle.fromDegrees(-100);
				} else if (
					boat.turntype === TurnType.Forward &&
					currentPosition.y - Math.cos(currentRotation.radians) * moveDist <= markPosition.y
				) {
					// Approaching mark, switch to ToMark mode
					if (currentPosition.y > markPosition.y) {
						const markDistance = NavigationService.distanceToLine(
							currentPosition,
							markPosition,
							Angle.fromDegrees(0)
						);

						const newX =
							currentPosition.x +
							Math.sin(currentRotation.radians) * markDistance;
						const newY =
							currentPosition.y - Math.cos(currentRotation.radians) * markDistance;

						currentPosition = new Position(newX, newY);
						points.push(currentPosition);
						moveDist -= markDistance;
					}

					boat.turntype = TurnType.ToMark;
				} else {
					// Handle boundary conditions
					if (currentPosition.x < 0.5) {
						currentTack = true;
					}
					if (currentPosition.x > game.width - 0.5) {
						currentTack = false;
					}

					// Execute movement based on turn type
					if (boat.turntype === TurnType.ToMark) {
						// Smart ToMark: Evaluate if tacking would be beneficial despite being in ToMark mode
						const distanceToMark = NavigationService.distance(currentPosition, markPosition);
						const isVeryCloseToMark = distanceToMark < 2.0; // Within 2 units, always head directly
						
						if (!isVeryCloseToMark) {
							// Check for significant wind shift
							const previousWind = game.turncount > 0
								? Angle.fromDegrees(game.getWind(game.turncount - 1))
								: currentWind;
							
							const windShift = Math.abs(TacticalAnalysisService.angleDiff(currentWind, previousWind));
							const significantShift = windShift > 15; // More than 15° shift
							
							if (significantShift) {
								// Calculate VMG on current tack vs opposite tack
								const currentHeading = currentRotation;
								const currentVMG = TacticalAnalysisService.calculateVMG(
									currentPosition,
									markPosition,
									1.0, // Base speed
									currentHeading
								);
								
								// Calculate optimal heading on opposite tack
								const oppositeTack = !currentTack;
								const oppositeOptHeading = TacticalAnalysisService.getOptimalHeading(
									oppositeTack,
									currentWind,
									true // Assuming upwind
								);
								
								const oppositeVMG = TacticalAnalysisService.calculateVMG(
									currentPosition,
									markPosition,
									1.0,
									oppositeOptHeading
								);
								
								// Tack if opposite tack is significantly better (15%+ improvement)
								// AND we're not too close to the mark
								if (oppositeVMG > currentVMG * 1.15) {
									// Switch to opposite tack
									currentTack = oppositeTack;
									currentRotation = oppositeOptHeading;
									// Continue with ToMark movement on new tack
								}
							}
						}
						
						currentPosition = BoatMovementService.executeToMarkMovement(
							currentPosition,
							markPosition,
							currentTack,
							moveDist,
							game,
							currentRotation
						);
						points.push(currentPosition);
						moveDist = 0.0;
					} else {
						// Forward movement
						const adjustedRotation = currentRotation.add(Angle.fromDegrees(angleAdjustment));
						const effectiveMoveDist = moveDist * speedMultiplier;

						const newX =
							currentPosition.x + Math.sin(adjustedRotation.radians) * effectiveMoveDist;
						const newY =
							currentPosition.y - Math.cos(adjustedRotation.radians) * effectiveMoveDist;

						currentPosition = new Position(newX, newY);
						points.push(currentPosition);
						moveDist = 0.0;
					}
				}
			} else {
				break;
			}
		}

		// Update boat state
		boat.x = currentPosition.x;
		boat.y = currentPosition.y;
		boat.rotation = currentRotation.degrees;
		boat.tack = currentTack;
		boat.finished = finished;

		return {
			points,
			finalPosition: currentPosition,
			finalRotation: currentRotation,
			finalTack: currentTack,
			finished
		};
	}

	/**
	 * Execute "ToMark" movement logic
	 */
	private static executeToMarkMovement(
		currentPosition: Position,
		markPosition: Position,
		tack: boolean,
		moveDist: number,
		game: Game,
		currentRotation: Angle
	): Position {
		if (game.isOutLaneline(currentPosition.x, currentPosition.y)) {
			// Head directly to mark
			const courseAngle = NavigationService.getCourseAxis(currentPosition, markPosition);
			const newX = currentPosition.x + Math.sin(courseAngle.radians) * moveDist;
			const newY = currentPosition.y - Math.cos(courseAngle.radians) * moveDist;
			return new Position(newX, newY);
		} else {
			// Follow layline
			const laylineWind = Angle.fromDegrees(game.getWind(game.turncount));
			let lanelineAngle: Angle;
			let moveAngle: Angle;

			if (tack) {
				lanelineAngle = laylineWind.subtract(Angle.fromDegrees(45));
				moveAngle = laylineWind.add(Angle.fromDegrees(45));
			} else {
				lanelineAngle = laylineWind.add(Angle.fromDegrees(45));
				moveAngle = laylineWind.subtract(Angle.fromDegrees(45));
			}

			const lanelineDistance = NavigationService.distanceToLine(
				currentPosition,
				markPosition,
				lanelineAngle
			);

			if (lanelineDistance < moveDist) {
				const newX = currentPosition.x + Math.sin(moveAngle.radians) * lanelineDistance;
				const newY = currentPosition.y - Math.cos(moveAngle.radians) * lanelineDistance;
				return new Position(newX, newY);
			} else {
				const newX = currentPosition.x + Math.sin(moveAngle.radians) * moveDist;
				const newY = currentPosition.y - Math.cos(moveAngle.radians) * moveDist;
				return new Position(newX, newY);
			}
		}
	}
}

