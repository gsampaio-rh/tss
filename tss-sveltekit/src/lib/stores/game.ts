import { writable, derived } from 'svelte/store';
import { Game, TurnType } from '../types/game';
import { Boat } from '../types/boat';
import type { WindScenario } from '../types/wind';
import { executeBoatTurn } from '../utils/gameLogic';
import { COLORS } from '../types/game';
import { gameLogs } from './gameLogs';
import { settings } from './settings';

export const game = writable<Game | null>(null);
export const players = writable<Boat[]>([]);
export const turnCount = writable<number>(0);
export const isStart = writable<boolean>(true);
export const currentWindScenario = writable<WindScenario | null>(null);

// Derived stores
export const currentWind = derived(
  [game, turnCount],
  ([$game, $turnCount]) => {
    if (!$game) return 0;
    // Use turnCount directly (not +1) so wind[0] is shown at start
    return $game.getWind($turnCount);
  }
);

// Track previous wind for shift detection
export const previousWind = derived(
  [game, turnCount],
  ([$game, $turnCount]) => {
    if (!$game || $turnCount === 0) return 0;
    return $game.getWind($turnCount - 1);
  }
);

export const gameWidth = derived(game, $game => $game?.width ?? 0);
export const gameHeight = derived(game, $game => $game?.height ?? 0);
export const marks = derived(game, $game => $game?.marks ?? []);

// Game actions
export const gameActions = {
  createGame: (playercount: number, windscenario: WindScenario, colors: string[] = COLORS) => {
    const newGame = new Game();
    newGame.players = [];
    newGame.setWindFromScenario(windscenario);
    newGame.name = windscenario.name;
    newGame.currentStartPriority = 0;
    
    // Create initial players
    for (let i = 0; i < playercount; i++) {
      const color = newGame.findFreeColor(colors) || colors[i % colors.length];
      const boat = new Boat(6, newGame.height - 2, false, color);
      boat.startPriority = newGame.currentStartPriority++;
      newGame.players.push(boat);
    }
    
    newGame.placeBoatsOnStart();
    
    game.set(newGame);
    players.set(newGame.players);
    isStart.set(true);
    turnCount.set(0);
    currentWindScenario.set(windscenario);
    
    // Start logging
    gameLogs.startLog(
      newGame.name || windscenario.name || 'Untitled Game',
      windscenario,
      newGame.players,
      newGame.width,
      newGame.height
    );
  },

  addPlayer: (colors: string[]) => {
    game.update(g => {
      if (!g) return g;
      const color = g.findFreeColor(colors);
      if (!color) return g; // Too many boats
      
      const boat = new Boat(6, g.height - 2, false, color);
      boat.startPriority = g.currentStartPriority++;
      boat.startPos = 1; // Default to middle
      g.players.push(boat);
      g.placeBoatsOnStart();
      
      players.set(g.players);
      return g;
    });
  },
  
  updateStartPriority: (playerIndex: number, startPos: number) => {
    game.update(g => {
      if (!g) return g;
      const player = g.players[playerIndex];
      if (!player) return g;
      
      if (player.startPos !== startPos) {
        player.startPos = startPos;
        player.startPriority = g.currentStartPriority++;
        g.placeBoatsOnStart();
        players.set(g.players);
      }
      
      return g;
    });
  },
  
  applyStart: () => {
    game.update(g => {
      if (!g) return g;
      
      // Apply names and start positions
      for (const player of g.players) {
        if (!player.name) {
          const index = g.players.indexOf(player);
          player.name = `Player ${index + 1}`;
        }
        player.apply();
      }
      
      isStart.set(false);
      return g;
    });
  },

  removePlayer: (index: number) => {
    game.update(g => {
      if (!g) return g;
      g.players.splice(index, 1);
      g.placeBoatsOnStart();
      players.set(g.players);
      return g;
    });
  },

  turn: () => {
    game.update(g => {
      if (!g || g.isStart) {
        console.log(`[GAME TURN] Cannot turn - game is still in start phase`);
        return g;
      }
      
      console.log(`\n========== [GAME TURN ${g.turncount + 1}] ==========`);
      console.log(`[GAME TURN] Executing turn ${g.turncount + 1}`);
      console.log(`  Wind at turn ${g.turncount}: ${g.getWind(g.turncount).toFixed(1)}°`);
      console.log(`  Players: ${g.players.length}`);
      
      // Log all boat states before turn
      g.players.forEach((player, idx) => {
        console.log(`  Boat ${idx} (${player.name || 'Unnamed'}): tack=${player.tack}, rotation=${player.rotation.toFixed(1)}°, pos=(${player.x.toFixed(2)}, ${player.y.toFixed(2)}), turntype=${TurnType[player.turntype]}`);
      });
      
      g.turncount++;
      const currentWind = g.getWind(g.turncount);
      
      // Execute turn for each player
      // Get current settings to check if dirty air effects are enabled
      let enableDirtyAirEffects = false;
      const unsubscribe = settings.subscribe(s => {
        enableDirtyAirEffects = s.enableDirtyAirEffects;
      });
      unsubscribe(); // Immediately unsubscribe after getting value
      
      for (const player of g.players) {
        executeBoatTurn(player, g, enableDirtyAirEffects);
      }
      
      // Log this turn
      gameLogs.logTurn(g.turncount, currentWind, g.players);
      
      // Log all boat states after turn
      console.log(`[GAME TURN] After turn ${g.turncount}:`);
      g.players.forEach((player, idx) => {
        console.log(`  Boat ${idx} (${player.name || 'Unnamed'}): tack=${player.tack}, rotation=${player.rotation.toFixed(1)}°, pos=(${player.x.toFixed(2)}, ${player.y.toFixed(2)}), turntype=${TurnType[player.turntype]}`);
      });
      console.log(`========== [END TURN ${g.turncount}] ==========\n`);
      
      players.set(g.players);
      turnCount.set(g.turncount);
      return g;
    });
  },

  backTurn: () => {
    game.update(g => {
      if (!g) return g;
      
      if (g.turncount > 0) {
        g.turncount--;
        
        // Restore player positions from turns
        for (const player of g.players) {
          player.back(g.turncount);
        }
        
        players.set(g.players);
        turnCount.set(g.turncount);
      } else {
        isStart.set(true);
        g.isStart = true;
      }
      
      return g;
    });
  },

  reset: (addToCup: boolean = false) => {
    game.update(g => {
      if (!g) return g;
      
      g.turncount = 0;
      g.isStart = true;
      
      for (const player of g.players) {
        player.tack = false;
        player.rotation = -45;
        player.turns = [];
        player.isStart = true;
        player.finished = false;
        player.startPos = 1;
        player.startPriority = g.currentStartPriority++;
      }
      
      g.placeBoatsOnStart();
      
      turnCount.set(0);
      isStart.set(true);
      
      // TODO: Handle addToCup
      
      return g;
    });
  },

  startRace: () => {
    game.update(g => {
      if (!g) return g;
      g.isStart = false;
      isStart.set(false);
      return g;
    });
  },

  changeWind: (windscenario: WindScenario) => {
    game.update(g => {
      if (!g) return g;
      
      if (windscenario.israndom) {
        g.setWindFromRandom(windscenario);
      } else {
        g.setWindFromScenario(windscenario);
      }
      
      // Reset player positions
      for (const player of g.players) {
        player.y = g.height - 2;
      }
      g.placeBoatsOnStart();
      
      currentWindScenario.set(windscenario);
      return g;
    });
  }
};
