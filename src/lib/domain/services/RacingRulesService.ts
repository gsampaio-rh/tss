/**
 * Racing Rules Service
 * 
 * Implements sailing racing rules, particularly right-of-way rules.
 * Based on ISAF (World Sailing) Racing Rules of Sailing.
 * 
 * @module Domain/Services
 */

import { Position } from '../value-objects/Position';
import { Angle } from '../value-objects/Angle';
import { NavigationService } from './NavigationService';
import type { Boat } from '../../types/boat';
import type { Game } from '../../types/game';

/**
 * Right-of-way situation types
 */
export enum RightOfWaySituation {
	STARBOARD_OVER_PORT = 'STARBOARD_OVER_PORT',
	PORT_MUST_KEEP_CLEAR = 'PORT_MUST_KEEP_CLEAR',
	WINDWARD_KEEPS_CLEAR = 'WINDWARD_KEEPS_CLEAR',
	LEEWARD_HAS_RIGHT_OF_WAY = 'LEEWARD_HAS_RIGHT_OF_WAY',
	OVERTAKING_KEEPS_CLEAR = 'OVERTAKING_KEEPS_CLEAR',
	OVERTAKEN_HAS_RIGHT_OF_WAY = 'OVERTAKEN_HAS_RIGHT_OF_WAY',
	CLEAR = 'CLEAR' // No right-of-way conflict
}

/**
 * Collision risk assessment
 */
export interface CollisionRisk {
	willCollide: boolean;
	distanceAtClosestPoint: number;
	timeToCollision: number; // Turns until collision
	riskLevel: 'none' | 'low' | 'medium' | 'high' | 'imminent';
}

/**
 * Right-of-way check result
 */
export interface RightOfWayResult {
	situation: RightOfWaySituation;
	boatHasRightOfWay: boolean;
	mustKeepClear: boolean;
	violation: boolean; // True if boat is violating right-of-way rules
	otherBoat: Boat | null;
}

/**
 * Penalty type
 */
export enum PenaltyType {
	NONE = 'NONE',
	TURN_360 = 'TURN_360', // 360° turn penalty
	TURN_720 = 'TURN_720' // 720° turn penalty (serious violation)
}

/**
 * Penalty state for a boat
 */
export interface PenaltyState {
	type: PenaltyType;
	turnsRemaining: number; // Number of turns remaining to complete penalty
	isActive: boolean;
}

/**
 * Racing rules warning/alert for approaching violations
 */
export interface RacingRulesWarning {
	otherBoat: Boat;
	situation: RightOfWaySituation;
	collisionRisk: CollisionRisk;
	warningLevel: 'warning' | 'critical';
	warningMessage: string;
}

/**
 * Racing Rules Service
 * 
 * Provides racing rules checking, collision detection, and penalty management.
 */
export class RacingRulesService {
	/**
	 * Minimum safe distance between boats (in game units)
	 */
	static readonly MIN_SAFE_DISTANCE = 0.5;

	/**
	 * Collision detection distance threshold
	 */
	static readonly COLLISION_DISTANCE = 0.3;

	/**
	 * Check right-of-way between two boats
	 * 
	 * Rules:
	 * 1. Starboard tack has right-of-way over port tack
	 * 2. Same tack: windward boat keeps clear of leeward boat
	 * 3. Overtaking boat keeps clear
	 * 
	 * @param boat1 - First boat (the boat we're checking)
	 * @param boat2 - Second boat (the other boat)
	 * @param game - Game state
	 * @returns Right-of-way result
	 */
	static checkRightOfWay(
		boat1: Boat,
		boat2: Boat,
		game: Game
	): RightOfWayResult {
		// Rule 1: Starboard tack has right-of-way over port tack
		if (!boat1.tack && boat2.tack) {
			// boat1 is starboard, boat2 is port
			return {
				situation: RightOfWaySituation.STARBOARD_OVER_PORT,
				boatHasRightOfWay: true,
				mustKeepClear: false,
				violation: false,
				otherBoat: boat2
			};
		}

		if (boat1.tack && !boat2.tack) {
			// boat1 is port, boat2 is starboard
			return {
				situation: RightOfWaySituation.PORT_MUST_KEEP_CLEAR,
				boatHasRightOfWay: false,
				mustKeepClear: true,
				violation: false,
				otherBoat: boat2
			};
		}

		// Rule 2: Same tack - windward boat keeps clear of leeward boat
		if (boat1.tack === boat2.tack) {
			const windwardBoat = this.getWindwardBoat(boat1, boat2, game);
			
			if (windwardBoat === boat1) {
				// boat1 is windward, must keep clear
				return {
					situation: RightOfWaySituation.WINDWARD_KEEPS_CLEAR,
					boatHasRightOfWay: false,
					mustKeepClear: true,
					violation: false,
					otherBoat: boat2
				};
			} else {
				// boat1 is leeward, has right-of-way
				return {
					situation: RightOfWaySituation.LEEWARD_HAS_RIGHT_OF_WAY,
					boatHasRightOfWay: true,
					mustKeepClear: false,
					violation: false,
					otherBoat: boat2
				};
			}
		}

		// No conflict
		return {
			situation: RightOfWaySituation.CLEAR,
			boatHasRightOfWay: true,
			mustKeepClear: false,
			violation: false,
			otherBoat: null
		};
	}

	/**
	 * Determine which boat is windward (closer to wind)
	 * 
	 * @param boat1 - First boat
	 * @param boat2 - Second boat
	 * @param game - Game state
	 * @returns The windward boat (closer to wind source)
	 */
	static getWindwardBoat(boat1: Boat, boat2: Boat, game: Game): Boat {
		const currentWind = Angle.fromDegrees(game.getWind(game.turncount));
		
		// Windward boat is the one closer to the wind source
		// For upwind sailing, windward is the boat with higher Y (closer to top/mark)
		// For downwind, it's more complex, but for simplicity, we'll use Y position
		// In a typical race, boats sail upwind, so higher Y = windward
		
		// More accurate: calculate angle to wind for each boat
		const boat1Pos = new Position(boat1.x, boat1.y);
		const boat2Pos = new Position(boat2.x, boat2.y);
		
		// For upwind sailing, windward boat is the one that would be closer to the wind
		// if both boats were at the same X position. We can approximate by Y position.
		// Higher Y (closer to mark) = windward when sailing upwind
		
		// Simple heuristic: boat with higher Y is windward (closer to wind source)
		// This works for upwind sailing which is most common
		return boat1.y > boat2.y ? boat1 : boat2;
	}

	/**
	 * Check if boat1 is overtaking boat2
	 * 
	 * A boat is overtaking if it's approaching from behind (more than 22.5° abaft the beam)
	 * 
	 * @param boat1 - The potentially overtaking boat
	 * @param boat2 - The potentially overtaken boat
	 * @returns True if boat1 is overtaking boat2
	 */
	static isOvertaking(boat1: Boat, boat2: Boat): boolean {
		const boat1Pos = new Position(boat1.x, boat1.y);
		const boat2Pos = new Position(boat2.x, boat2.y);
		
		// Calculate bearing from boat1 to boat2
		const bearing = NavigationService.getCourseAxis(boat1Pos, boat2Pos);
		const boat1Heading = Angle.fromDegrees(boat1.rotation);
		
		// Calculate angle difference
		const angleDiff = Math.abs(bearing.angleDiff(boat1Heading));
		
		// Overtaking if approaching from more than 22.5° abaft the beam (behind)
		// This means the angle between heading and bearing to other boat is > 112.5°
		return angleDiff > 112.5;
	}

	/**
	 * Detect collision risk between two boats
	 * 
	 * @param boat1 - First boat
	 * @param boat2 - Second boat
	 * @param game - Game state
	 * @returns Collision risk assessment
	 */
	static detectCollisionRisk(
		boat1: Boat,
		boat2: Boat,
		game: Game
	): CollisionRisk {
		const boat1Pos = new Position(boat1.x, boat1.y);
		const boat2Pos = new Position(boat2.x, boat2.y);
		
		// Current distance
		const currentDistance = NavigationService.distance(boat1Pos, boat2Pos);
		
		// Calculate relative velocity
		const boat1Heading = Angle.fromDegrees(boat1.rotation);
		const boat2Heading = Angle.fromDegrees(boat2.rotation);
		
		// Boat speeds (assuming 1 unit per turn, modified by speed multiplier)
		const boat1Speed = 1.0; // Base speed
		const boat2Speed = 1.0;
		
		// Calculate velocity vectors
		const v1x = Math.sin(boat1Heading.radians) * boat1Speed;
		const v1y = -Math.cos(boat1Heading.radians) * boat1Speed;
		const v2x = Math.sin(boat2Heading.radians) * boat2Speed;
		const v2y = -Math.cos(boat2Heading.radians) * boat2Speed;
		
		// Relative velocity
		const relVx = v1x - v2x;
		const relVy = v1y - v2y;
		
		// Relative position
		const relPx = boat2.x - boat1.x;
		const relPy = boat2.y - boat1.y;
		
		// Time to closest approach
		// If boats are moving away from each other, time will be negative
		const relSpeedSq = relVx * relVx + relVy * relVy;
		let timeToClosest = 0;
		
		if (relSpeedSq > 0.001) {
			timeToClosest = -(relPx * relVx + relPy * relVy) / relSpeedSq;
		}
		
		// If time is negative, boats are moving away
		if (timeToClosest < 0) {
			return {
				willCollide: false,
				distanceAtClosestPoint: currentDistance,
				timeToCollision: Infinity,
				riskLevel: 'none'
			};
		}
		
		// Position at closest approach
		const closestPx = boat1.x + v1x * timeToClosest;
		const closestPy = boat1.y + v1y * timeToClosest;
		const closestQx = boat2.x + v2x * timeToClosest;
		const closestQy = boat2.y + v2y * timeToClosest;
		
		const distanceAtClosest = Math.sqrt(
			(closestQx - closestPx) ** 2 + (closestQy - closestPy) ** 2
		);
		
		// Determine risk level
		let riskLevel: 'none' | 'low' | 'medium' | 'high' | 'imminent';
		const willCollide = distanceAtClosest < this.COLLISION_DISTANCE;
		
		if (willCollide) {
			if (timeToClosest < 1) {
				riskLevel = 'imminent';
			} else if (timeToClosest < 2) {
				riskLevel = 'high';
			} else {
				riskLevel = 'medium';
			}
		} else if (distanceAtClosest < this.MIN_SAFE_DISTANCE) {
			riskLevel = 'low';
		} else {
			riskLevel = 'none';
		}
		
		return {
			willCollide,
			distanceAtClosestPoint: distanceAtClosest,
			timeToCollision: timeToClosest,
			riskLevel
		};
	}

	/**
	 * Check if a boat movement would violate right-of-way rules
	 * 
	 * @param boat - The boat attempting to move
	 * @param newPosition - Proposed new position
	 * @param game - Game state
	 * @returns Right-of-way violations found
	 */
	static checkMovementViolations(
		boat: Boat,
		newPosition: Position,
		game: Game
	): RightOfWayResult[] {
		const violations: RightOfWayResult[] = [];
		const boatCurrentPos = new Position(boat.x, boat.y);
		
		// Check against all other boats
		for (const otherBoat of game.players) {
			if (otherBoat === boat || otherBoat.finished) {
				continue;
			}
			
			const rightOfWay = this.checkRightOfWay(boat, otherBoat, game);
			
			// If boat must keep clear, check distances
			if (rightOfWay.mustKeepClear) {
				const otherBoatPos = new Position(otherBoat.x, otherBoat.y);
				
				// Check current distance
				const currentDistance = NavigationService.distance(boatCurrentPos, otherBoatPos);
				
				// Check new position distance
				const newDistance = NavigationService.distance(newPosition, otherBoatPos);
				
				// Check collision risk
				const collisionRisk = this.detectCollisionRisk(boat, otherBoat, game);
				
				// Violation if:
				// 1. Already too close (current distance < MIN_SAFE_DISTANCE), OR
				// 2. New position would be too close (newDistance < MIN_SAFE_DISTANCE), OR
				// 3. Collision risk is medium or higher
				const isTooClose = currentDistance < this.MIN_SAFE_DISTANCE || 
				                   newDistance < this.MIN_SAFE_DISTANCE;
				const hasCollisionRisk = collisionRisk.riskLevel !== 'none' && 
				                         collisionRisk.riskLevel !== 'low';
				
				if (isTooClose || hasCollisionRisk) {
					violations.push({
						...rightOfWay,
						violation: true
					});
				}
			}
		}
		
		return violations;
	}

	/**
	 * Determine penalty for a rule violation
	 * 
	 * @param violation - The right-of-way violation
	 * @param collisionRisk - The collision risk level
	 * @returns Penalty type
	 */
	static determinePenalty(
		violation: RightOfWayResult,
		collisionRisk: CollisionRisk
	): PenaltyType {
		// Serious violations (actual collision or very close) get 720° turn
		if (collisionRisk.riskLevel === 'imminent' || collisionRisk.willCollide) {
			return PenaltyType.TURN_720;
		}
		
		// Standard violation gets 360° turn
		return PenaltyType.TURN_360;
	}

	/**
	 * Get penalty state for a boat
	 * 
	 * @param boat - The boat to check
	 * @returns Penalty state
	 */
	static getPenaltyState(boat: Boat): PenaltyState {
		return {
			type: boat.penaltyTurnsRemaining > 0 
				? (boat.penaltyTurnsRemaining === 1 ? PenaltyType.TURN_360 : PenaltyType.TURN_720)
				: PenaltyType.NONE,
			turnsRemaining: boat.penaltyTurnsRemaining,
			isActive: boat.penaltyTurnsRemaining > 0 || boat.isExecutingPenalty
		};
	}

	/**
	 * Check if a boat is approaching a right-of-way violation
	 * Returns warnings for boats that are getting close to violating rules
	 * (one turn before penalty would be applied)
	 * 
	 * @param boat - The boat to check
	 * @param game - Game state
	 * @returns Array of approaching violation warnings
	 */
	static checkApproachingViolations(
		boat: Boat,
		game: Game
	): RacingRulesWarning[] {
		const warnings: RacingRulesWarning[] = [];

		const boatPos = new Position(boat.x, boat.y);

		// Check against all other boats
		for (const otherBoat of game.players) {
			if (otherBoat === boat || otherBoat.finished) {
				continue;
			}

			const rightOfWay = this.checkRightOfWay(boat, otherBoat, game);
			const otherBoatPos = new Position(otherBoat.x, otherBoat.y);
			const currentDistance = NavigationService.distance(boatPos, otherBoatPos);

			// If boat must keep clear, check if approaching violation
			if (rightOfWay.mustKeepClear) {
				const collisionRisk = this.detectCollisionRisk(boat, otherBoat, game);

				// Warning conditions (one turn before penalty):
				// - Low/medium risk: warning (approaching violation)
				// - High risk: critical warning (penalty likely next turn)
				// - Distance is getting close but not yet violating
				// Use 2x safe distance for warnings to give one turn advance notice
				const warningDistance = this.MIN_SAFE_DISTANCE * 2.0; // 2x safe distance for early warning
				const criticalDistance = this.MIN_SAFE_DISTANCE * 1.3; // 1.3x for critical warning
				
				const isApproaching = (collisionRisk.riskLevel === 'low' || 
				                       collisionRisk.riskLevel === 'medium') &&
				                      currentDistance < warningDistance &&
				                      currentDistance >= this.MIN_SAFE_DISTANCE; // Not yet violating

				const isCritical = collisionRisk.riskLevel === 'high' ||
				                  (collisionRisk.riskLevel === 'medium' && 
				                   currentDistance < criticalDistance) ||
				                  (currentDistance < this.MIN_SAFE_DISTANCE * 1.1); // Very close

				if (isApproaching || isCritical) {
					// Generate human-readable warning message based on situation
					let warningMessage = '';
					if (rightOfWay.situation === RightOfWaySituation.PORT_MUST_KEEP_CLEAR) {
						warningMessage = isCritical ? 'KEEP CLEAR - Starboard!' : 'Keep Clear - Starboard';
					} else if (rightOfWay.situation === RightOfWaySituation.WINDWARD_KEEPS_CLEAR) {
						warningMessage = isCritical ? 'KEEP CLEAR - Leeward!' : 'Keep Clear - Leeward';
					} else if (rightOfWay.situation === RightOfWaySituation.OVERTAKING_KEEPS_CLEAR) {
						warningMessage = isCritical ? 'KEEP CLEAR - Overtaking!' : 'Keep Clear - Overtaking';
					} else {
						warningMessage = isCritical ? 'KEEP CLEAR!' : 'Keep Clear';
					}

					warnings.push({
						otherBoat,
						situation: rightOfWay.situation,
						collisionRisk,
						warningLevel: isCritical ? 'critical' : 'warning',
						warningMessage
					});
				}
			}
		}

		return warnings;
	}
}

