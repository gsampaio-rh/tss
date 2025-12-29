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
	import './BoatTacticalIndicators.css';

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
