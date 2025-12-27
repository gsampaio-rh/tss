/**
 * Position Value Object
 * Represents a 2D position in the game world
 */

export class Position {
	constructor(
		public readonly x: number,
		public readonly y: number
	) {
		if (!Number.isFinite(x) || !Number.isFinite(y)) {
			throw new Error('Position coordinates must be finite numbers');
		}
	}

	/**
	 * Calculate distance to another position
	 */
	distanceTo(other: Position): number {
		const dx = Math.abs(this.x - other.x);
		const dy = Math.abs(this.y - other.y);
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	 * Calculate angle to another position (in degrees)
	 */
	angleTo(other: Position): number {
		const dx = other.x - this.x;
		const dy = other.y - this.y;
		return (Math.atan2(dy, dx) * 180) / Math.PI;
	}

	/**
	 * Create a new position offset by given x and y
	 */
	offset(dx: number, dy: number): Position {
		return new Position(this.x + dx, this.y + dy);
	}

	/**
	 * Check equality with another position
	 */
	equals(other: Position): boolean {
		return this.x === other.x && this.y === other.y;
	}

	/**
	 * Convert to plain object
	 */
	toObject(): { x: number; y: number } {
		return { x: this.x, y: this.y };
	}

	/**
	 * Create from plain object
	 */
	static fromObject(obj: { x: number; y: number }): Position {
		return new Position(obj.x, obj.y);
	}
}


