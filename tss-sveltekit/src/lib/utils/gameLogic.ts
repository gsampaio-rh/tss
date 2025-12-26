import type { Game } from '../types/game';
import type { Boat } from '../types/boat';
import { TurnType } from '../types/game';

// Constants for polar model
export const OPT_UPWIND_ANGLE = 45; // Optimal upwind angle (degrees)
export const OPT_DOWNWIND_ANGLE = 155; // Optimal downwind angle (degrees)

/**
 * Calculate shortest signed angle difference between two angles
 * Returns value in range [-180°, +180°]
 * Positive = second angle is clockwise from first
 * Negative = second angle is counter-clockwise from first
 */
export function angleDiff(a: number, b: number): number {
  let diff = b - a;
  // Normalize to [-180, 180]
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return Math.sqrt((dx * dx) + (dy * dy));
}

/**
 * Get rotation angle between two points (bearing from point1 to point2)
 * Returns angle in degrees, 0° = north, clockwise positive
 */
export function getRotateAngle(x1: number, y1: number, x2: number, y2: number): number {
  return (Math.atan2(x2 - x1, -(y2 - y1)) * 180 / Math.PI);
}

/**
 * Calculate course axis (bearing from boat to windward mark)
 */
export function getCourseAxis(boatX: number, boatY: number, markX: number, markY: number): number {
  return getRotateAngle(boatX, boatY, markX, markY);
}

/**
 * Calculate optimal heading for a given tack and wind direction
 * @param tack - true for port, false for starboard
 * @param windDir - true wind direction in degrees
 * @param isUpwind - true if sailing upwind, false if downwind
 * @returns Optimal heading in degrees
 */
export function getOptimalHeading(tack: boolean, windDir: number, isUpwind: boolean = true): number {
  const optAngle = isUpwind ? OPT_UPWIND_ANGLE : OPT_DOWNWIND_ANGLE;
  
  if (tack) {
    // Port tack: wind comes from starboard, sail at +optAngle relative to wind
    return windDir + optAngle;
  } else {
    // Starboard tack: wind comes from port, sail at -optAngle relative to wind
    return windDir - optAngle;
  }
}

/**
 * Calculate lift/header for a wind shift
 * Returns: { isLift: boolean, isHeader: boolean, errorChange: number }
 * 
 * According to spec: Lift = wind shift allows boat to sail closer to mark
 * Header = wind shift forces boat away from mark
 * 
 * This is calculated relative to course axis, NOT boat's current angle
 */
export function calculateLiftHeader(
  boat: Boat,
  boatX: number,
  boatY: number,
  markX: number,
  markY: number,
  windDirPrev: number,
  windDirNow: number,
  isUpwind: boolean = true
): { isLift: boolean; isHeader: boolean; errorChange: number; errorBefore: number; errorAfter: number } {
  // Calculate course axis (bearing to mark)
  const courseAxis = getCourseAxis(boatX, boatY, markX, markY);
  
  // Calculate optimal headings before and after wind shift
  const optHeadingBefore = getOptimalHeading(boat.tack, windDirPrev, isUpwind);
  const optHeadingAfter = getOptimalHeading(boat.tack, windDirNow, isUpwind);
  
  // Calculate error from course axis (how far from optimal course to mark)
  const errBefore = Math.abs(angleDiff(optHeadingBefore, courseAxis));
  const errAfter = Math.abs(angleDiff(optHeadingAfter, courseAxis));
  
  // Lift = error decreased (can sail closer to mark)
  // Header = error increased (forced away from mark)
  const errorChange = errAfter - errBefore;
  const isLift = errorChange < 0;
  const isHeader = errorChange > 0;
  
  return {
    isLift,
    isHeader,
    errorChange: Math.abs(errorChange),
    errorBefore: errBefore,
    errorAfter: errAfter
  };
}

/**
 * Calculate VMG (Velocity Made Good) toward the mark
 * VMG = boatSpeed * cos(angleDiff(heading, courseAxis))
 */
export function calculateVMG(
  boatHeading: number,
  boatX: number,
  boatY: number,
  markX: number,
  markY: number,
  boatSpeed: number = 1.0
): number {
  const courseAxis = getCourseAxis(boatX, boatY, markX, markY);
  const headingError = angleDiff(boatHeading, courseAxis);
  return boatSpeed * Math.cos(headingError * Math.PI / 180);
}

/**
 * Calculate VMG efficiency (current VMG / optimal VMG)
 * Returns value between 0 and 1 (or > 1 if exceeding optimal)
 */
export function calculateVMGEfficiency(
  boatHeading: number,
  boatX: number,
  boatY: number,
  markX: number,
  markY: number,
  boatSpeed: number = 1.0,
  isUpwind: boolean = true
): number {
  const currentVMG = calculateVMG(boatHeading, boatX, boatY, markX, markY, boatSpeed);
  // Optimal VMG is when heading is perfectly aligned with course axis
  const optimalVMG = boatSpeed; // cos(0°) = 1
  return currentVMG / optimalVMG;
}

/**
 * Check if a point is inside a dirty air zone (trapezoid)
 * Dirty air zones extend leeward (downwind) from a boat
 */
export function isPointInDirtyAirZone(
  pointX: number,
  pointY: number,
  sourceBoatX: number,
  sourceBoatY: number,
  windDir: number,
  zoneLength: number = 8,
  zoneWidthStart: number = 1.5,
  zoneWidthEnd: number = 4,
  angleSpread: number = 35
): { inZone: boolean; intensity: number } {
  // Calculate leeward direction (opposite to wind)
  const leewardAngle = (windDir + 180) % 360;
  const leewardRad = (leewardAngle * Math.PI) / 180;
  
  // Vector from source boat to point
  const dx = pointX - sourceBoatX;
  const dy = pointY - sourceBoatY;
  
  // Distance from source boat
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // If point is too far, it's not in the zone
  if (dist > zoneLength * 1.2) {
    return { inZone: false, intensity: 0 };
  }
  
  // Angle from source boat to point
  const pointAngle = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  const angleDiffValue = Math.abs(angleDiff(pointAngle, leewardAngle));
  
  // Check if point is within the angular spread
  if (angleDiffValue > angleSpread) {
    return { inZone: false, intensity: 0 };
  }
  
  // Calculate zone width at this distance
  const t = Math.min(dist / zoneLength, 1); // Normalized distance (0 to 1)
  const zoneWidth = zoneWidthStart + (zoneWidthEnd - zoneWidthStart) * t;
  
  // Check if point is within the width (perpendicular distance from center line)
  const centerLineAngle = leewardAngle;
  const perpAngle = (centerLineAngle + 90) % 360;
  const perpRad = (perpAngle * Math.PI) / 180;
  
  // Project point onto perpendicular line
  const perpDist = Math.abs(
    dx * Math.sin(perpRad) - dy * Math.cos(perpRad)
  );
  
  if (perpDist > zoneWidth / 2) {
    return { inZone: false, intensity: 0 };
  }
  
  // Calculate intensity based on distance and position
  // Closer to source boat = higher intensity
  // Closer to center line = higher intensity
  const distanceFactor = 1 - (dist / zoneLength); // 1 at boat, 0 at end
  const centerFactor = 1 - (perpDist / (zoneWidth / 2)); // 1 at center, 0 at edge
  const intensity = Math.max(0, Math.min(1, distanceFactor * centerFactor));
  
  return { inZone: true, intensity };
}

/**
 * Check if a boat is in dirty air from any other boat
 * Returns the maximum intensity of dirty air affecting the boat
 */
export function getDirtyAirEffect(
  boat: Boat,
  boatX: number,
  boatY: number,
  allBoats: Boat[],
  windDir: number
): { inDirtyAir: boolean; intensity: number; affectedBy: number[] } {
  let maxIntensity = 0;
  const affectedBy: number[] = [];
  
  for (let i = 0; i < allBoats.length; i++) {
    const otherBoat = allBoats[i];
    
    // Skip self
    if (otherBoat === boat) continue;
    
    // Check leeward zone (main dirty air zone)
    const leewardCheck = isPointInDirtyAirZone(
      boatX,
      boatY,
      otherBoat.x,
      otherBoat.y,
      windDir,
      8, // zoneLength
      1.5, // zoneWidthStart
      4, // zoneWidthEnd
      35 // angleSpread
    );
    
    // Check windward zone (smaller, affects boats ahead)
    const windwardCheck = isPointInDirtyAirZone(
      boatX,
      boatY,
      otherBoat.x,
      otherBoat.y,
      windDir,
      3, // zoneLength (shorter)
      1, // zoneWidthStart
      2, // zoneWidthEnd
      25 // angleSpread (narrower)
    );
    
    const intensity = Math.max(leewardCheck.intensity, windwardCheck.intensity);
    
    if (leewardCheck.inZone || windwardCheck.inZone) {
      if (intensity > maxIntensity) {
        maxIntensity = intensity;
      }
      affectedBy.push(i);
    }
  }
  
  return {
    inDirtyAir: maxIntensity > 0,
    intensity: maxIntensity,
    affectedBy
  };
}

/**
 * Calculate distance to a line
 */
export function distanceToLine(x: number, y: number, lX: number, lY: number, angle: number): number {
  // Convert coordinate system
  const adjustedAngle = angle - 90;
  const adjustedY = -y;
  const adjustedLY = -lY;
  
  const rad = ((adjustedAngle - 90) * Math.PI / 180);
  return Math.abs(
    Math.cos(rad) * (adjustedLY - adjustedY) -
    Math.sin(rad) * (lX - x)
  );
}

/**
 * Execute a boat's turn
 * @param enableDirtyAirEffects - Whether to apply dirty air speed/angle penalties
 */
export function executeBoatTurn(boat: Boat, game: Game, enableDirtyAirEffects: boolean = false): void {
  const initialTack = boat.tack;
  const initialRotation = boat.rotation;
  const initialX = boat.x;
  const initialY = boat.y;
  const initialTurnType = boat.turntype;
  
  console.log(`[BOAT TURN START] Boat: ${boat.name || 'Unnamed'}, Turn: ${game.turncount}`);
  console.log(`  Initial State: tack=${initialTack}, rotation=${initialRotation.toFixed(1)}°, pos=(${initialX.toFixed(2)}, ${initialY.toFixed(2)}), turntype=${TurnType[initialTurnType]}`);
  
  // Get the turn type - in Svelte, this is already set on the boat.turntype property
  const selectedTurnType = boat.getTurn();
  console.log(`  Selected Turn Type: ${TurnType[selectedTurnType]} (from getTurn())`);
  console.log(`  Boat.turntype before assignment: ${TurnType[boat.turntype]}`);
  boat.turntype = selectedTurnType;
  console.log(`  Boat.turntype after assignment: ${TurnType[boat.turntype]}`);
  
  const points: Array<{ x: number; y: number }> = [];
  let moveDist = 1;
  
  if (boat.turntype === TurnType.Tack) {
    console.log(`  [TACKING] Before: tack=${boat.tack}, rotation=${boat.rotation.toFixed(1)}°`);
    boat.tack = !boat.tack;
    const currentWind = game.getWind(game.turncount);
    console.log(`  [TACKING] Current wind: ${currentWind.toFixed(1)}°`);
    
    if (boat.tack) {
      boat.rotation = 45 + currentWind;
      console.log(`  [TACKING] After: tack=PORT (true), rotation=${boat.rotation.toFixed(1)}° (45 + ${currentWind.toFixed(1)})`);
    } else {
      boat.rotation = -45 + currentWind;
      console.log(`  [TACKING] After: tack=STARBOARD (false), rotation=${boat.rotation.toFixed(1)}° (-45 + ${currentWind.toFixed(1)})`);
    }
    
    boat.turntype = TurnType.Forward;
    console.log(`  [TACKING] Changed turntype to Forward after tack`);
  }
  
  while (moveDist > 0) {
    if (!boat.finished) {
      const dist = distance(boat.x, boat.y, game.marks[2].x, game.marks[2].y);
      
      if (moveDist >= dist && game.isOutLaneline(boat.x, boat.y)) {
        boat.x = game.marks[2].x;
        boat.y = game.marks[2].y - 0.1;
        points.push({ x: boat.x, y: boat.y });
        moveDist -= dist;
        
        boat.finished = game.turncount * 60 + (60 - moveDist * 60);
        
        boat.tack = false;
        boat.rotation = -100;
      } else if (
        boat.turntype === TurnType.Forward &&
        boat.y - Math.cos(boat.rotation * Math.PI / 180) * moveDist <= game.marks[2].y
      ) {
        if (boat.y > game.marks[2].y) {
          const markDistance = distanceToLine(
            boat.x, boat.y, game.marks[2].x, game.marks[2].y, 0
          );
          
          boat.x += Math.sin(boat.rotation * Math.PI / 180) * markDistance;
          boat.y -= Math.cos(boat.rotation * Math.PI / 180) * markDistance;
          
          points.push({ x: boat.x, y: boat.y });
          moveDist -= markDistance;
        }
        
        boat.turntype = TurnType.ToMark;
      } else {
        // Handle boundary conditions
        if (boat.x < 0.5) {
          console.log(`  [BOUNDARY] Boat hit left boundary (x=${boat.x.toFixed(2)}), forcing tack=PORT`);
          boat.tack = true;
        }
        if (boat.x > game.width - 0.5) {
          console.log(`  [BOUNDARY] Boat hit right boundary (x=${boat.x.toFixed(2)}), forcing tack=STARBOARD`);
          boat.tack = false;
        }
        
        if (boat.turntype === TurnType.ToMark) {
          if (game.isOutLaneline(boat.x, boat.y)) {
            boat.rotation = getRotateAngle(boat.x, boat.y, game.marks[2].x, game.marks[2].y);
            boat.x += Math.sin(boat.rotation * Math.PI / 180) * moveDist;
            boat.y -= Math.cos(boat.rotation * Math.PI / 180) * moveDist;
            points.push({ x: boat.x, y: boat.y });
            moveDist = 0.0;
            const oldTack = boat.tack;
            boat.tack = boat.rotation > 0;
            if (oldTack !== boat.tack) {
              console.log(`  [TO MARK] Tack changed from ${oldTack} to ${boat.tack} (rotation=${boat.rotation.toFixed(1)}° > 0)`);
            }
          } else {
            let moveAngle: number;
            let lanelineAngle: number;
            
            if (boat.tack) {
              lanelineAngle = -45 - game.getWind(game.turncount);
              moveAngle = 45 + game.getWind(game.turncount);
            } else {
              lanelineAngle = 45 - game.getWind(game.turncount);
              moveAngle = -45 + game.getWind(game.turncount);
            }
            
            boat.rotation = moveAngle;
            
            const lanelineDistance = distanceToLine(
              boat.x, boat.y, game.marks[2].x, game.marks[2].y, lanelineAngle
            );
            
            if (lanelineDistance < moveDist) {
              boat.x += Math.sin(boat.rotation * Math.PI / 180) * lanelineDistance;
              boat.y -= Math.cos(boat.rotation * Math.PI / 180) * lanelineDistance;
              points.push({ x: boat.x, y: boat.y });
              moveDist -= lanelineDistance;
              boat.rotation = getRotateAngle(boat.x, boat.y, game.marks[2].x, game.marks[2].y);
            } else {
              boat.x += Math.sin(boat.rotation * Math.PI / 180) * moveDist;
              boat.y -= Math.cos(boat.rotation * Math.PI / 180) * moveDist;
              points.push({ x: boat.x, y: boat.y });
              moveDist = 0.0;
            }
          }
        } else {
          const currentWind = game.getWind(game.turncount);
          const windDir = currentWind * 2; // Convert to display angle
          
          // Calculate base rotation
          let baseRotation: number;
          if (boat.tack) {
            baseRotation = 45 + currentWind;
          } else {
            baseRotation = -45 + currentWind;
          }
          
          // Apply dirty air effects (if enabled)
          if (enableDirtyAirEffects) {
            const dirtyAirEffect = getDirtyAirEffect(boat, boat.x, boat.y, game.players, windDir);
            
            if (dirtyAirEffect.inDirtyAir) {
            // Dirty air affects:
            // 1. Speed reduction (15-30% based on intensity)
            const speedReduction = 0.15 + (dirtyAirEffect.intensity * 0.15); // 15-30% reduction
            moveDist *= (1 - speedReduction);
            
            // 2. Angle adjustment - boat needs to foot off (open angle) to maintain speed
            // In dirty air, boat can't point as high, needs to sail lower
            const angleAdjustment = dirtyAirEffect.intensity * 5; // Up to 5° adjustment
            if (boat.tack) {
              // Port tack: rotate clockwise (increase angle)
              baseRotation += angleAdjustment;
            } else {
              // Starboard tack: rotate counter-clockwise (decrease angle)
              baseRotation -= angleAdjustment;
            }
            
              console.log(`  [DIRTY AIR] Intensity: ${(dirtyAirEffect.intensity * 100).toFixed(1)}%, Speed reduction: ${(speedReduction * 100).toFixed(1)}%, Angle adjustment: ${angleAdjustment.toFixed(1)}°`);
            }
          }
          
          boat.rotation = baseRotation;
          
          if (boat.tack) {
            console.log(`  [FORWARD] Port tack: rotation=${boat.rotation.toFixed(1)}° (base: ${(45 + currentWind).toFixed(1)}°)`);
          } else {
            console.log(`  [FORWARD] Starboard tack: rotation=${boat.rotation.toFixed(1)}° (base: ${(-45 + currentWind).toFixed(1)}°)`);
          }
          
          boat.x += Math.sin(boat.rotation * Math.PI / 180) * moveDist;
          boat.y -= Math.cos(boat.rotation * Math.PI / 180) * moveDist;
          points.push({ x: boat.x, y: boat.y });
          moveDist = 0.0;
        }
        
        boat.rotation = boat.rotation % 360;
      }
    } else {
      console.log(`  [FINISHED] Boat already finished, moving with rotation=${boat.rotation.toFixed(1)}°`);
      boat.x += Math.sin(boat.rotation * Math.PI / 180) * moveDist;
      boat.y -= Math.cos(boat.rotation * Math.PI / 180) * moveDist;
      points.push({ x: boat.x, y: boat.y });
      moveDist = 0.0;
    }
  }
  
  console.log(`[BOAT TURN END] Boat: ${boat.name || 'Unnamed'}`);
  console.log(`  Final State: tack=${boat.tack}, rotation=${boat.rotation.toFixed(1)}°, pos=(${boat.x.toFixed(2)}, ${boat.y.toFixed(2)}), turntype=${TurnType[boat.turntype]}`);
  console.log(`  Movement: (${initialX.toFixed(2)}, ${initialY.toFixed(2)}) → (${boat.x.toFixed(2)}, ${boat.y.toFixed(2)})`);
  console.log(`  Points: ${points.length} points recorded`);
  
  boat.setTurn(boat.turntype);
  boat.saveTurn(
    boat.turntype,
    points,
    boat.rotation,
    boat.tack,
    boat.finished
  );
}
