/**
 * Mark Domain Entity
 * Represents a mark (buoy) in the race course
 */

import { Position } from '../value-objects/Position';
import { MarkType } from '../../types/game';

export class MarkEntity {
	constructor(
		private readonly _position: Position,
		private readonly _type: MarkType
	) {}

	get position(): Position {
		return this._position;
	}

	get x(): number {
		return this._position.x;
	}

	get y(): number {
		return this._position.y;
	}

	get type(): MarkType {
		return this._type;
	}

	equals(other: MarkEntity): boolean {
		return this._position.equals(other._position) && this._type === other._type;
	}

	// Convert to legacy format for compatibility
	toLegacyMark(): { x: number; y: number; type: MarkType } {
		return {
			x: this._position.x,
			y: this._position.y,
			type: this._type
		};
	}
}


