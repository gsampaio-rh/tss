/**
 * AI Player Service
 * Handles AI decision-making for computer-controlled boats
 */

import { TurnType } from '../../types/game';
import type { Boat } from '../../types/boat';
import type { Game } from '../../types/game';
import { TacticalAnalysisService } from '../../domain/services/TacticalAnalysisService';
import { NavigationService } from '../../domain/services/NavigationService';
import { Angle } from '../../domain/value-objects/Angle';
import { Position } from '../../domain/value-objects/Position';
import { WindCalculationService } from '../../domain/services/WindCalculationService';

export enum AIDifficulty {
	Easy = 'easy',
	Medium = 'medium',
	Hard = 'hard'
}

export interface AIDecision {
	turnType: TurnType;
	reason: string;
}

export class AIPlayerService {
	/**
	 * Make a decision for an AI-controlled boat
	 */
	static makeDecision(
		boat: Boat,
		game: Game,
		difficulty: AIDifficulty = AIDifficulty.Medium
	): AIDecision {
		const boatPosition = new Position(boat.x, boat.y);
		const currentWind = Angle.fromDegrees(game.getWind(game.turncount));
		const previousWind = game.turncount > 0 
			? Angle.fromDegrees(game.getWind(game.turncount - 1))
			: currentWind;

		// Get windward mark (mark index 2)
		const windwardMark = game.marks[2];
		if (!windwardMark) {
			return { turnType: TurnType.Forward, reason: 'No windward mark found' };
		}
		const markPosition = new Position(windwardMark.x, windwardMark.y);

		// Check if boat is finished
		if (boat.finished !== false) {
			return { turnType: TurnType.Forward, reason: 'Boat already finished' };
		}

		// Check if boat is close to mark (switch to ToMark mode)
		const distanceToMark = NavigationService.distance(boatPosition, markPosition);
		const isNearMark = distanceToMark < 3.0; // Within 3 units of mark

		if (isNearMark && !game.isOutLaneline(boat.x, boat.y)) {
			return { turnType: TurnType.ToMark, reason: 'Close to mark, heading directly' };
		}

		// Calculate tactical information
		const courseAxis = NavigationService.getCourseAxis(boatPosition, markPosition);
		const optimalHeading = TacticalAnalysisService.getOptimalHeading(
			boat.tack,
			currentWind,
			true // Assuming upwind
		);
		const currentHeading = Angle.fromDegrees(boat.rotation);
		const headingError = Math.abs(TacticalAnalysisService.angleDiff(courseAxis, currentHeading));
		const optimalError = Math.abs(TacticalAnalysisService.angleDiff(courseAxis, optimalHeading));

		// Calculate lift/header from wind shift
		const liftHeader = TacticalAnalysisService.calculateLiftHeader(
			boatPosition,
			markPosition,
			boat.tack,
			previousWind,
			currentWind,
			true
		);

		// Calculate VMG
		const vmg = TacticalAnalysisService.calculateVMG(
			boatPosition,
			markPosition,
			1.0, // Boat speed
			currentHeading
		);

		// Calculate VMG on opposite tack
		const oppositeTack = !boat.tack;
		const oppositeOptimalHeading = TacticalAnalysisService.getOptimalHeading(
			oppositeTack,
			currentWind,
			true
		);
		const oppositeVMG = TacticalAnalysisService.calculateVMG(
			boatPosition,
			markPosition,
			1.0,
			oppositeOptimalHeading
		);

		// Decision logic based on difficulty
		switch (difficulty) {
			case AIDifficulty.Easy:
				return AIPlayerService.makeEasyDecision(boat, game, headingError, liftHeader);
			case AIDifficulty.Medium:
				return AIPlayerService.makeMediumDecision(
					boat,
					game,
					headingError,
					optimalError,
					liftHeader,
					vmg,
					oppositeVMG,
					courseAxis
				);
			case AIDifficulty.Hard:
				return AIPlayerService.makeHardDecision(
					boat,
					game,
					headingError,
					optimalError,
					liftHeader,
					vmg,
					oppositeVMG,
					courseAxis,
					boatPosition,
					markPosition
				);
			default:
				return { turnType: TurnType.Forward, reason: 'Unknown difficulty' };
		}
	}

	/**
	 * Easy AI: Simple decision-making
	 * - Tacks occasionally
	 * - Mostly goes forward
	 */
	private static makeEasyDecision(
		boat: Boat,
		game: Game,
		headingError: number,
		liftHeader: { isLift: boolean; isHeader: boolean; errorChange: number }
	): AIDecision {
		// Tack occasionally (20% chance) or if header is severe
		if (liftHeader.isHeader && Math.abs(liftHeader.errorChange) > 15) {
			return { turnType: TurnType.Tack, reason: 'Severe header detected' };
		}

		// Random tack every ~10 turns
		if (game.turncount % 10 === 0 && Math.random() < 0.2) {
			return { turnType: TurnType.Tack, reason: 'Random tack' };
		}

		return { turnType: TurnType.Forward, reason: 'Continue forward' };
	}

	/**
	 * Medium AI: Tactical decision-making
	 * - Considers lift/header
	 * - Optimizes VMG
	 * - Tacks when beneficial
	 */
	private static makeMediumDecision(
		boat: Boat,
		game: Game,
		headingError: number,
		optimalError: number,
		liftHeader: { isLift: boolean; isHeader: boolean; errorChange: number },
		vmg: number,
		oppositeVMG: number,
		courseAxis: Angle
	): AIDecision {
		// If severe header, consider tacking
		if (liftHeader.isHeader && Math.abs(liftHeader.errorChange) > 10) {
			// Check if opposite tack would be better
			if (oppositeVMG > vmg * 1.1) {
				return { turnType: TurnType.Tack, reason: 'Header: opposite tack has better VMG' };
			}
		}

		// If lift, stay on current tack
		if (liftHeader.isLift && Math.abs(liftHeader.errorChange) > 5) {
			return { turnType: TurnType.Forward, reason: 'Lift detected, staying on tack' };
		}

		// If heading error is large, consider tacking
		if (headingError > 30 && optimalError < headingError * 0.7) {
			if (oppositeVMG > vmg * 0.9) {
				return { turnType: TurnType.Tack, reason: 'Large heading error, opposite tack better' };
			}
		}

		// Boundary conditions: tack if too close to edge
		if (boat.x < 2) {
			return { turnType: TurnType.Tack, reason: 'Too close to left boundary' };
		}
		if (boat.x > game.width - 2) {
			return { turnType: TurnType.Tack, reason: 'Too close to right boundary' };
		}

		return { turnType: TurnType.Forward, reason: 'Continue forward' };
	}

	/**
	 * Hard AI: Advanced tactical decision-making
	 * - Considers all factors
	 * - Optimizes for VMG and position
	 * - Strategic tacking decisions
	 */
	private static makeHardDecision(
		boat: Boat,
		game: Game,
		headingError: number,
		optimalError: number,
		liftHeader: { isLift: boolean; isHeader: boolean; errorChange: number },
		vmg: number,
		oppositeVMG: number,
		courseAxis: Angle,
		boatPosition: Position,
		markPosition: Position
	): AIDecision {
		// Calculate distance to mark
		const distanceToMark = NavigationService.distance(boatPosition, markPosition);

		// If close to mark, head directly
		if (distanceToMark < 5.0) {
			return { turnType: TurnType.ToMark, reason: 'Close to mark, direct approach' };
		}

		// Severe header: definitely tack if opposite tack is better
		if (liftHeader.isHeader && Math.abs(liftHeader.errorChange) > 8) {
			if (oppositeVMG > vmg * 1.05) {
				return { turnType: TurnType.Tack, reason: 'Header: switching to better VMG tack' };
			}
		}

		// Strong lift: stay on current tack
		if (liftHeader.isLift && Math.abs(liftHeader.errorChange) > 5) {
			return { turnType: TurnType.Forward, reason: 'Strong lift, maintaining tack' };
		}

		// VMG optimization: tack if opposite tack is significantly better
		if (oppositeVMG > vmg * 1.15) {
			return { turnType: TurnType.Tack, reason: 'Opposite tack has significantly better VMG' };
		}

		// Heading optimization: if current heading is far from optimal
		if (headingError > 25 && optimalError < headingError * 0.6) {
			if (oppositeVMG >= vmg) {
				return { turnType: TurnType.Tack, reason: 'Optimizing heading angle' };
			}
		}

		// Boundary management: tack before hitting edge
		if (boat.x < 3) {
			return { turnType: TurnType.Tack, reason: 'Preventing boundary collision' };
		}
		if (boat.x > game.width - 3) {
			return { turnType: TurnType.Tack, reason: 'Preventing boundary collision' };
		}

		// Strategic tacking: don't stay on one tack too long
		// Check how many turns on current tack (simplified - could track this better)
		if (game.turncount > 0 && game.turncount % 8 === 0) {
			if (oppositeVMG > vmg * 0.95) {
				return { turnType: TurnType.Tack, reason: 'Strategic tack to maintain position' };
			}
		}

		return { turnType: TurnType.Forward, reason: 'Optimal forward progress' };
	}
}

