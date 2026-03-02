/**
 * Apparent Wind Calculation Utilities
 * 
 * Calculates apparent wind including leeway and downwash effects for realistic sail aerodynamics.
 */

export interface ApparentWindResult {
	angle: number; // Degrees
	speed: number; // Normalized speed
	vx: number; // X component
	vy: number; // Y component
}

/**
 * Calculate leeway angle based on boat conditions
 * Leeway = sideways drift due to lift generation from sails + keel
 * 
 * @param boatRotation - Boat heading in degrees
 * @param trueWindDir - True wind direction in degrees
 * @param boatSpeed - Boat speed multiplier (0.7-1.0)
 * @returns Leeway angle in degrees (positive = leeward drift)
 */
export function calculateLeewayAngle(
	boatRotation: number,
	trueWindDir: number,
	boatSpeed: number = 1.0
): number {
	// Calculate Angle to Wind (ATW)
	const atw = Math.abs(((boatRotation - trueWindDir + 180) % 360) - 180);
	
	// Leeway is greater when:
	// - Sailing upwind (smaller ATW)
	// - Pinching (very close to wind)
	// - Slower speed (less lift)
	
	// Base leeway: 3-6° for dinghy-scale boats
	const BASE_LEEWAY = 4.0; // degrees
	
	// Increase leeway when pinching (ATW < 45°)
	let leewayMultiplier = 1.0;
	if (atw < 45) {
		// More leeway when pinching
		leewayMultiplier = 1.0 + (45 - atw) / 45 * 0.5; // Up to 1.5x when very close to wind
	}
	
	// Reduce leeway with speed (faster = more lift = less drift)
	const speedFactor = 0.7 + boatSpeed * 0.3; // 0.7-1.0 range
	
	// Leeway direction: always to leeward (away from wind)
	// Determine which side is leeward based on tack
	const windFromBoat = ((trueWindDir - boatRotation + 180) % 360) - 180;
	const leewaySign = windFromBoat > 0 ? 1 : -1; // Positive = port tack leeway, negative = starboard
	
	return BASE_LEEWAY * leewayMultiplier * speedFactor * leewaySign;
}

/**
 * Calculate apparent wind including leeway effects
 * Apparent wind = True wind - Boat velocity vector + Leeway-induced flow rotation
 * 
 * @param boatRotation - Boat heading in degrees
 * @param trueWindDir - True wind direction in degrees
 * @param boatSpeed - Boat speed multiplier (0.7-1.0)
 * @returns Apparent wind result
 */
export function calculateApparentWind(
	boatRotation: number,
	trueWindDir: number,
	boatSpeed: number = 1.0
): ApparentWindResult {
	const BOAT_SPEED_BASE = 1.0; // Base speed units per turn
	
	// True wind vector (normalized)
	const trueWindRad = (trueWindDir * Math.PI) / 180;
	const trueWindX = Math.sin(trueWindRad);
	const trueWindY = -Math.cos(trueWindRad);
	
	// Boat velocity vector (normalized, opposite to heading)
	const boatRad = (boatRotation * Math.PI) / 180;
	const boatVelX = Math.sin(boatRad) * BOAT_SPEED_BASE * boatSpeed;
	const boatVelY = -Math.cos(boatRad) * BOAT_SPEED_BASE * boatSpeed;
	
	// Basic apparent wind = True wind - Boat velocity
	let apparentWindX = trueWindX - boatVelX;
	let apparentWindY = trueWindY - boatVelY;
	
	// Add leeway-induced flow rotation
	// Leeway causes local airflow to rotate slightly to leeward
	const leewayAngle = calculateLeewayAngle(boatRotation, trueWindDir, boatSpeed);
	const leewayRad = (leewayAngle * Math.PI) / 180;
	
	// Rotate apparent wind vector by leeway angle (to leeward)
	const cosLeeway = Math.cos(leewayRad);
	const sinLeeway = Math.sin(leewayRad);
	const rotatedX = apparentWindX * cosLeeway - apparentWindY * sinLeeway;
	const rotatedY = apparentWindX * sinLeeway + apparentWindY * cosLeeway;
	
	apparentWindX = rotatedX;
	apparentWindY = rotatedY;
	
	// Calculate final angle and magnitude
	const apparentWindAngle = Math.atan2(apparentWindX, -apparentWindY);
	const apparentWindSpeed = Math.sqrt(apparentWindX * apparentWindX + apparentWindY * apparentWindY);
	
	return {
		angle: (apparentWindAngle * 180) / Math.PI,
		speed: apparentWindSpeed,
		vx: apparentWindX,
		vy: apparentWindY
	};
}

/**
 * Calculate disturbed wind in dirty air zone
 * Includes speed reduction and leeward rotation (downwash from sails)
 * 
 * @param baseWindDir - Base wind direction (degrees, where wind comes FROM)
 * @param distance - Distance from source boat (boat lengths)
 * @param intensity - Dirty air intensity (0-1)
 * @param sourceBoatRotation - Source boat's heading (degrees) - used to determine leeward direction
 * @returns Disturbed wind direction (degrees) and speed multiplier
 */
export function calculateDisturbedWind(
	baseWindDir: number,
	distance: number,
	intensity: number,
	sourceBoatRotation?: number
): { angle: number; speedMultiplier: number } {
	// Speed reduction (already implemented)
	const speedMultiplier = 1.0 - intensity * 0.4; // Up to 40% reduction
	
	// Wind rotation: rotate leeward (5-15° near boat, decaying with distance)
	// Downwash from sails causes air to exit angled downward and leeward
	const MAX_ROTATION = 15; // degrees
	const ROTATION_DECAY_DISTANCE = 5; // boat lengths
	
	// Rotation decays with distance
	const distanceFactor = Math.max(0, 1 - distance / ROTATION_DECAY_DISTANCE);
	const rotationAngle = MAX_ROTATION * intensity * distanceFactor;
	
	// Determine leeward direction
	// Leeward = 90° to the side away from the wind (perpendicular to wind, away from source)
	let leewardRotation = 0;
	if (sourceBoatRotation !== undefined) {
		// Determine which side is leeward based on boat's tack relative to wind
		const windFromBoat = ((baseWindDir - sourceBoatRotation + 180) % 360) - 180;
		// Leeward is 90° perpendicular to wind, in the direction away from wind source
		leewardRotation = windFromBoat > 0 ? 90 : -90; // Port tack: +90°, Starboard tack: -90°
	} else {
		// Fallback: rotate perpendicular to wind direction
		leewardRotation = 90;
	}
	
	// Rotate wind direction leeward (away from wind source)
	const disturbedAngle = baseWindDir + rotationAngle * Math.sign(leewardRotation);
	
	return {
		angle: disturbedAngle,
		speedMultiplier: Math.max(0.3, speedMultiplier) // Minimum 30% speed
	};
}

