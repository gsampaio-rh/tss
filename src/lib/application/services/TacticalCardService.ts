/**
 * Tactical Card Service
 * 
 * Aggregates all tactical calculations needed for the PlayerTacticalCard component.
 * This service extracts calculation logic from the presentation layer, making components
 * presentation-only and improving testability.
 * 
 * @module Application/Services
 */

import type { Boat } from '$lib/types/boat';
import {
	angleDiff,
	getOptimalHeading,
	calculateVMG,
	calculateVMGEfficiency,
	getCourseAxis,
	calculateLiftHeader,
	OPT_UPWIND_ANGLE
} from '$lib/utils/gameLogic';

const BOAT_SPEED = 1.0;

export interface TacticalMetrics {
	// ATW (Angle to Wind)
	atw: number;
	targetATW: number;
	atwDelta: number;
	atwColor: 'green' | 'yellow' | 'red';
	atwStatus: 'excellent' | 'good' | 'poor';
	atwStatusColor: string;
	atwStatusLabel: string;

	// VMG
	vmg: number;
	vmgEfficiency: number;
	vmgPercent: number;
	vmgStatus: 'excellent' | 'good' | 'poor';
	vmgStatusColor: string;
	vmgStatusLabel: string;
	vmgStatusBgColor: string;
	optimalVMG: number;

	// Lift/Header
	isLift: boolean;
	isHeader: boolean;
	liftAmount: number;
	liftHeaderBarWidth: number;

	// Heading
	optimalHeading: number;
	headingDelta: number;
	headingStatus: 'excellent' | 'good' | 'poor';
	headingStatusColor: string;
	headingStatusLabel: string;

	// Speed
	currentSpeed: number;
	targetSpeed: number;
	speedDelta: number;

	// Mode
	mode: 'PINCHING' | 'FOOTING' | 'VMG MODE' | 'POINTING';
	isPinching: boolean;
	isFooting: boolean;

	// Tack Advantage
	tackAdvantage: number;
	tackAdvantagePercent: number;
	tackAdvantageStatus: 'advantage' | 'disadvantage';
	tackAdvantageStatusColor: string;
	tackAdvantageStatusLabel: string;

	// Power State
	powerState: 'UNDERPOWERED' | 'OVERPOWERED' | 'POWERED';
	powerLevel: number;

	// Decision Flag
	decisionFlag: 'TACK NOW' | 'TACK SOON' | 'HOLD';
}

export interface TacticalCardInput {
	boat: Boat;
	windwardMark: { x: number; y: number } | null;
	windDir: number; // in degrees
	previousWindDir: number; // in degrees
	previousVMG?: number; // for trend calculation
}

/**
 * Calculate all tactical metrics for a boat
 */
export function calculateTacticalMetrics(input: TacticalCardInput): TacticalMetrics {
	const { boat, windwardMark, windDir, previousWindDir, previousVMG } = input;

	// Helper: Calculate status from delta
	const getStatusFromDelta = (
		delta: number,
		excellentThreshold: number,
		goodThreshold: number,
		labels?: { excellent?: string; good?: string; poor?: string }
	): { status: 'excellent' | 'good' | 'poor'; color: string; label: string } => {
		const absDelta = Math.abs(delta);
		if (absDelta <= excellentThreshold) {
			return {
				status: 'excellent',
				color: '#28a745',
				label: labels?.excellent ?? (absDelta <= 2 ? 'Excellent' : 'On Course')
			};
		}
		if (absDelta <= goodThreshold) {
			return {
				status: 'good',
				color: '#ffc107',
				label: labels?.good ?? 'Good'
			};
		}
		return {
			status: 'poor',
			color: '#dc3545',
			label: labels?.poor ?? 'Needs Adjustment'
		};
	};

	// 1. Angle to True Wind (ATW)
	const targetATW = OPT_UPWIND_ANGLE;
	const atw = boat ? Math.abs(angleDiff(boat.rotation, windDir)) : 0;
	const atwDelta = atw - targetATW;
	const atwColor = Math.abs(atwDelta) <= 2 ? 'green' : Math.abs(atwDelta) <= 5 ? 'yellow' : 'red';
	const atwStatusInfo = getStatusFromDelta(atwDelta, 2, 5, {
		excellent: 'Excellent',
		good: 'Good',
		poor: 'Needs Adjustment'
	});
	const atwStatusLabel = atwStatusInfo.label;

	// 2. VMG
	const vmg = windwardMark
		? calculateVMG(boat.rotation, boat.x, boat.y, windwardMark.x, windwardMark.y, BOAT_SPEED)
		: 0;
	const vmgEfficiency = windwardMark
		? calculateVMGEfficiency(
				boat.rotation,
				boat.x,
				boat.y,
				windwardMark.x,
				windwardMark.y,
				BOAT_SPEED,
				true
			)
		: 0;
	const vmgPercent = Math.round(vmgEfficiency * 100);
	const vmgStatus = vmgPercent >= 95 ? 'excellent' : vmgPercent >= 85 ? 'good' : 'poor';
	const vmgStatusColor = vmgPercent >= 95 ? '#28a745' : vmgPercent >= 85 ? '#ffc107' : '#dc3545';
	const vmgStatusLabel = vmgPercent >= 95 ? 'Excellent' : vmgPercent >= 85 ? 'Good' : 'Poor';
	const vmgStatusBgColor =
		vmgPercent >= 95
			? 'rgba(40, 167, 69, 0.12)'
			: vmgPercent >= 85
			? 'rgba(255, 193, 7, 0.12)'
			: 'rgba(220, 53, 69, 0.12)';

	// 3. Lift/Header
	const liftHeaderResult =
		windDir !== previousWindDir && windwardMark && Math.abs(windDir - previousWindDir) > 0.1
			? calculateLiftHeader(
					boat,
					boat.x,
					boat.y,
					windwardMark.x,
					windwardMark.y,
					previousWindDir,
					windDir,
					true
				)
			: null;

	const isLift = liftHeaderResult?.isLift ?? false;
	const isHeader = liftHeaderResult?.isHeader ?? false;
	const liftAmount = liftHeaderResult?.errorChange ?? 0;

	// Calculate lift/header bar percentage
	const maxShift = 30;
	const liftHeaderBarWidth = Math.min(50, (Math.abs(liftAmount) / maxShift) * 50);

	// 4. Target Heading
	const optimalHeading = getOptimalHeading(boat.tack, windDir, true);
	const headingDelta = angleDiff(boat.rotation, optimalHeading);
	const headingStatusInfo = getStatusFromDelta(headingDelta, 3, 5, {
		excellent: 'On Course',
		good: 'Close',
		poor: 'Off Course'
	});
	const headingStatusLabel = headingStatusInfo.label;

	// 5. Speed
	const currentSpeed = BOAT_SPEED;
	const targetSpeed = BOAT_SPEED;
	const speedDelta = currentSpeed - targetSpeed;

	// 6. Mode
	let mode: 'PINCHING' | 'FOOTING' | 'VMG MODE' | 'POINTING';
	if (atw < targetATW - 3) {
		mode = 'PINCHING';
	} else if (atw > targetATW + 5) {
		mode = 'FOOTING';
	} else if (Math.abs(headingDelta) < 3) {
		mode = 'VMG MODE';
	} else if (headingDelta < -3) {
		mode = 'POINTING';
	} else {
		mode = 'FOOTING';
	}

	const isPinching = mode === 'PINCHING';
	const isFooting = mode === 'FOOTING';

	// 7. Tack Advantage
	const oppositeTack = !boat.tack;
	const oppositeOptHeading = getOptimalHeading(oppositeTack, windDir, true);
	const currentCourseAxis = windwardMark
		? getCourseAxis(boat.x, boat.y, windwardMark.x, windwardMark.y)
		: 0;
	const currentError = windwardMark ? Math.abs(angleDiff(boat.rotation, currentCourseAxis)) : 0;
	const oppositeError = windwardMark ? Math.abs(angleDiff(oppositeOptHeading, currentCourseAxis)) : 0;
	const tackAdvantage =
		currentError < oppositeError ? oppositeError - currentError : -(currentError - oppositeError);
	const tackAdvantagePercent =
		currentError + oppositeError > 0
			? Math.round((1 - currentError / (currentError + oppositeError)) * 100)
			: 0;
	const tackAdvantageStatus = tackAdvantage < 0 ? 'advantage' : 'disadvantage';
	const tackAdvantageStatusColor = tackAdvantage < 0 ? '#28a745' : '#dc3545';
	const tackAdvantageStatusLabel = tackAdvantage < 0 ? 'Better' : 'Worse';

	// 8. Power State
	let powerState: 'UNDERPOWERED' | 'OVERPOWERED' | 'POWERED';
	if (atw < targetATW - 5) {
		powerState = 'UNDERPOWERED';
	} else if (atw > targetATW + 8) {
		powerState = 'OVERPOWERED';
	} else {
		powerState = 'POWERED';
	}
	const powerLevel = Math.max(0, Math.min(1, 1 - Math.abs(atwDelta) / 10));

	// 9. Decision Flag
	let decisionFlag: 'TACK NOW' | 'TACK SOON' | 'HOLD';
	if (isHeader && Math.abs(liftAmount) > 15 && vmgEfficiency < 0.85) {
		decisionFlag = 'TACK NOW';
	} else if (isHeader && Math.abs(liftAmount) > 8 && vmgEfficiency < 0.9) {
		decisionFlag = 'TACK SOON';
	} else if (tackAdvantage < -5 && vmgEfficiency < 0.9) {
		decisionFlag = 'TACK SOON';
	} else {
		decisionFlag = 'HOLD';
	}

	return {
		// ATW
		atw,
		targetATW,
		atwDelta,
		atwColor,
		atwStatus: atwStatusInfo.status,
		atwStatusColor: atwStatusInfo.color,
		atwStatusLabel,

		// VMG
		vmg,
		vmgEfficiency,
		vmgPercent,
		vmgStatus,
		vmgStatusColor,
		vmgStatusLabel,
		vmgStatusBgColor,
		optimalVMG: BOAT_SPEED,

		// Lift/Header
		isLift,
		isHeader,
		liftAmount,
		liftHeaderBarWidth,

		// Heading
		optimalHeading,
		headingDelta,
		headingStatus: headingStatusInfo.status,
		headingStatusColor: headingStatusInfo.color,
		headingStatusLabel,

		// Speed
		currentSpeed,
		targetSpeed,
		speedDelta,

		// Mode
		mode,
		isPinching,
		isFooting,

		// Tack Advantage
		tackAdvantage,
		tackAdvantagePercent,
		tackAdvantageStatus,
		tackAdvantageStatusColor,
		tackAdvantageStatusLabel,

		// Power State
		powerState,
		powerLevel,

		// Decision Flag
		decisionFlag
	};
}

/**
 * Calculate VMG trend (up, down, stable)
 */
export function calculateVMGTrend(currentVMG: number, previousVMG?: number): 'up' | 'down' | 'stable' {
	if (previousVMG === undefined) return 'stable';
	if (currentVMG > previousVMG) return 'up';
	if (currentVMG < previousVMG) return 'down';
	return 'stable';
}

/**
 * Calculate position rank (1st, 2nd, etc.) based on distance to windward mark
 */
export function calculatePosition(
	players: Array<{ x: number; y: number }>,
	playerIndex: number,
	windwardMark: { x: number; y: number } | null
): number | null {
	if (!windwardMark || !players) return null;

	function distance(x1: number, y1: number, x2: number, y2: number): number {
		return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
	}

	const distances = players.map((p, idx) => ({
		index: idx,
		distance: distance(p.x, p.y, windwardMark.x, windwardMark.y)
	}));
	distances.sort((a, b) => a.distance - b.distance);
	const rank = distances.findIndex(d => d.index === playerIndex) + 1;
	return rank;
}

/**
 * Calculate time since last significant wind shift
 */
export function calculateTimeSinceShift(
	liftHeaderResult: { errorChange: number } | null,
	lastShiftTime: number
): { timeSinceShift: number; newLastShiftTime: number } {
	const now = Date.now();
	if (liftHeaderResult && Math.abs(liftHeaderResult.errorChange) > 5) {
		return {
			timeSinceShift: 0,
			newLastShiftTime: now
		};
	}
	return {
		timeSinceShift: Math.floor((now - lastShiftTime) / 1000),
		newLastShiftTime: lastShiftTime
	};
}

