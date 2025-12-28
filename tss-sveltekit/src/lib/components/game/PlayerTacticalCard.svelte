<script lang="ts">
	import type { Boat } from '$lib/types/boat';
	import { marks, currentWind, previousWind, players } from '$lib/stores/game';
	import {
		angleDiff,
		getOptimalHeading,
		calculateVMG,
		calculateVMGEfficiency,
		getCourseAxis,
		calculateLiftHeader,
		OPT_UPWIND_ANGLE
	} from '$lib/utils/gameLogic';
	import { getBoatColorHex } from '$lib/types/game';
	import Modal from '$lib/presentation/components/shared/Modal.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { turnCount } from '$lib/stores/game';
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

	export let boat: Boat;
	export let playerIndex: number;

	// Modal state
	let showVMGModal = false;
	let showATWModal = false;
	let showHeadingModal = false;
	let showTackAdvantageModal = false;
	
	// Calculate optimal VMG (always BOAT_SPEED when perfectly aligned)
	$: optimalVMG = BOAT_SPEED;

	// Calculate distance to mark
	function distance(x1: number, y1: number, x2: number, y2: number): number {
		return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
	}

	// Calculate position (1st, 2nd, etc.) based on distance to windward mark
	$: position = (() => {
		if (!$marks || $marks.length < 3 || !$players) return null;
		const windwardMark = $marks[2];
		const distances = $players.map((p, idx) => ({
			index: idx,
			distance: distance(p.x, p.y, windwardMark.x, windwardMark.y)
		}));
		distances.sort((a, b) => a.distance - b.distance);
		const rank = distances.findIndex(d => d.index === playerIndex) + 1;
		return rank;
	})();

	const BOAT_SPEED = 1.0;

	// Get windward mark
	$: windwardMark = $marks && $marks.length > 2 ? $marks[2] : null;

	// Current wind direction
	$: windDir = ($currentWind || 0) * 2;

	// 1. Angle to True Wind (ATW)
	$: atw = boat ? Math.abs(angleDiff(boat.rotation, windDir)) : 0;
	$: targetATW = OPT_UPWIND_ANGLE;
	$: atwDelta = atw - targetATW;
	$: atwColor = (Math.abs(atwDelta) <= 2 ? 'green' : Math.abs(atwDelta) <= 5 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red';
	$: atwStatus = (Math.abs(atwDelta) <= 2 ? 'excellent' : Math.abs(atwDelta) <= 5 ? 'good' : 'poor') as 'excellent' | 'good' | 'poor';
	$: atwStatusColor = Math.abs(atwDelta) <= 2 ? '#28a745' : Math.abs(atwDelta) <= 5 ? '#ffc107' : '#dc3545';
	$: atwStatusLabel = Math.abs(atwDelta) <= 2 ? 'Excellent' : Math.abs(atwDelta) <= 5 ? 'Good' : 'Needs Adjustment';
	

	// 2. VMG
	$: vmg = windwardMark
		? calculateVMG(boat.rotation, boat.x, boat.y, windwardMark.x, windwardMark.y, BOAT_SPEED)
		: 0;
	$: vmgEfficiency = windwardMark
		? calculateVMGEfficiency(
				boat.rotation,
				boat.x,
				boat.y,
				windwardMark.x,
				windwardMark.y,
				BOAT_SPEED,
				true
			)
		: 0;
	$: vmgPercent = Math.round(vmgEfficiency * 100);
	$: vmgStatus = (vmgPercent >= 95 ? 'excellent' : vmgPercent >= 85 ? 'good' : 'poor') as 'excellent' | 'good' | 'poor';
	$: vmgStatusColor = vmgPercent >= 95 ? '#28a745' : vmgPercent >= 85 ? '#ffc107' : '#dc3545';
	$: vmgStatusLabel = vmgPercent >= 95 ? 'Excellent' : vmgPercent >= 85 ? 'Good' : 'Poor';
	$: vmgStatusBgColor = vmgPercent >= 95 
		? 'rgba(40, 167, 69, 0.12)' 
		: vmgPercent >= 85 
		? 'rgba(255, 193, 7, 0.12)' 
		: 'rgba(220, 53, 69, 0.12)';

	// VMG trend
	let previousVMG = vmg;
	$: vmgTrend = (vmg > previousVMG ? 'up' : vmg < previousVMG ? 'down' : 'stable') as 'up' | 'down' | 'stable';
	$: if (vmg !== previousVMG) previousVMG = vmg;

	// 3. Lift/Header
	// Use previousWind from store (in game units, multiply by 2 for degrees)
	$: previousWindDirDeg = ($previousWind || 0) * 2;
	$: liftHeaderResult =
		windDir !== previousWindDirDeg && windwardMark && Math.abs(windDir - previousWindDirDeg) > 0.1
			? calculateLiftHeader(
					boat,
					boat.x,
					boat.y,
					windwardMark.x,
					windwardMark.y,
					previousWindDirDeg,
					windDir,
					true
				)
			: null;

	$: isLift = liftHeaderResult?.isLift ?? false;
	$: isHeader = liftHeaderResult?.isHeader ?? false;
	$: liftAmount = liftHeaderResult?.errorChange ?? 0;

	// Calculate lift/header bar percentage
	// Bar is centered, lift goes right, header goes left
	// Max lift/header shown as ±30°
	$: maxShift = 30;
	$: liftHeaderBarWidth = Math.min(50, (Math.abs(liftAmount) / maxShift) * 50);

	// 4. Target Heading
	$: optimalHeading = getOptimalHeading(boat.tack, windDir, true);
	$: headingDelta = angleDiff(boat.rotation, optimalHeading);
	$: headingStatus = (Math.abs(headingDelta) <= 3 ? 'excellent' : Math.abs(headingDelta) <= 5 ? 'good' : 'poor') as 'excellent' | 'good' | 'poor';
	$: headingStatusColor = Math.abs(headingDelta) <= 3 ? '#28a745' : Math.abs(headingDelta) <= 5 ? '#ffc107' : '#dc3545';
	$: headingStatusLabel = Math.abs(headingDelta) <= 3 ? 'On Course' : Math.abs(headingDelta) <= 5 ? 'Close' : 'Off Course';
	

	// 5. Speed
	$: currentSpeed = BOAT_SPEED;
	$: targetSpeed = BOAT_SPEED;
	$: speedDelta = currentSpeed - targetSpeed;

	// 6. Mode
	$: mode = (() => {
		if (atw < targetATW - 3) return 'PINCHING';
		if (atw > targetATW + 5) return 'FOOTING';
		if (Math.abs(headingDelta) < 3) return 'VMG MODE';
		if (headingDelta < -3) return 'POINTING';
		return 'FOOTING';
	})();

	// Tell Tales Indicators
	$: isPinching = mode === 'PINCHING';
	$: isFooting = mode === 'FOOTING';

	// 7. Tack Advantage
	$: oppositeTack = !boat.tack;
	$: oppositeOptHeading = getOptimalHeading(oppositeTack, windDir, true);
	$: currentCourseAxis = windwardMark
		? getCourseAxis(boat.x, boat.y, windwardMark.x, windwardMark.y)
		: 0;
	$: currentError = windwardMark ? Math.abs(angleDiff(boat.rotation, currentCourseAxis)) : 0;
	$: oppositeError = windwardMark ? Math.abs(angleDiff(oppositeOptHeading, currentCourseAxis)) : 0;
	$: tackAdvantage =
		currentError < oppositeError ? oppositeError - currentError : -(currentError - oppositeError);
	$: tackAdvantagePercent =
		currentError + oppositeError > 0
			? Math.round((1 - currentError / (currentError + oppositeError)) * 100)
			: 0;
	$: tackAdvantageStatus = (tackAdvantage < 0 ? 'advantage' : 'disadvantage') as 'advantage' | 'disadvantage';
	$: tackAdvantageStatusColor = tackAdvantage < 0 ? '#28a745' : '#dc3545';
	$: tackAdvantageStatusLabel = tackAdvantage < 0 ? 'Better' : 'Worse';
	

	// 8. Time Since Last Shift
	let lastShiftTime = Date.now();
	$: if (liftHeaderResult && Math.abs(liftAmount) > 5) {
		lastShiftTime = Date.now();
	}
	$: timeSinceShift = Math.floor((Date.now() - lastShiftTime) / 1000);

	// 9. Power State
	$: powerState = (() => {
		if (atw < targetATW - 5) return 'UNDERPOWERED';
		if (atw > targetATW + 8) return 'OVERPOWERED';
		return 'POWERED';
	})();
	$: powerLevel = Math.max(0, Math.min(1, 1 - Math.abs(atwDelta) / 10));

	// 10. Decision Flag
	$: decisionFlag = (() => {
		if (isHeader && Math.abs(liftAmount) > 15 && vmgEfficiency < 0.85) return 'TACK NOW';
		if (isHeader && Math.abs(liftAmount) > 8 && vmgEfficiency < 0.9) return 'TACK SOON';
		if (tackAdvantage < -5 && vmgEfficiency < 0.9) return 'TACK SOON';
		return 'HOLD';
	})();

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


<style>
	.player-tactical-card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-light);
		border-radius: var(--border-radius-md);
		padding: var(--spacing-md);
		margin-bottom: var(--spacing-md);
		cursor: pointer;
		transition: var(--transition-normal);
		box-shadow: var(--shadow-sm);
	}

	.player-tactical-card:hover {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	:global(body[data-focused-player]) .player-tactical-card:not([data-player-index]) {
		opacity: 0.3;
	}

	:global(body[data-focused-player]) .player-tactical-card[data-player-index] {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-primary);
		background: var(--color-primary-light);
	}

	:global(body[data-hover-player]) .player-tactical-card:not([data-player-index]) {
		opacity: 0.5;
	}

	:global(body[data-hover-player]) .player-tactical-card[data-player-index] {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-md);
	}

	/* Card Header */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border-light);
	}

	.player-identity {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.player-dot-large {
		width: 12px;
		height: 12px;
		border-radius: var(--border-radius-pill);
		flex-shrink: 0;
	}

	.player-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.player-name-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.player-name {
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.position-badge {
		background: var(--color-text-muted);
		color: #fff;
		padding: 2px 6px;
		border-radius: var(--border-radius-sm);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
	}

	.position-badge.first {
		background: #ffd700;
		color: #000;
	}

	.position-badge.second {
		background: #c0c0c0;
		color: #000;
	}

	.position-badge.third {
		background: #cd7f32;
		color: #fff;
	}

	.player-tack-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.tack-indicator {
		width: 18px;
		height: 18px;
		border-radius: var(--border-radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: #fff;
	}

	.tack-indicator.port {
		background: #ff6b6b;
	}

	.tack-indicator.starboard {
		background: #4ecdc4;
	}

	.player-tack {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
	}

	.decision-badge {
		background: rgba(255, 200, 0, 0.9);
		color: #000;
		padding: 4px 8px;
		border-radius: var(--border-radius-sm);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
	}

	.decision-badge.urgent {
		background: rgba(220, 53, 69, 0.9);
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

	/* Lift/Header Bar */
	.lift-header-bar-container {
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border-light);
	}

	.lift-header-bar-label {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-bottom: 4px;
		font-weight: var(--font-weight-semibold);
	}

	.lift-label {
		color: #28a745;
	}

	.header-label {
		color: #dc3545;
	}

	.lift-header-bar {
		position: relative;
		width: 100%;
		height: 24px;
		background: linear-gradient(
			to right,
			rgba(220, 53, 69, 0.1) 0%,
			rgba(220, 53, 69, 0.1) 50%,
			rgba(40, 167, 69, 0.1) 50%,
			rgba(40, 167, 69, 0.1) 100%
		);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--color-border-light);
		overflow: visible;
	}

	.lift-header-bar-center {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--color-text-muted);
		transform: translateX(-50%);
	}

	.lift-header-bar-fill {
		position: absolute;
		top: 0;
		bottom: 0;
		height: 100%;
		transition:
			width 0.3s ease,
			left 0.3s ease,
			right 0.3s ease;
	}

	.lift-header-bar-fill.lift {
		background: rgba(40, 167, 69, 0.4);
		border-left: 2px solid #28a745;
	}

	.lift-header-bar-fill.header {
		background: rgba(220, 53, 69, 0.4);
		border-right: 2px solid #dc3545;
	}

	.lift-header-bar-indicator {
		position: absolute;
		top: 50%;
		transform: translateY(-50%) translateX(-50%);
		background: rgba(255, 255, 255, 0.95);
		padding: 2px 6px;
		border-radius: var(--border-radius-sm);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		white-space: nowrap;
		z-index: 10;
	}

	.lift-header-bar-indicator.lift {
		color: #28a745;
	}

	.lift-header-bar-indicator.header {
		color: #dc3545;
	}

	.lift-header-bar-neutral {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* Metrics Grid */
	.metrics-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}


	/* Lift/Header Metric */
	.lift-header-metric.lift {
		border-left: 3px solid #28a745;
	}

	.lift-header-metric.header {
		border-left: 3px solid #dc3545;
	}

	.shift-arrow {
		font-size: var(--font-size-lg);
	}

	/* Tack Metric */
	.tack-metric.advantage {
		border-left: 3px solid #28a745;
	}

	.tack-metric.disadvantage {
		border-left: 3px solid #dc3545;
	}

	/* Secondary Info */
	.secondary-info {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		padding-top: var(--spacing-sm);
		border-top: 1px solid var(--color-border-light);
		font-size: var(--font-size-xs);
	}

	.info-item {
		display: flex;
		gap: 4px;
	}

	.info-label {
		color: var(--color-text-muted);
	}

	.info-value {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.info-value.underpowered {
		color: #dc3545;
	}
	.info-value.overpowered {
		color: #ffc107;
	}

	/* VMG Info Modal Styles */
	.vmg-info-content {
		color: var(--color-text-primary);
		padding: 0;
	}

	/* Subtitle */
	.vmg-subtitle {
		margin: 0 0 var(--spacing-lg) 0;
		font-size: var(--font-size-sm);
		color: #6b7280;
		font-weight: var(--font-weight-normal);
		line-height: var(--line-height-relaxed);
	}

	/* Hero Stat: VMG Value */
	.vmg-hero {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.vmg-value {
		font-size: 44px;
		font-weight: 600;
		line-height: 1;
		color: var(--color-text-primary);
	}

	.vmg-unit {
		font-size: 18px;
		font-weight: var(--font-weight-normal);
		color: var(--color-text-secondary);
		opacity: 0.6;
		margin-left: 2px;
	}

	.vmg-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-left: auto;
		align-self: flex-end;
		padding-bottom: 4px;
	}

	/* Supporting Indicators */
	.vmg-indicators {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-lg);
	}

	.vmg-efficiency {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		line-height: 1.5;
	}

	.efficiency-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-normal);
	}

	.efficiency-value {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.efficiency-badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 10px;
		border-radius: 12px;
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		text-transform: capitalize;
	}

	.trend-inline {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-normal);
		margin-left: var(--spacing-xs);
	}

	.trend-arrow-inline {
		font-size: 12px;
		line-height: 1;
	}

	.trend-label {
		font-weight: var(--font-weight-normal);
	}

	/* Divider */
	.vmg-divider {
		border: none;
		border-top: 1px solid var(--color-border-light);
		margin: var(--spacing-lg) 0;
	}

	/* Guidance Section */
	.vmg-guidance {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.guidance-section {
		/* No special styling - keep neutral */
	}

	.guidance-title {
		margin: 0 0 var(--spacing-sm) 0;
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.guidance-list {
		margin: 0;
		padding-left: var(--spacing-md);
		list-style: none;
	}

	.guidance-list li {
		margin-bottom: var(--spacing-xs);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-normal);
		color: var(--color-text-secondary);
		position: relative;
		padding-left: var(--spacing-sm);
	}

	.guidance-list li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: var(--color-text-muted);
	}

	.guidance-list li:last-child {
		margin-bottom: 0;
	}

	.guidance-list strong {
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}

	/* VMG Chart Container */
	.vmg-chart-container {
		margin: var(--spacing-lg) 0;
		padding: var(--spacing-md);
		background: var(--color-bg-primary);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-light);
	}

	.chart-header {
		margin-bottom: var(--spacing-sm);
	}

	.chart-title {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: 2px;
	}

	.chart-subtitle {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-normal);
	}

	.chart-scale-legend {
		display: flex;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-sm);
		flex-wrap: wrap;
		align-items: center;
	}

	.scale-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.scale-color {
		display: inline-block;
		width: 20px;
		height: 12px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.scale-label {
		font-weight: var(--font-weight-normal);
		white-space: nowrap;
	}

	.chart-explanation-toggle {
		background: none;
		border: none;
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
		cursor: pointer;
		padding: var(--spacing-xs) 0;
		margin-top: var(--spacing-sm);
		text-align: left;
		width: 100%;
		transition: color var(--transition-base);
	}

	.chart-explanation-toggle:hover {
		color: var(--color-text-primary);
	}

	.chart-explanation {
		margin-top: var(--spacing-sm);
		padding-top: var(--spacing-sm);
		border-top: 1px solid var(--color-border-light);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		line-height: var(--line-height-normal);
	}

	.contextual-guidance {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-normal);
		padding: var(--spacing-sm);
		background: var(--color-bg-primary);
		border-radius: var(--radius-sm);
		border-left: 3px solid currentColor;
		margin-top: var(--spacing-xs);
	}
</style>
