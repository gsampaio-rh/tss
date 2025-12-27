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

export class BoatMovementService {
	/**
	 * Execute a boat turn based on turn type
	 * This is a refactored version of executeBoatTurn from gameLogic.ts
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

