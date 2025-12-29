/**
 * Domain Entities exports
 */

export { BoatEntity, type BoatTurn } from './Boat';
export { MarkEntity } from './Mark';
export { GameEntity } from './Game';
export { gameEntityToLegacyGame, legacyGameToGameEntity, createGameEntityFromScenario } from './GameAdapter';

