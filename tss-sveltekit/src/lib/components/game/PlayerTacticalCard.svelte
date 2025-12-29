<script lang="ts">
	import type { Boat } from '$lib/types/boat';
	import { marks, currentWind, previousWind, players } from '$lib/stores/game';
	import { getBoatColorHex } from '$lib/types/game';
	import { turnCount } from '$lib/stores/game';
	import {
		calculateTacticalMetrics,
		calculateVMGTrend,
		calculatePosition,
		calculateTimeSinceShift,
		type TacticalMetrics
	} from '$lib/application/services/TacticalCardService';
	import TellTales from './tactical/TellTales.svelte';
	import VMGModal from './tactical/modals/VMGModal.svelte';
	import ATWModal from './tactical/modals/ATWModal.svelte';
	import HeadingModal from './tactical/modals/HeadingModal.svelte';
	import TackAdvantageModal from './tactical/modals/TackAdvantageModal.svelte';
	import ATWMetricCard from './tactical/ATWMetricCard.svelte';
	import VMGMetricCard from './tactical/VMGMetricCard.svelte';
	import HeadingMetricCard from './tactical/HeadingMetricCard.svelte';
	import TackAdvantageMetricCard from './tactical/TackAdvantageMetricCard.svelte';
	import ModeMetricCard from './tactical/ModeMetricCard.svelte';
	import LiftHeaderMetricCard from './tactical/LiftHeaderMetricCard.svelte';
	import './tactical/PlayerTacticalCard.css';

	export let boat: Boat;
	export let playerIndex: number;

	// Modal state
	let showVMGModal = false;
	let showATWModal = false;
	let showHeadingModal = false;
	let showTackAdvantageModal = false;

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
	$: atwStatus = metrics?.atwStatus ?? 'poor';
	$: atwStatusColor = metrics?.atwStatusColor ?? '#dc3545';
	$: atwStatusLabel = metrics?.atwStatusLabel ?? 'Needs Adjustment';

	$: vmg = metrics?.vmg ?? 0;
	$: vmgEfficiency = metrics?.vmgEfficiency ?? 0;
	$: vmgPercent = metrics?.vmgPercent ?? 0;
	$: vmgStatus = metrics?.vmgStatus ?? 'poor';
	$: vmgStatusColor = metrics?.vmgStatusColor ?? '#dc3545';
	$: vmgStatusLabel = metrics?.vmgStatusLabel ?? 'Poor';
	$: vmgStatusBgColor = metrics?.vmgStatusBgColor ?? 'rgba(220, 53, 69, 0.12)';
	$: optimalVMG = metrics?.optimalVMG ?? 1.0;
	$: vmgTrend = calculateVMGTrend(vmg, previousVMG);

	$: isLift = metrics?.isLift ?? false;
	$: isHeader = metrics?.isHeader ?? false;
	$: liftAmount = metrics?.liftAmount ?? 0;
	$: liftHeaderBarWidth = metrics?.liftHeaderBarWidth ?? 0;

	$: optimalHeading = metrics?.optimalHeading ?? 0;
	$: headingDelta = metrics?.headingDelta ?? 0;
	$: headingStatus = metrics?.headingStatus ?? 'poor';
	$: headingStatusColor = metrics?.headingStatusColor ?? '#dc3545';
	$: headingStatusLabel = metrics?.headingStatusLabel ?? 'Off Course';

	$: currentSpeed = metrics?.currentSpeed ?? 1.0;
	$: targetSpeed = metrics?.targetSpeed ?? 1.0;
	$: speedDelta = metrics?.speedDelta ?? 0;

	$: mode = metrics?.mode ?? 'FOOTING';
	$: isPinching = metrics?.isPinching ?? false;
	$: isFooting = metrics?.isFooting ?? false;

	$: tackAdvantage = metrics?.tackAdvantage ?? 0;
	$: tackAdvantagePercent = metrics?.tackAdvantagePercent ?? 0;
	$: tackAdvantageStatus = metrics?.tackAdvantageStatus ?? 'disadvantage';
	$: tackAdvantageStatusColor = metrics?.tackAdvantageStatusColor ?? '#dc3545';
	$: tackAdvantageStatusLabel = metrics?.tackAdvantageStatusLabel ?? 'Worse';

	$: powerState = metrics?.powerState ?? 'POWERED';
	$: powerLevel = metrics?.powerLevel ?? 0;

	$: decisionFlag = metrics?.decisionFlag ?? 'HOLD';

	// Calculate position rank
	$: position = windwardMark && $players
		? calculatePosition($players, playerIndex, windwardMark)
		: null;

	// Calculate time since last shift
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
	let timeSinceShift = 0;

	$: hasValidData = boat && windwardMark && windwardMark.x !== undefined && windwardMark.y !== undefined;

	function formatCssDeg(val: number): string {
		return val.toFixed(0) + '°';
	}

	function handleClick() {
		const currentFocused = document.body.getAttribute('data-focused-player');
		if (currentFocused === playerIndex.toString()) {
			document.body.removeAttribute('data-focused-player');
		} else {
			document.body.setAttribute('data-focused-player', playerIndex.toString());
		}
	}

	function handleMouseEnter() {
		document.body.setAttribute('data-hover-player', playerIndex.toString());
	}

	function handleMouseLeave() {
		document.body.removeAttribute('data-hover-player');
	}
</script>

{#if hasValidData}
	<div
		class="player-tactical-card"
		data-player-index={playerIndex.toString()}
		role="button"
		tabindex="0"
		aria-label={`Tactical card for ${boat.name || `Player ${playerIndex + 1}`}`}
		on:click={handleClick}
		on:keydown={e => (e.key === 'Enter' || e.key === ' ' ? handleClick() : null)}
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
	>
		<!-- Card Header -->
		<div class="card-header">
			<div class="player-identity">
				<span class="player-dot-large" style="background-color: {getBoatColorHex(boat.color)};"
				></span>
				<div class="player-info">
					<div class="player-name-row">
						<strong class="player-name">{boat.name || `Player ${playerIndex + 1}`}</strong>
						{#if position !== null}
							<span
								class="position-badge"
								class:first={position === 1}
								class:second={position === 2}
								class:third={position === 3}
							>
								#{position}
							</span>
						{/if}
					</div>
					<div class="player-tack-row">
						<span class="tack-indicator" class:port={boat.tack} class:starboard={!boat.tack}>
							{boat.tack ? 'P' : 'S'}
						</span>
						<span class="player-tack">{boat.tack ? 'Port' : 'Starboard'}</span>
					</div>
				</div>
			</div>
			{#if decisionFlag !== 'HOLD'}
				<div class="decision-badge" class:urgent={decisionFlag === 'TACK NOW'}>
					{decisionFlag}
				</div>
			{/if}
		</div>

		<!-- Tell Tales Indicators -->
		<TellTales {isPinching} {isFooting} />

		<!-- Lift/Header Bar (always visible) -->
		<div class="lift-header-bar-container">
			<div class="lift-header-bar-label">
				<span class="header-label">HEADER</span>
				<span class="lift-label">LIFT</span>
			</div>
			<div class="lift-header-bar">
				<div class="lift-header-bar-center"></div>
				{#if isLift || isHeader}
					<div
						class="lift-header-bar-fill"
						class:lift={isLift}
						class:header={isHeader}
						style="width: {liftHeaderBarWidth}%; {isLift ? 'right: 50%;' : 'left: 50%;'}"
					></div>
					{#if Math.abs(liftAmount) > 2}
						<div
							class="lift-header-bar-indicator"
							class:lift={isLift}
							class:header={isHeader}
							style={isLift
								? 'right: ' + (50 - liftHeaderBarWidth / 2) + '%;'
								: 'left: ' + (50 - liftHeaderBarWidth / 2) + '%;'}
						>
							{Math.abs(liftAmount).toFixed(0)}°
						</div>
					{/if}
				{:else}
					<div class="lift-header-bar-neutral">No shift</div>
				{/if}
			</div>
		</div>

		<!-- Main Metrics Grid -->
		<div class="metrics-grid">
			<!-- ATW (Top Left) -->
			<ATWMetricCard
				{atw}
				{targetATW}
				{atwDelta}
				{atwColor}
				onInfoClick={() => (showATWModal = true)}
			/>

			<!-- VMG (Top Right) -->
			<VMGMetricCard
				{vmg}
				{vmgPercent}
				{vmgTrend}
				onInfoClick={() => (showVMGModal = true)}
			/>

			<!-- Lift/Header (Middle Left) -->
			<LiftHeaderMetricCard {isLift} {isHeader} {liftAmount} />

			<!-- Mode (Middle Right) -->
			<ModeMetricCard {mode} />

			<!-- Heading (Bottom Left) -->
			<HeadingMetricCard
				heading={boat.rotation}
				{optimalHeading}
				{headingDelta}
				onInfoClick={() => (showHeadingModal = true)}
			/>

			<!-- Tack Advantage (Bottom Right) -->
			<TackAdvantageMetricCard
				{tackAdvantage}
				{tackAdvantagePercent}
				onInfoClick={() => (showTackAdvantageModal = true)}
			/>
		</div>

		<!-- Secondary Info Row -->
		<div class="secondary-info">
			<div class="info-item">
				<span class="info-label">Speed:</span>
				<span class="info-value">{currentSpeed.toFixed(1)} kt</span>
			</div>
			<div class="info-item">
				<span class="info-label">Power:</span>
				<span
					class="info-value"
					class:underpowered={powerState === 'UNDERPOWERED'}
					class:overpowered={powerState === 'OVERPOWERED'}
				>
					{powerState}
				</span>
			</div>
			{#if timeSinceShift < 30}
				<div class="info-item">
					<span class="info-label">Last shift:</span>
					<span class="info-value">{timeSinceShift}s ago</span>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- VMG Info Modal -->
<VMGModal
	bind:open={showVMGModal}
	{vmg}
	{vmgPercent}
	{vmgStatus}
	{vmgStatusColor}
	{vmgStatusLabel}
	{vmgStatusBgColor}
	{vmgTrend}
	{optimalVMG}
	windwardMark={windwardMark}
/>

<ATWModal
	bind:open={showATWModal}
	{atw}
	{targetATW}
	{atwDelta}
	{atwStatus}
	{atwStatusColor}
	{atwStatusLabel}
/>

<HeadingModal
	bind:open={showHeadingModal}
	{boat}
	{optimalHeading}
	{headingDelta}
	{headingStatus}
	{headingStatusColor}
	{headingStatusLabel}
/>

<TackAdvantageModal
	bind:open={showTackAdvantageModal}
	{boat}
	{tackAdvantage}
	{tackAdvantagePercent}
	{tackAdvantageStatus}
	{tackAdvantageStatusColor}
	{tackAdvantageStatusLabel}
	{vmgEfficiency}
/>
