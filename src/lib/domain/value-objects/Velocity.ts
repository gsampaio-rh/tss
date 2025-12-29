/**
 * Velocity Value Object
 * Represents velocity with magnitude and direction
 */

import { Angle } from './Angle';

export class Velocity {
	constructor(
		public readonly magnitude: number,
		public readonly direction: Angle
	) {
		if (!Number.isFinite(magnitude) || magnitude < 0) {
			throw new Error('Velocity magnitude must be a non-negative finite number');
		}
	}

	/**
	 * Create velocity from components
	 */
	static fromComponents(vx: number, vy: number): Velocity {
		const magnitude = Math.sqrt(vx * vx + vy * vy);
		const direction = Angle.fromRadians(Math.atan2(vy, vx));
		return new Velocity(magnitude, direction);
	}

	/**
	 * Get velocity components
	 */
	getComponents(): { vx: number; vy: number } {
		const radians = this.direction.radians;
		return {
			vx: this.magnitude * Math.cos(radians),
			vy: this.magnitude * Math.sin(radians)
		};
	}

	/**
	 * Scale velocity by a factor
	 */
	scale(factor: number): Velocity {
		return new Velocity(this.magnitude * factor, this.direction);
	}

	/**
	 * Add another velocity
	 */
	add(other: Velocity): Velocity {
		const thisComponents = this.getComponents();
		const otherComponents = other.getComponents();
		return Velocity.fromComponents(
			thisComponents.vx + otherComponents.vx,
			thisComponents.vy + otherComponents.vy
		);
	}

	/**
	 * Check equality with another velocity
	 */
	equals(other: Velocity): boolean {
		return (
			Math.abs(this.magnitude - other.magnitude) < 0.001 &&
			this.direction.equals(other.direction)
		);
	}

	/**
	 * Convert to plain object
	 */
	toObject(): { magnitude: number; direction: number } {
		return {
			magnitude: this.magnitude,
			direction: this.direction.toNumber()
		};
	}
}


