import type { Boat } from './boat';
import type { WindScenario } from './wind';

// Constants
export const GRID_SIZE = 20;
export const BOAT_SIZE = 32;
export const START_LINE_SIZE = 15;
export const COLORS = [
  'red', 'blue', 'black', 'green', 'cyan', 'magenta', 
  'purple', 'gray', 'yellow', 'darkred', 'darkblue', 'goldenrod'
];

export enum MarkType {
  StartLeft = 0,
  StartRight = 1,
  Mark1 = 2,
  Mark2 = 2,
  Mark3 = 4,
}

export interface Mark {
  x: number;
  y: number;
  type: MarkType;
}

export enum TurnType {
  Forward = 0,
  Tack = 1,
  ToMark = 2,
}

export interface Point {
  x: number;
  y: number;
}

export interface GameState {
  width: number;
  height: number;
  marks: Mark[];
  wind: number[];
  turncount: number;
  isStart: boolean;
  name: string;
  currentStartPriority: number;
  players: Boat[];
}

export interface WindScenarioRef {
  windscenario: WindScenario;
}

export class Game {
  players: Boat[] = [];
  width: number = 0;
  height: number = 0;
  marks: Mark[] = [];
  wind: number[] = [];
  currentStartPriority: number = 0;
  turncount: number = 0;
  isStart: boolean = true;
  name: string = '';

  getWind(index: number): number {
    return this.wind[index % this.wind.length];
  }

  isOutLaneline(x: number, y: number): boolean {
    const a = this.getRotateAngle(x, y, this.marks[2].x, this.marks[2].y);
    const currentWind = this.getWind(this.turncount);
    return (a - currentWind >= 44.99 || a - currentWind <= -44.99);
  }

  setMapData(windscenario: WindScenario): void {
    this.width = windscenario.width;
    this.height = windscenario.height;
    const startsize = windscenario.startsize || 15;
    this.marks = [
      { 
        x: (this.width - startsize) / 2, 
        y: this.height - 2, 
        type: MarkType.StartLeft 
      },
      { 
        x: this.width - (this.width - startsize) / 2, 
        y: this.height - 2, 
        type: MarkType.StartRight 
      },
      { 
        x: this.width / 2, 
        y: 2, 
        type: MarkType.Mark1 
      },
    ];
  }

  setWindFromScenario(windscenario: WindScenario): void {
    this.wind = [];
    const stepscount = windscenario.stepscount || 50;
    // Wind must always start at 0 so the windward mark makes sense
    // Store the first wind value from scenario to use as offset
    const firstWindValue = windscenario.wind.length > 0 ? windscenario.wind[0] : 0;
    
    // First turn always has wind = 0
    this.wind[0] = 0;
    
    // Subsequent turns use relative shifts from the scenario
    for (let i = 1; i < stepscount; i++) {
      const scenarioIndex = i % windscenario.wind.length;
      const scenarioWind = windscenario.wind[scenarioIndex];
      // Calculate relative shift from first value
      this.wind[i] = scenarioWind - firstWindValue;
    }
    this.setMapData(windscenario);
  }

  setWindFromRandom(windscenario: WindScenario): void {
    this.wind = [];
    
    // Wind must always start at 0 so the windward mark makes sense
    // Store the first wind value from scenario to use as offset
    const firstWindValue = windscenario.wind.length > 0 ? windscenario.wind[0] : 0;

    // First turn always has wind = 0
    this.wind.push(0);

    while (this.wind.length < 50) {
      const cards: number[] = [];
      for (let i = 0; i < windscenario.count!.length; i++) {
        for (let j = 0; j < windscenario.count![i]; j++) {
          cards.push(windscenario.wind[i]);
        }
      }
      while (cards.length > 0 && this.wind.length < 50) {
        const index = Math.floor(Math.random() * cards.length);
        const scenarioWind = cards[index];
        // Calculate relative shift from first value
        this.wind.push(scenarioWind - firstWindValue);
        cards.splice(index, 1);
      }
    }
    this.setMapData(windscenario);
  }

  findFreeColor(colors: string[]): string | null {
    for (let i = 0; i < colors.length; i++) {
      if (!this.players.find(o => o.color === colors[i])) {
        return colors[i];
      }
    }
    return null;
  }

  placeBoatsOnStart(): void {
    const boatsStartLeft: Boat[] = [];
    const boatsStartMiddle: Boat[] = [];
    const boatsStartRight: Boat[] = [];

    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      if (player.startPos === 0) {
        boatsStartLeft.push(player);
      } else if (player.startPos === 2) {
        boatsStartRight.push(player);
      } else {
        boatsStartMiddle.push(player);
      }
    }

    function compareBoatStartPriority(a: Boat, b: Boat): number {
      return a.startPriority - b.startPriority;
    }

    boatsStartLeft.sort(compareBoatStartPriority);
    boatsStartMiddle.sort(compareBoatStartPriority);
    boatsStartRight.sort(compareBoatStartPriority);

    const startdist = 0.5;
    for (let i = 0; i < boatsStartLeft.length; i++) {
      boatsStartLeft[i].x = this.marks[0].x + 1 + (i * startdist);
      boatsStartLeft[i].y = this.height - 2;
    }

    for (let i = 0; i < boatsStartMiddle.length; i++) {
      let k = 0.5;
      switch (i) {
        case 0:
        case 1:
          k = 1;
          break;
        case 3:
          k = 0.6;
          break;
      }
      if (i < 2) {
        k = 1;
      }
      if (i % 2 === 0) {
        boatsStartMiddle[i].x = (-i * startdist * k) + (this.width / 2);
      } else {
        boatsStartMiddle[i].x = (i * startdist * k) + (this.width / 2);
      }
      boatsStartMiddle[i].y = this.height - 2;
    }

    for (let i = 0; i < boatsStartRight.length; i++) {
      boatsStartRight[i].x = this.marks[1].x - 1 - (i * startdist);
      boatsStartRight[i].y = this.height - 2;
    }
  }

  getPlayerName(index: number): string {
    if (this.players[index].name === '') {
      return `Player ${index + 1}`;
    } else {
      return this.players[index].name;
    }
  }

  private getRotateAngle(x1: number, y1: number, x2: number, y2: number): number {
    return (Math.atan2(x2 - x1, -(y2 - y1)) * 180 / Math.PI);
  }
}
