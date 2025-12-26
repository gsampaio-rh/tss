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
 */
export function executeBoatTurn(boat: Boat, game: Game): void {
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
          if (boat.tack) {
            boat.rotation = 45 + currentWind;
            console.log(`  [FORWARD] Port tack: rotation=${boat.rotation.toFixed(1)}° (45 + ${currentWind.toFixed(1)})`);
          } else {
            boat.rotation = -45 + currentWind;
            console.log(`  [FORWARD] Starboard tack: rotation=${boat.rotation.toFixed(1)}° (-45 + ${currentWind.toFixed(1)})`);
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
