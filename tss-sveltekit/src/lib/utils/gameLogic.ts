import type { Game } from '../types/game';
import type { Boat } from '../types/boat';
import { TurnType } from '../types/game';

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return Math.sqrt((dx * dx) + (dy * dy));
}

/**
 * Get rotation angle between two points
 */
export function getRotateAngle(x1: number, y1: number, x2: number, y2: number): number {
  return (Math.atan2(x2 - x1, -(y2 - y1)) * 180 / Math.PI);
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
