/**
 * WindDirection Value Object
 * Represents wind direction with validation
 */

import { Angle } from './Angle';

export class WindDirection {
	private constructor(private readonly _angle: Angle) {}

	/**
	 * Create wind direction from degrees
	 */
	static fromDegrees(degrees: number): WindDirection {
		return new WindDirection(Angle.fromDegrees(degrees));
	}

	/**
	 * Get wind direction in degrees
	 */
	get degrees(): number {
		return this._angle.degrees;
	}

	/**
	 * Get wind direction as Angle
	 */
	get angle(): Angle {
		return this._angle;
	}

	/**
	 * Calculate wind vector components (normalized)
	 */
	getVector(): { x: number; y: number } {
		const radians = this._angle.radians;
		return {
			x: Math.cos(radians),
			y: Math.sin(radians)
		};
	}

	/**
	 * Calculate angle difference to another wind direction
	 */
	angleDiff(other: WindDirection): number {
		return this._angle.angleDiff(other._angle);
	}

	/**
	 * Check equality with another wind direction
	 */
	equals(other: WindDirection): boolean {
		return this._angle.equals(other._angle);
	}

	/**
	 * Convert to plain number (degrees)
	 */
	toNumber(): number {
		return this._angle.toNumber();
	}
}

