/**
 * Angle Value Object
 * Represents an angle in degrees with normalization and validation
 */

export class Angle {
	private static readonly MIN_DEGREES = -360;
	private static readonly MAX_DEGREES = 360;

	private constructor(private readonly _degrees: number) {
		if (!Number.isFinite(_degrees)) {
			throw new Error('Angle must be a finite number');
		}
	}

	/**
	 * Create an angle from degrees
	 */
	static fromDegrees(degrees: number): Angle {
		return new Angle(Angle.normalize(degrees));
	}

	/**
	 * Create an angle from radians
	 */
	static fromRadians(radians: number): Angle {
		return Angle.fromDegrees((radians * 180) / Math.PI);
	}

	/**
	 * Get angle in degrees
	 */
	get degrees(): number {
		return this._degrees;
	}

	/**
	 * Get angle in radians
	 */
	get radians(): number {
		return (this._degrees * Math.PI) / 180;
	}

	/**
	 * Normalize angle to range [-180, 180]
	 */
	normalize(): Angle {
		return Angle.fromDegrees(Angle.normalize(this._degrees));
	}

	/**
	 * Normalize angle to range [0, 360]
	 */
	normalizePositive(): Angle {
		let normalized = this._degrees % 360;
		if (normalized < 0) {
			normalized += 360;
		}
		return Angle.fromDegrees(normalized);
	}

	/**
	 * Calculate shortest signed angle difference to another angle
	 * Returns value in range [-180°, +180°]
	 * Positive = other angle is clockwise from this
	 * Negative = other angle is counter-clockwise from this
	 */
	angleDiff(other: Angle): number {
		let diff = other._degrees - this._degrees;
		// Normalize to [-180, 180]
		while (diff > 180) diff -= 360;
		while (diff < -180) diff += 360;
		return diff;
	}

	/**
	 * Add another angle
	 */
	add(other: Angle): Angle {
		return Angle.fromDegrees(this._degrees + other._degrees);
	}

	/**
	 * Subtract another angle
	 */
	subtract(other: Angle): Angle {
		return Angle.fromDegrees(this._degrees - other._degrees);
	}

	/**
	 * Check equality with another angle
	 */
	equals(other: Angle): boolean {
		return this.normalize()._degrees === other.normalize()._degrees;
	}

	/**
	 * Static helper to normalize degrees
	 */
	private static normalize(degrees: number): number {
		let normalized = degrees % 360;
		if (normalized > 180) {
			normalized -= 360;
		} else if (normalized <= -180) {
			normalized += 360;
		}
		return normalized;
	}

	/**
	 * Convert to plain number (degrees)
	 */
	toNumber(): number {
		return this._degrees;
	}
}


