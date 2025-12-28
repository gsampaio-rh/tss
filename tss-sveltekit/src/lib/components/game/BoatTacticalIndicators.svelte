<script lang="ts">
	import type { Boat } from '$lib/types/boat';
	import { currentWind, marks, previousWind } from '$lib/stores/game';
	import {
		calculateTacticalMetrics,
		calculateVMGTrend,
		calculateTimeSinceShift,
		type TacticalMetrics
	} from '$lib/application/services/TacticalCardService';
	import { getClockPosition } from '$lib/utils/clockPosition';

	export let boat: Boat;
	export let playerIndex: number;
	export let showAlways: boolean = true;

	// Constants
	const RADIUS = 50; // Distance from boat center in pixels

	// Get windward mark
	$: windwardMark = $marks && $marks.length > 2 ? $marks[2] : null;

	// Current wind direction (convert from game units to degrees)
	$: windDir = ($currentWind || 0) * 2;
	$: previousWindDir = ($previousWind || 0) * 2;

	// Calculate all tactical metrics using service
	let previousVMG: number | undefined = undefined;
	let lastShiftTime = Date.now();
	let metrics: TacticalMetrics | null = null;

	$: {
		if (boat && windwardMark) {
			metrics = calculateTacticalMetrics({
				boat,
				windwardMark,
				windDir,
				previousWindDir,
				previousVMG
			});
			// Update previousVMG for next calculation
			if (metrics) {
				previousVMG = metrics.vmg;
			}
		} else {
			metrics = null;
		}
	}

	// Extract metrics for easier access
	$: atw = metrics?.atw ?? 0;
	$: targetATW = metrics?.targetATW ?? 45;
	$: atwDelta = metrics?.atwDelta ?? 0;
	$: atwColor = metrics?.atwColor ?? 'red';

	$: vmg = metrics?.vmg ?? 0;
	$: vmgEfficiency = metrics?.vmgEfficiency ?? 0;
	$: vmgPercent = metrics?.vmgPercent ?? 0;
	$: vmgTrend = calculateVMGTrend(vmg, previousVMG);

	$: isLift = metrics?.isLift ?? false;
	$: isHeader = metrics?.isHeader ?? false;
	$: liftAmount = metrics?.liftAmount ?? 0;

	$: optimalHeading = metrics?.optimalHeading ?? 0;
	$: headingDelta = metrics?.headingDelta ?? 0;

	$: currentSpeed = metrics?.currentSpeed ?? 1.0;
	$: targetSpeed = metrics?.targetSpeed ?? 1.0;
	$: speedDelta = metrics?.speedDelta ?? 0;

	$: mode = metrics?.mode ?? 'FOOTING';

	$: tackAdvantage = metrics?.tackAdvantage ?? 0;
	$: tackAdvantagePercent = metrics?.tackAdvantagePercent ?? 0;

	$: powerState = metrics?.powerState ?? 'POWERED';
	$: powerLevel = metrics?.powerLevel ?? 0;

	$: decisionFlag = metrics?.decisionFlag ?? 'HOLD';

	// Calculate time since last shift
	let timeSinceShift = 0;
	$: {
		if (metrics && liftAmount !== undefined) {
			const liftHeaderResult = { errorChange: liftAmount };
			const result = calculateTimeSinceShift(liftHeaderResult, lastShiftTime);
			lastShiftTime = result.newLastShiftTime;
			timeSinceShift = result.timeSinceShift;
		} else {
			timeSinceShift = Math.floor((Date.now() - lastShiftTime) / 1000);
		}
	}

	// Only show indicators if we have valid data
	$: hasValidData = windwardMark && windwardMark.x !== undefined && windwardMark.y !== undefined;

	function formatCssDeg(val: number): string {
		return val.toFixed(0) + '°';
	}

	// Calculate clock positions
	$: pos12 = getClockPosition(0, RADIUS);
	$: pos1 = getClockPosition(1, RADIUS);
	$: pos3 = getClockPosition(3, RADIUS);
	$: pos4 = getClockPosition(4, RADIUS);
	$: pos5 = getClockPosition(5, RADIUS);
	$: pos6 = getClockPosition(6, RADIUS);
	$: pos7 = getClockPosition(7, RADIUS);
	$: pos8 = getClockPosition(8, RADIUS);
	$: pos9 = getClockPosition(9, RADIUS);
	$: pos11 = getClockPosition(11, RADIUS);
</script>

<!-- Tactical Indicators Container - Clock Layout -->
{#if hasValidData && showAlways}
	<div class="boat-tactical-indicators">
		<!-- 12 o'clock (top) - Decision Flag -->
		{#if decisionFlag !== 'HOLD'}
			<div
				class="indicator-clock indicator-12"
				class:urgent={decisionFlag === 'TACK NOW'}
				style="left: {pos12.x}px; top: {pos12.y}px;"
			>
				<div class="decision-flag">
					⚑ {decisionFlag}
				</div>
			</div>
		{/if}

		<!-- 1 o'clock - Angle to True Wind (ATW) -->
		<div class="indicator-clock indicator-1" style="left: {pos1.x}px; top: {pos1.y}px;">
			<div class="atw-indicator-compact">
				<div
					class="atw-value"
					class:green={atwColor === 'green'}
					class:yellow={atwColor === 'yellow'}
					class:red={atwColor === 'red'}
				>
					{formatCssDeg(atw)}
				</div>
				<div class="atw-target">T: {formatCssDeg(targetATW)}</div>
				<div class="atw-delta">{atwDelta > 0 ? '+' : ''}{formatCssDeg(atwDelta)}</div>
			</div>
		</div>

		<!-- 3 o'clock (right) - Lift/Header Indicator -->
		{#if isLift || isHeader}
			<div
				class="indicator-clock indicator-3"
				class:lift={isLift}
				class:header={isHeader}
				style="left: {pos3.x}px; top: {pos3.y}px;"
			>
				<div class="lift-header-indicator-compact">
					<span class="lift-header-arrow">{isLift ? '↗' : '↘'}</span>
					<span class="lift-header-text">{isLift ? 'LIFT' : 'HEADER'}</span>
					<span class="lift-header-amount"
						>{isLift ? '+' : '−'}{Math.abs(liftAmount).toFixed(0)}°</span
					>
				</div>
			</div>
		{/if}

		<!-- 4 o'clock - Mode Indicator -->
		<div class="indicator-clock indicator-4" style="left: {pos4.x}px; top: {pos4.y}px;">
			<div class="mode-indicator-compact">
				{mode}
			</div>
		</div>

		<!-- 5 o'clock - Tack Advantage -->
		<div
			class="indicator-clock indicator-5"
			class:advantage={tackAdvantage < 0}
			class:disadvantage={tackAdvantage > 0}
			style="left: {pos5.x}px; top: {pos5.y}px;"
		>
			<div class="tack-advantage-compact">
				{tackAdvantage > 0 ? '+' : ''}{tackAdvantagePercent}%
			</div>
		</div>

		<!-- 6 o'clock (bottom) - VMG Indicator -->
		<div class="indicator-clock indicator-6" style="left: {pos6.x}px; top: {pos6.y}px;">
			<div class="vmg-indicator-compact">
				<div class="vmg-label-compact">VMG {vmg.toFixed(1)}</div>
				<div class="vmg-bar-compact">
					<div
						class="vmg-bar-fill-compact"
						style="width: {vmgPercent}%"
						class:good={vmgPercent >= 95}
						class:ok={vmgPercent >= 85 && vmgPercent < 95}
						class:poor={vmgPercent < 85}
					></div>
				</div>
				<div class="vmg-percent-compact">
					{vmgPercent}%
					{#if vmgTrend !== 'stable'}
						<span
							class="vmg-trend-compact"
							class:up={vmgTrend === 'up'}
							class:down={vmgTrend === 'down'}
						>
							{vmgTrend === 'up' ? '▲' : '▼'}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- 7 o'clock - Power State -->
		<div class="indicator-clock indicator-7" style="left: {pos7.x}px; top: {pos7.y}px;">
			<div class="power-indicator-compact">
				<div class="power-label-compact">{powerState}</div>
				<div class="power-bar-compact">
					<div class="power-bar-fill-compact" style="width: {powerLevel * 100}%"></div>
				</div>
			</div>
		</div>

		<!-- 8 o'clock - Speed Indicator -->
		<div class="indicator-clock indicator-8" style="left: {pos8.x}px; top: {pos8.y}px;">
			<div class="speed-indicator-compact">
				<div class="speed-current-compact">{currentSpeed.toFixed(1)} kt</div>
				<div class="speed-target-compact">OPT {targetSpeed.toFixed(1)}</div>
			</div>
		</div>

		<!-- 9 o'clock (left) - Heading Indicator -->
		<div class="indicator-clock indicator-9" style="left: {pos9.x}px; top: {pos9.y}px;">
			<div class="heading-indicator-compact">
				<div class="heading-current-compact">HDG {formatCssDeg(boat.rotation)}</div>
				<div class="heading-target-compact">OPT {formatCssDeg(optimalHeading)}</div>
				<div class="heading-delta-compact">
					{headingDelta > 0 ? '+' : ''}{formatCssDeg(headingDelta)}
				</div>
			</div>
		</div>

		<!-- 11 o'clock - Time Since Last Shift -->
		{#if timeSinceShift < 30}
			<div class="indicator-clock indicator-11" style="left: {pos11.x}px; top: {pos11.y}px;">
				<div class="shift-timer-compact">
					{timeSinceShift}s
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.boat-tactical-indicators {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: 101;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 9px;
		color: #333;
		white-space: nowrap;
	}

	/* Clock-style positioning - base class */
	.indicator-clock {
		position: absolute;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	/* Common indicator styles */
	.indicator-clock > div {
		background: rgba(255, 255, 255, 0.95);
		padding: 3px 6px;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		text-align: center;
		white-space: nowrap;
	}

	/* Decision Flag */
	.decision-flag {
		background: rgba(255, 200, 0, 0.95);
		color: #000;
		font-weight: bold;
		font-size: 9px;
	}

	.indicator-12.urgent .decision-flag {
		background: rgba(220, 53, 69, 0.95);
		color: #fff;
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	/* ATW Indicator Compact */
	.atw-indicator-compact {
		font-size: 8px;
	}

	.atw-value {
		font-weight: 700;
		font-size: 10px;
	}

	.atw-value.green {
		color: #28a745;
	}
	.atw-value.yellow {
		color: #ffc107;
	}
	.atw-value.red {
		color: #dc3545;
	}

	.atw-target {
		font-size: 7px;
		color: rgba(0, 0, 0, 0.6);
	}

	.atw-delta {
		font-size: 7px;
		font-weight: 600;
	}

	/* VMG Indicator Compact */
	.vmg-indicator-compact {
		min-width: 70px;
	}

	.vmg-label-compact {
		font-size: 7px;
		font-weight: 600;
		margin-bottom: 2px;
	}

	.vmg-bar-compact {
		width: 100%;
		height: 5px;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 3px;
		overflow: hidden;
		margin: 2px 0;
	}

	.vmg-bar-fill-compact {
		height: 100%;
		transition: width 0.3s ease;
	}

	.vmg-bar-fill-compact.good {
		background: #28a745;
	}
	.vmg-bar-fill-compact.ok {
		background: #ffc107;
	}
	.vmg-bar-fill-compact.poor {
		background: #dc3545;
	}

	.vmg-percent-compact {
		font-size: 8px;
		font-weight: 600;
	}

	.vmg-trend-compact {
		font-size: 8px;
		margin-left: 2px;
	}

	.vmg-trend-compact.up {
		color: #28a745;
	}
	.vmg-trend-compact.down {
		color: #dc3545;
	}

	/* Lift/Header Indicator Compact */
	.lift-header-indicator-compact {
		display: flex;
		align-items: center;
		gap: 3px;
		font-size: 8px;
		font-weight: 600;
	}

	.indicator-3.lift > div {
		border-left: 2px solid #28a745;
	}

	.indicator-3.header > div {
		border-left: 2px solid #dc3545;
	}

	.lift-header-arrow {
		font-size: 10px;
	}

	/* Heading Indicator Compact */
	.heading-indicator-compact {
		font-size: 7px;
		text-align: left;
	}

	.heading-current-compact {
		font-weight: 600;
	}

	.heading-target-compact {
		font-size: 6px;
		color: rgba(0, 0, 0, 0.6);
	}

	.heading-delta-compact {
		font-size: 6px;
		font-weight: 600;
	}

	/* Speed Indicator Compact */
	.speed-indicator-compact {
		font-size: 7px;
		text-align: left;
	}

	.speed-current-compact {
		font-weight: 600;
	}

	.speed-target-compact {
		font-size: 6px;
		color: rgba(0, 0, 0, 0.6);
	}

	/* Mode Indicator Compact */
	.mode-indicator-compact {
		font-size: 7px;
		font-weight: 600;
	}

	/* Tack Advantage Compact */
	.tack-advantage-compact {
		font-size: 8px;
		font-weight: 600;
	}

	.indicator-5.advantage > div {
		border-left: 2px solid #28a745;
	}

	.indicator-5.disadvantage > div {
		border-left: 2px solid #dc3545;
	}

	/* Shift Timer Compact */
	.shift-timer-compact {
		font-size: 7px;
		color: rgba(0, 0, 0, 0.6);
	}

	/* Power Indicator Compact */
	.power-indicator-compact {
		font-size: 7px;
		text-align: left;
	}

	.power-label-compact {
		font-weight: 600;
		margin-bottom: 2px;
	}

	.power-bar-compact {
		width: 40px;
		height: 4px;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.power-bar-fill-compact {
		height: 100%;
		background: #28a745;
		transition: width 0.3s ease;
	}
</style>
