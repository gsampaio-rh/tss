/**
 * Math utilities for sailing analysis charts.
 * Polynomial regression for trend lines.
 */

/**
 * Least-squares polynomial fit.
 * Returns coefficients [a0, a1, a2, ...] such that y = a0 + a1*x + a2*x^2 + ...
 */
export function polyFit(xs: number[], ys: number[], degree: number): number[] {
	const n = xs.length;
	if (n === 0 || degree < 0) return [0];

	const d = Math.min(degree, n - 1);
	const cols = d + 1;

	// Build the normal equations: (X^T X) a = X^T y
	const XtX: number[][] = [];
	const XtY: number[] = [];

	for (let i = 0; i < cols; i++) {
		XtX[i] = [];
		for (let j = 0; j < cols; j++) {
			let sum = 0;
			for (let k = 0; k < n; k++) {
				sum += Math.pow(xs[k], i + j);
			}
			XtX[i][j] = sum;
		}
		let sum = 0;
		for (let k = 0; k < n; k++) {
			sum += ys[k] * Math.pow(xs[k], i);
		}
		XtY[i] = sum;
	}

	// Gaussian elimination with partial pivoting
	const aug: number[][] = XtX.map((row, i) => [...row, XtY[i]]);
	for (let col = 0; col < cols; col++) {
		let maxRow = col;
		for (let row = col + 1; row < cols; row++) {
			if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
				maxRow = row;
			}
		}
		[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

		if (Math.abs(aug[col][col]) < 1e-12) continue;

		for (let row = col + 1; row < cols; row++) {
			const factor = aug[row][col] / aug[col][col];
			for (let j = col; j <= cols; j++) {
				aug[row][j] -= factor * aug[col][j];
			}
		}
	}

	// Back-substitution
	const coeffs = new Array(cols).fill(0);
	for (let i = cols - 1; i >= 0; i--) {
		if (Math.abs(aug[i][i]) < 1e-12) continue;
		let sum = aug[i][cols];
		for (let j = i + 1; j < cols; j++) {
			sum -= aug[i][j] * coeffs[j];
		}
		coeffs[i] = sum / aug[i][i];
	}

	return coeffs;
}

/**
 * Evaluate a polynomial at x.
 * coeffs = [a0, a1, a2, ...] -> a0 + a1*x + a2*x^2 + ...
 */
export function polyEval(coeffs: number[], x: number): number {
	let result = 0;
	for (let i = 0; i < coeffs.length; i++) {
		result += coeffs[i] * Math.pow(x, i);
	}
	return result;
}
