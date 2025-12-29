/**
 * CSS Formatting Utilities
 * 
 * Helper functions for formatting values for CSS properties.
 */

/**
 * Format a number as CSS pixels
 */
export function formatCssPx(val: number): string {
	return val.toFixed(3) + 'px';
}

/**
 * Format a number as CSS degrees
 */
export function formatCssDeg(val: number): string {
	return val.toFixed(3) + 'deg';
}

