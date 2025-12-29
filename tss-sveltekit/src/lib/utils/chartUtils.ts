/**
 * Chart Utilities
 * 
 * Shared utilities for tactical metric charts.
 */

export interface ChartDimensions {
	width: number;
	height: number;
	padding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
}

export interface ChartRange {
	min: number;
	max: number;
	range: number;
}

export interface TurnRange {
	turnStart: number;
	turnRange: number;
}

export interface ChartCoords {
	x: number;
	y: number;
}

/**
 * Chart constants
 */
export const CHART_HEIGHT = 140;
export const CHART_PADDING = { top: 30, right: 20, bottom: 20, left: 40 };
export const CHART_WIDTH = 400;

/**
 * Calculate chart dimensions
 */
export function calculateChartDimensions(
	width: number = CHART_WIDTH,
	height: number = CHART_HEIGHT,
	padding: ChartDimensions['padding'] = CHART_PADDING
): { chartWidth: number; chartHeight: number } {
	return {
		chartWidth: width - padding.left - padding.right,
		chartHeight: height - padding.top - padding.bottom
	};
}

/**
 * Calculate turn range from history
 */
export function calculateTurnRange(
	history: Array<{ turn?: number }>
): TurnRange {
	if (history.length === 0) {
		return { turnStart: 0, turnRange: 1 };
	}

	const turns = history.map(h => h.turn ?? 0);
	const minTurn = Math.min(...turns);
	const maxTurn = Math.max(...turns);
	const turnRange = maxTurn - minTurn || 1;

	return {
		turnStart: minTurn,
		turnRange
	};
}

/**
 * Convert data point to chart coordinates
 */
export function toChartCoords(
	turn: number,
	value: number,
	turnStart: number,
	turnRange: number,
	minValue: number,
	valueRange: number,
	chartWidth: number,
	chartHeight: number,
	padding: ChartDimensions['padding'],
	chartHeightTotal: number
): ChartCoords {
	const x = ((turn - turnStart) / turnRange) * chartWidth + padding.left;
	const y =
		chartHeightTotal -
		padding.bottom -
		((value - minValue) / valueRange) * chartHeight;
	return { x, y };
}

/**
 * Generate SVG path from data points
 */
export function generatePath(
	history: Array<{ turn?: number; [key: string]: any }>,
	valueKey: string,
	toChartCoordsFn: (turn: number, value: number) => ChartCoords
): string {
	if (history.length === 0) return '';
	if (history.length === 1) {
		const turn = history[0].turn ?? 0;
		const value = history[0][valueKey];
		const { x, y } = toChartCoordsFn(turn, value);
		return `M ${x} ${y} L ${x} ${y}`;
	}
	const points = history.map(h => {
		const turn = h.turn ?? 0;
		const value = h[valueKey];
		const { x, y } = toChartCoordsFn(turn, value);
		return `${x},${y}`;
	});
	return `M ${points[0]} L ${points.slice(1).join(' L ')}`;
}

/**
 * Calculate opacity based on turn difference (fade older points)
 */
export function calculatePointOpacity(turnDiff: number, maxTurns: number = 60): number {
	return Math.max(0.3, 1 - (turnDiff / maxTurns) * 0.5);
}

