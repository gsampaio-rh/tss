/**
 * Domain Services exports
 */

export { NavigationService } from './NavigationService';
export { TacticalAnalysisService, OPT_UPWIND_ANGLE, OPT_DOWNWIND_ANGLE } from './TacticalAnalysisService';
export { DirtyAirService } from './DirtyAirService';
export { BoatMovementService } from './BoatMovementService';
export { WindCalculationService } from './WindCalculationService';
export { GameEngineService } from './GameEngineService';
export { GameSetupService } from './GameSetupService';
export { RacingRulesService, RightOfWaySituation, PenaltyType } from './RacingRulesService';
export type { RightOfWayResult, CollisionRisk, PenaltyState, RacingRulesWarning } from './RacingRulesService';

