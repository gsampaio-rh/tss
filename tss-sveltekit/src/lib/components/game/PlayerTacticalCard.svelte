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
	import VMGChart from './VMGChart.svelte';
	import ATWChart from './ATWChart.svelte';
	import HeadingChart from './HeadingChart.svelte';
	import TackAdvantageChart from './TackAdvantageChart.svelte';

	export let boat: Boat;
	export let playerIndex: number;

	// Modal state for VMG info
	let showVMGModal = false;
	let showChartExplanation = false;
	
	// Modal state for ATW info
	let showATWModal = false;
	let showATWChartExplanation = false;
	
	// Modal state for Heading info
	let showHeadingModal = false;
	let showHeadingChartExplanation = false;
	
	// Modal state for Tack Advantage info
	let showTackAdvantageModal = false;
	let showTackAdvantageChartExplanation = false;

	// VMG history tracking (last 60 turns, sampled every turn)
	// History persists across modal opens/closes
	let vmgHistory: Array<{ time: number; vmg: number; efficiency: number; turn: number }> = [];
	const MAX_HISTORY_TURNS = 60; // Track last 60 turns
	let lastTrackedTurn = -1;
	
	// Track VMG history (sample every turn)
	$: if (windwardMark && vmg > 0 && $turnCount !== undefined && $turnCount !== lastTrackedTurn) {
		const now = Date.now();
		// Add new point for this turn
		vmgHistory.push({
			time: now,
			vmg: vmg,
			efficiency: vmgEfficiency,
			turn: $turnCount
		});
		lastTrackedTurn = $turnCount;
		
		// Remove old data (keep only last MAX_HISTORY_TURNS turns)
		if (vmgHistory.length > MAX_HISTORY_TURNS) {
			vmgHistory = vmgHistory.slice(-MAX_HISTORY_TURNS);
		}
	}
	
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
	$: atwColor = Math.abs(atwDelta) <= 2 ? 'green' : Math.abs(atwDelta) <= 5 ? 'yellow' : 'red';
	$: atwStatus = Math.abs(atwDelta) <= 2 ? 'excellent' : Math.abs(atwDelta) <= 5 ? 'good' : 'poor';
	$: atwStatusColor = Math.abs(atwDelta) <= 2 ? '#28a745' : Math.abs(atwDelta) <= 5 ? '#ffc107' : '#dc3545';
	$: atwStatusLabel = Math.abs(atwDelta) <= 2 ? 'Excellent' : Math.abs(atwDelta) <= 5 ? 'Good' : 'Needs Adjustment';
	
	// ATW history tracking (last 60 turns, sampled every turn)
	let atwHistory: Array<{ time: number; atw: number; delta: number; turn: number }> = [];
	let lastATWTrackedTurn = -1;
	
	// Track ATW history (sample every turn)
	$: if ($turnCount !== undefined && $turnCount !== lastATWTrackedTurn) {
		const now = Date.now();
		atwHistory.push({
			time: now,
			atw: atw,
			delta: atwDelta,
			turn: $turnCount
		});
		lastATWTrackedTurn = $turnCount;
		
		// Remove old data (keep only last MAX_HISTORY_TURNS turns)
		if (atwHistory.length > MAX_HISTORY_TURNS) {
			atwHistory = atwHistory.slice(-MAX_HISTORY_TURNS);
		}
	}

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
	$: vmgStatus = vmgPercent >= 95 ? 'excellent' : vmgPercent >= 85 ? 'good' : 'poor';
	$: vmgStatusColor = vmgPercent >= 95 ? '#28a745' : vmgPercent >= 85 ? '#ffc107' : '#dc3545';
	$: vmgStatusLabel = vmgPercent >= 95 ? 'Excellent' : vmgPercent >= 85 ? 'Good' : 'Poor';
	$: vmgStatusBgColor = vmgPercent >= 95 
		? 'rgba(40, 167, 69, 0.12)' 
		: vmgPercent >= 85 
		? 'rgba(255, 193, 7, 0.12)' 
		: 'rgba(220, 53, 69, 0.12)';

	// VMG trend
	let previousVMG = vmg;
	$: vmgTrend = vmg > previousVMG ? 'up' : vmg < previousVMG ? 'down' : 'stable';
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
	$: headingStatus = Math.abs(headingDelta) <= 3 ? 'excellent' : Math.abs(headingDelta) <= 5 ? 'good' : 'poor';
	$: headingStatusColor = Math.abs(headingDelta) <= 3 ? '#28a745' : Math.abs(headingDelta) <= 5 ? '#ffc107' : '#dc3545';
	$: headingStatusLabel = Math.abs(headingDelta) <= 3 ? 'On Course' : Math.abs(headingDelta) <= 5 ? 'Close' : 'Off Course';
	
	// Heading history tracking
	let headingHistory: Array<{ time: number; heading: number; optimalHeading: number; delta: number; turn: number }> = [];
	let lastHeadingTrackedTurn = -1;
	
	// Track Heading history
	$: if ($turnCount !== undefined && $turnCount !== lastHeadingTrackedTurn) {
		const now = Date.now();
		headingHistory.push({
			time: now,
			heading: boat.rotation,
			optimalHeading: optimalHeading,
			delta: headingDelta,
			turn: $turnCount
		});
		lastHeadingTrackedTurn = $turnCount;
		
		if (headingHistory.length > MAX_HISTORY_TURNS) {
			headingHistory = headingHistory.slice(-MAX_HISTORY_TURNS);
		}
	}

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
	
	// When pinching (too close to wind): windward tell tale goes down (stalled)
	// When footing (too wide): leeward tell tale goes down (stalled)
	// Leeward tell tale: red and down when footing, green and sideways otherwise
	$: leewardColor = isFooting ? '#dc3545' : '#28a745';
	$: leewardDirection = isFooting ? 'down' : 'sideways';
	
	// Windward tell tale: red and down when pinching, green and sideways otherwise
	$: windwardColor = isPinching ? '#dc3545' : '#28a745';
	$: windwardDirection = isPinching ? 'down' : 'sideways';

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
	$: tackAdvantageStatus = tackAdvantage < 0 ? 'advantage' : 'disadvantage';
	$: tackAdvantageStatusColor = tackAdvantage < 0 ? '#28a745' : '#dc3545';
	$: tackAdvantageStatusLabel = tackAdvantage < 0 ? 'Better' : 'Worse';
	
	// Tack Advantage history tracking
	let tackAdvantageHistory: Array<{ time: number; advantage: number; percent: number; turn: number }> = [];
	let lastTackAdvantageTrackedTurn = -1;
	
	// Track Tack Advantage history
	$: if (windwardMark && $turnCount !== undefined && $turnCount !== lastTackAdvantageTrackedTurn) {
		const now = Date.now();
		tackAdvantageHistory.push({
			time: now,
			advantage: tackAdvantage,
			percent: tackAdvantagePercent,
			turn: $turnCount
		});
		lastTackAdvantageTrackedTurn = $turnCount;
		
		if (tackAdvantageHistory.length > MAX_HISTORY_TURNS) {
			tackAdvantageHistory = tackAdvantageHistory.slice(-MAX_HISTORY_TURNS);
		}
	}

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
		<div class="tell-tales-container">
			<div class="tell-tale-label">Tell Tales</div>
			<div class="tell-tales">
				<!-- Leeward Tell Tale -->
				<div class="tell-tale" class:ok={leewardColor === '#28a745'} class:bad={leewardColor === '#dc3545'}>
					<svg width="16" height="16" viewBox="0 0 16 16" class="tell-tale-icon">
						{#if leewardDirection === 'sideways'}
							<!-- Green triangle pointing right (leeward) -->
							<polygon points="4,8 12,4 12,12" fill={leewardColor} />
						{:else}
							<!-- Red triangle pointing down (when pinching) -->
							<polygon points="4,4 12,4 8,12" fill={leewardColor} />
						{/if}
					</svg>
					<span class="tell-tale-label-small">Leeward</span>
				</div>
				<!-- Windward Tell Tale -->
				<div class="tell-tale" class:ok={windwardColor === '#28a745'} class:bad={windwardColor === '#dc3545'}>
					<svg width="16" height="16" viewBox="0 0 16 16" class="tell-tale-icon">
						{#if windwardDirection === 'sideways'}
							<!-- Green triangle pointing left (windward) -->
							<polygon points="12,8 4,4 4,12" fill={windwardColor} />
						{:else}
							<!-- Red triangle pointing down (when footing) -->
							<polygon points="4,4 12,4 8,12" fill={windwardColor} />
						{/if}
					</svg>
					<span class="tell-tale-label-small">Windward</span>
				</div>
			</div>
		</div>

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
			<div class="metric-card atw-metric">
				<div class="metric-label">
					<span>Angle to Wind</span>
					<button
						type="button"
						class="info-icon"
						on:click|stopPropagation={() => (showATWModal = true)}
						aria-label="Learn more about Angle to Wind"
					>
						ℹ️
					</button>
				</div>
				<div
					class="metric-value"
					class:green={atwColor === 'green'}
					class:yellow={atwColor === 'yellow'}
					class:red={atwColor === 'red'}
				>
					{formatCssDeg(atw)}
				</div>
				<div class="metric-target">Target: {formatCssDeg(targetATW)}</div>
				<div class="metric-delta">{atwDelta > 0 ? '+' : ''}{formatCssDeg(atwDelta)}</div>
			</div>

			<!-- VMG (Top Right) -->
			<div class="metric-card vmg-metric">
				<div class="metric-label">
					<span>VMG</span>
					<button
						type="button"
						class="info-icon"
						on:click|stopPropagation={() => (showVMGModal = true)}
						aria-label="Learn more about VMG"
					>
						ℹ️
					</button>
				</div>
				<div class="metric-value">{vmg.toFixed(2)} kt</div>
				<div class="vmg-bar-mini">
					<div
						class="vmg-bar-fill-mini"
						style="width: {vmgPercent}%"
						class:good={vmgPercent >= 95}
						class:ok={vmgPercent >= 85 && vmgPercent < 95}
						class:poor={vmgPercent < 85}
					></div>
				</div>
				<div class="metric-delta">
					{vmgPercent}%
					{#if vmgTrend !== 'stable'}
						<span class="trend-icon" class:up={vmgTrend === 'up'} class:down={vmgTrend === 'down'}>
							{vmgTrend === 'up' ? '▲' : '▼'}
						</span>
					{/if}
				</div>
			</div>

			<!-- Lift/Header (Middle Left) - Now shown as bar above, keep compact indicator here -->
			{#if isLift || isHeader}
				<div class="metric-card lift-header-metric" class:lift={isLift} class:header={isHeader}>
					<div class="metric-label">Wind Shift</div>
					<div class="metric-value-large">
						<span class="shift-arrow">{isLift ? '↗' : '↘'}</span>
						{isLift ? 'LIFT' : 'HEADER'}
					</div>
					<div class="metric-delta">{isLift ? '+' : '−'}{Math.abs(liftAmount).toFixed(0)}°</div>
				</div>
			{:else}
				<!-- Empty space when no shift -->
				<div class="metric-card lift-header-metric">
					<div class="metric-label">Wind Shift</div>
					<div class="metric-value-small" style="color: var(--color-text-muted);">No shift</div>
				</div>
			{/if}

			<!-- Mode (Middle Right) -->
			<div class="metric-card mode-metric">
				<div class="metric-label">Mode</div>
				<div class="metric-value">{mode}</div>
			</div>

			<!-- Heading (Bottom Left) -->
			<div class="metric-card heading-metric">
				<div class="metric-label">
					<span>Heading</span>
					<button
						type="button"
						class="info-icon"
						on:click|stopPropagation={() => (showHeadingModal = true)}
						aria-label="Learn more about Heading"
					>
						ℹ️
					</button>
				</div>
				<div class="metric-value-small">HDG {formatCssDeg(boat.rotation)}</div>
				<div class="metric-target-small">OPT {formatCssDeg(optimalHeading)}</div>
				<div class="metric-delta">{headingDelta > 0 ? '+' : ''}{formatCssDeg(headingDelta)}</div>
			</div>

			<!-- Tack Advantage (Bottom Right) -->
			<div
				class="metric-card tack-metric"
				class:advantage={tackAdvantage < 0}
				class:disadvantage={tackAdvantage > 0}
			>
				<div class="metric-label">
					<span>Tack Advantage</span>
					<button
						type="button"
						class="info-icon"
						on:click|stopPropagation={() => (showTackAdvantageModal = true)}
						aria-label="Learn more about Tack Advantage"
					>
						ℹ️
					</button>
				</div>
				<div class="metric-value">{tackAdvantage > 0 ? '+' : ''}{tackAdvantagePercent}%</div>
			</div>
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
<Modal open={showVMGModal} title="VMG (Velocity Made Good)" size="md" on:close={() => (showVMGModal = false)}>
	<div class="vmg-info-content">
		<!-- Subtitle -->
		<p class="vmg-subtitle">
			Your speed toward the mark. VMG measures how effectively you're closing the distance,
			not just how fast you're sailing. A boat sailing fast but away from the mark has low VMG.
		</p>

		<!-- Hero Stat: VMG Value -->
		<div class="vmg-hero">
			<div class="vmg-value">{vmg.toFixed(1)}</div>
			<div class="vmg-unit">kn</div>
			<div class="vmg-label">VMG</div>
		</div>

		<!-- Supporting Indicators -->
		<div class="vmg-indicators">
			<div class="vmg-efficiency">
				<span class="efficiency-label">Efficiency</span>
				<span class="efficiency-value">{vmgPercent}%</span>
				<span class="efficiency-badge" style="background-color: {vmgStatusBgColor}; color: {vmgStatusColor}">
					{vmgStatusLabel}
				</span>
				{#if vmgTrend !== 'stable'}
					<span class="trend-inline" style="color: {vmgStatusColor}">
						<span class="trend-arrow-inline">{vmgTrend === 'up' ? '▲' : '▼'}</span>
						<span class="trend-label">{vmgTrend === 'up' ? 'Improving' : 'Declining'}</span>
					</span>
				{/if}
			</div>
		</div>

		<!-- VMG History Chart -->
		{#if vmgHistory.length > 0}
			<div class="vmg-chart-container">
				<div class="chart-header">
					<div class="chart-title">VMG over last {Math.min(vmgHistory.length, 60)} turns</div>
					<div class="chart-subtitle">Compared to optimal VMG for this wind angle</div>
				</div>
				<div class="chart-scale-legend">
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(40, 167, 69, 0.2); border-left: 3px solid #28a745;"></span>
						<span class="scale-label">≥95% Excellent</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(255, 193, 7, 0.2); border-left: 3px solid #ffc107;"></span>
						<span class="scale-label">85-95% Good</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(220, 53, 69, 0.2); border-left: 3px solid #dc3545;"></span>
						<span class="scale-label">&lt;85% Poor</span>
					</span>
				</div>
				<VMGChart
					history={vmgHistory}
					optimalVMG={optimalVMG}
					currentStatusColor={vmgStatusColor}
					currentVMG={vmg}
					currentEfficiency={vmgPercent}
				/>
				<button
					type="button"
					class="chart-explanation-toggle"
					on:click={() => (showChartExplanation = !showChartExplanation)}
				>
					How to read this chart {showChartExplanation ? '▾' : '▸'}
				</button>
				{#if showChartExplanation}
					<div class="chart-explanation">
						<p>
							VMG over time shows how fast you're closing the distance to the mark.
							The dashed line is your optimal VMG at this wind angle.
							Staying in the green zone means you're sailing efficiently toward the mark.
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Divider -->
		<hr class="vmg-divider" />

		<!-- Context-Aware Guidance -->
		<div class="vmg-guidance">
			<div class="guidance-section">
				<h4 class="guidance-title">What this means</h4>
				<ul class="guidance-list">
					<li><strong>High VMG</strong> = good progress toward mark</li>
					<li><strong>Low VMG</strong> = poor progress (even if boat speed is high)</li>
				</ul>
			</div>

			<div class="guidance-section">
				<h4 class="guidance-title">What to do</h4>
				<div class="contextual-guidance" style="color: {vmgStatusColor}">
					{#if vmgStatus === 'poor' && vmgTrend === 'down'}
						You're sailing fast but not toward the mark — adjust heading or tack.
					{:else if vmgStatus === 'good' && vmgTrend === 'up'}
						Improving efficiency — hold course.
					{:else if vmgStatus === 'excellent' && vmgTrend === 'stable'}
						Optimal VMG — maintain trim and angle.
					{:else if vmgStatus === 'poor'}
						Aim for 95%+ efficiency — adjust heading and tack.
					{:else}
						Aim for 95%+ efficiency.
					{/if}
				</div>
			</div>
		</div>
	</div>
</Modal>

<!-- ATW Info Modal -->
<Modal open={showATWModal} title="Angle to Wind (ATW)" size="md" on:close={() => (showATWModal = false)}>
	<div class="vmg-info-content">
		<!-- Subtitle -->
		<p class="vmg-subtitle">
			The angle between your boat's heading and the wind direction.
			Maintaining the optimal angle (45° for upwind) maximizes your VMG.
		</p>

		<!-- Hero Stat: ATW Value -->
		<div class="vmg-hero">
			<div class="vmg-value">{formatCssDeg(atw)}</div>
			<div class="vmg-unit">°</div>
			<div class="vmg-label">ATW</div>
		</div>

		<!-- Supporting Indicators -->
		<div class="vmg-indicators">
			<div class="vmg-efficiency">
				<span class="efficiency-label">Target</span>
				<span class="efficiency-value">{formatCssDeg(targetATW)}</span>
				<span class="efficiency-badge" style="background-color: {atwStatus === 'excellent' ? 'rgba(40, 167, 69, 0.12)' : atwStatus === 'good' ? 'rgba(255, 193, 7, 0.12)' : 'rgba(220, 53, 69, 0.12)'}; color: {atwStatusColor}">
					{atwStatusLabel}
				</span>
				<span class="trend-inline" style="color: {atwStatusColor}">
					<span class="metric-delta">{atwDelta > 0 ? '+' : ''}{formatCssDeg(atwDelta)}</span>
				</span>
			</div>
		</div>

		<!-- ATW History Chart -->
		{#if atwHistory.length > 0}
			<div class="vmg-chart-container">
				<div class="chart-header">
					<div class="chart-title">ATW over last {Math.min(atwHistory.length, 60)} turns</div>
					<div class="chart-subtitle">Compared to optimal angle ({formatCssDeg(targetATW)})</div>
				</div>
				<div class="chart-scale-legend">
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(40, 167, 69, 0.2); border-left: 3px solid #28a745;"></span>
						<span class="scale-label">±2° Excellent</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(255, 193, 7, 0.2); border-left: 3px solid #ffc107;"></span>
						<span class="scale-label">±5° Good</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(220, 53, 69, 0.2); border-left: 3px solid #dc3545;"></span>
						<span class="scale-label">&gt;5° Needs Adjustment</span>
					</span>
				</div>
				<ATWChart
					history={atwHistory}
					targetATW={targetATW}
					currentStatusColor={atwStatusColor}
					currentATW={atw}
					currentDelta={atwDelta}
				/>
				<button
					type="button"
					class="chart-explanation-toggle"
					on:click={() => (showATWChartExplanation = !showATWChartExplanation)}
				>
					How to read this chart {showATWChartExplanation ? '▾' : '▸'}
				</button>
				{#if showATWChartExplanation}
					<div class="chart-explanation">
						<p>
							ATW over time shows how consistently you're maintaining the optimal angle.
							The dashed line is your target angle ({formatCssDeg(targetATW)}).
							Staying in the green zone means you're sailing at the optimal angle for maximum VMG.
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Divider -->
		<hr class="vmg-divider" />

		<!-- Context-Aware Guidance -->
		<div class="vmg-guidance">
			<div class="guidance-section">
				<h4 class="guidance-title">What this means</h4>
				<ul class="guidance-list">
					<li><strong>Too low (&lt;{formatCssDeg(targetATW - 3)})</strong> = Pinching (sailing too close to wind)</li>
					<li><strong>Too high (&gt;{formatCssDeg(targetATW + 5)})</strong> = Footing (sailing too wide)</li>
					<li><strong>Just right ({formatCssDeg(targetATW)})</strong> = Optimal VMG angle</li>
				</ul>
			</div>

			<div class="guidance-section">
				<h4 class="guidance-title">What to do</h4>
				<div class="contextual-guidance" style="color: {atwStatusColor}">
					{#if atwStatus === 'poor'}
						Adjust your heading toward {formatCssDeg(targetATW)} — you're {atwDelta > 0 ? 'footing' : 'pinching'}.
					{:else if atwStatus === 'good'}
						Good angle — maintain course and watch for wind shifts.
					{:else}
						Excellent angle — you're sailing efficiently at the optimal VMG angle.
					{/if}
				</div>
			</div>
		</div>
	</div>
</Modal>

<!-- Heading Info Modal -->
<Modal open={showHeadingModal} title="Heading" size="md" on:close={() => (showHeadingModal = false)}>
	<div class="vmg-info-content">
		<!-- Subtitle -->
		<p class="vmg-subtitle">
			Your boat's current heading compared to the optimal heading for your tack.
			The optimal heading changes with wind shifts, so stay alert!
		</p>

		<!-- Hero Stat: Heading Value -->
		<div class="vmg-hero">
			<div class="vmg-value">{formatCssDeg(boat.rotation)}</div>
			<div class="vmg-unit">°</div>
			<div class="vmg-label">HDG</div>
		</div>

		<!-- Supporting Indicators -->
		<div class="vmg-indicators">
			<div class="vmg-efficiency">
				<span class="efficiency-label">Optimal</span>
				<span class="efficiency-value">{formatCssDeg(optimalHeading)}</span>
				<span class="efficiency-badge" style="background-color: {headingStatus === 'excellent' ? 'rgba(40, 167, 69, 0.12)' : headingStatus === 'good' ? 'rgba(255, 193, 7, 0.12)' : 'rgba(220, 53, 69, 0.12)'}; color: {headingStatusColor}">
					{headingStatusLabel}
				</span>
				<span class="trend-inline" style="color: {headingStatusColor}">
					<span class="metric-delta">{headingDelta > 0 ? '+' : ''}{formatCssDeg(headingDelta)}</span>
				</span>
			</div>
		</div>

		<!-- Heading History Chart -->
		{#if headingHistory.length > 0}
			<div class="vmg-chart-container">
				<div class="chart-header">
					<div class="chart-title">Heading vs Optimal over last {Math.min(headingHistory.length, 60)} turns</div>
					<div class="chart-subtitle">Shows how well you're maintaining optimal heading</div>
				</div>
				<div class="chart-scale-legend">
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(40, 167, 69, 0.2); border-left: 3px solid #28a745;"></span>
						<span class="scale-label">±3° On Course</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(255, 193, 7, 0.2); border-left: 3px solid #ffc107;"></span>
						<span class="scale-label">±5° Close</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(220, 53, 69, 0.2); border-left: 3px solid #dc3545;"></span>
						<span class="scale-label">&gt;5° Off Course</span>
					</span>
				</div>
				<HeadingChart
					history={headingHistory}
					currentStatusColor={headingStatusColor}
					currentHeading={boat.rotation}
					currentOptimal={optimalHeading}
					currentDelta={headingDelta}
				/>
				<button
					type="button"
					class="chart-explanation-toggle"
					on:click={() => (showHeadingChartExplanation = !showHeadingChartExplanation)}
				>
					How to read this chart {showHeadingChartExplanation ? '▾' : '▸'}
				</button>
				{#if showHeadingChartExplanation}
					<div class="chart-explanation">
						<p>
							Heading over time shows how consistently you're maintaining the optimal heading.
							The dashed line shows the optimal heading, which changes with wind shifts.
							Staying close to optimal means you're responding well to wind changes.
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Divider -->
		<hr class="vmg-divider" />

		<!-- Context-Aware Guidance -->
		<div class="vmg-guidance">
			<div class="guidance-section">
				<h4 class="guidance-title">What this means</h4>
				<ul class="guidance-list">
					<li><strong>HDG matches OPT</strong> = You're sailing at the optimal angle</li>
					<li><strong>Large delta</strong> = You're off the optimal heading</li>
					<li><strong>Optimal changes</strong> = Wind shifts change the optimal heading</li>
				</ul>
			</div>

			<div class="guidance-section">
				<h4 class="guidance-title">What to do</h4>
				<div class="contextual-guidance" style="color: {headingStatusColor}">
					{#if headingStatus === 'poor'}
						Adjust heading toward {formatCssDeg(optimalHeading)} — you're off course.
					{:else if headingStatus === 'good'}
						Good heading — maintain course and watch for wind shifts.
					{:else}
						Perfect heading — you're on the optimal course!
					{/if}
				</div>
			</div>
		</div>
	</div>
</Modal>

<!-- Tack Advantage Info Modal -->
<Modal open={showTackAdvantageModal} title="Tack Advantage" size="md" on:close={() => (showTackAdvantageModal = false)}>
	<div class="vmg-info-content">
		<!-- Subtitle -->
		<p class="vmg-subtitle">
			Comparison of your current tack vs. the opposite tack.
			Positive means your current tack is better; negative means the opposite tack would be better.
		</p>

		<!-- Hero Stat: Tack Advantage Value -->
		<div class="vmg-hero">
			<div class="vmg-value">{tackAdvantage > 0 ? '+' : ''}{tackAdvantagePercent}</div>
			<div class="vmg-unit">%</div>
			<div class="vmg-label">Advantage</div>
		</div>

		<!-- Supporting Indicators -->
		<div class="vmg-indicators">
			<div class="vmg-efficiency">
				<span class="efficiency-label">Current Tack</span>
				<span class="efficiency-value">{boat.tack ? 'Port' : 'Starboard'}</span>
				<span class="efficiency-badge" style="background-color: {tackAdvantageStatus === 'advantage' ? 'rgba(40, 167, 69, 0.12)' : 'rgba(220, 53, 69, 0.12)'}; color: {tackAdvantageStatusColor}">
					{tackAdvantageStatusLabel}
				</span>
			</div>
		</div>

		<!-- Tack Advantage History Chart -->
		{#if tackAdvantageHistory.length > 0}
			<div class="vmg-chart-container">
				<div class="chart-header">
					<div class="chart-title">Tack Advantage over last {Math.min(tackAdvantageHistory.length, 60)} turns</div>
					<div class="chart-subtitle">Positive = current tack better, Negative = opposite tack better</div>
				</div>
				<div class="chart-scale-legend">
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(40, 167, 69, 0.2); border-left: 3px solid #28a745;"></span>
						<span class="scale-label">Current Tack Better</span>
					</span>
					<span class="scale-item">
						<span class="scale-color" style="background-color: rgba(220, 53, 69, 0.2); border-left: 3px solid #dc3545;"></span>
						<span class="scale-label">Opposite Tack Better</span>
					</span>
				</div>
				<TackAdvantageChart
					history={tackAdvantageHistory}
					currentStatusColor={tackAdvantageStatusColor}
					currentAdvantage={tackAdvantagePercent}
				/>
				<button
					type="button"
					class="chart-explanation-toggle"
					on:click={() => (showTackAdvantageChartExplanation = !showTackAdvantageChartExplanation)}
				>
					How to read this chart {showTackAdvantageChartExplanation ? '▾' : '▸'}
				</button>
				{#if showTackAdvantageChartExplanation}
					<div class="chart-explanation">
						<p>
							Tack advantage shows whether your current tack or the opposite tack is better
							for reaching the mark. Positive values mean stay on current tack;
							negative values suggest considering a tack. Use with \"TACK SOON\" flag for decisions.
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Divider -->
		<hr class="vmg-divider" />

		<!-- Context-Aware Guidance -->
		<div class="vmg-guidance">
			<div class="guidance-section">
				<h4 class="guidance-title">What this means</h4>
				<ul class="guidance-list">
					<li><strong>Positive %</strong> = Your current tack is better</li>
					<li><strong>Negative %</strong> = The opposite tack would be better</li>
					<li><strong>Green border</strong> = Current tack is favored</li>
					<li><strong>Red border</strong> = Opposite tack is favored</li>
				</ul>
			</div>

			<div class="guidance-section">
				<h4 class="guidance-title">What to do</h4>
				<div class="contextual-guidance" style="color: {tackAdvantageStatusColor}">
					{#if tackAdvantageStatus === 'disadvantage' && vmgEfficiency < 0.9}
						Consider tacking — opposite tack is better and your VMG is low.
					{:else if tackAdvantageStatus === 'disadvantage'}
						Opposite tack is better, but VMG is acceptable — watch for better opportunity.
					{:else}
						Stay on current tack — you're on the favored tack.
					{/if}
				</div>
			</div>
		</div>
	</div>
</Modal>

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

	/* Tell Tales Indicators */
	.tell-tales-container {
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border-light);
	}

	.tell-tale-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-bottom: 6px;
		font-weight: var(--font-weight-semibold);
	}

	.tell-tales {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
		justify-content: center;
	}

	.tell-tale {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.tell-tale-icon {
		transition: transform 0.2s ease;
	}

	.tell-tale.ok .tell-tale-icon {
		filter: drop-shadow(0 0 2px rgba(40, 167, 69, 0.5));
	}

	.tell-tale.bad .tell-tale-icon {
		filter: drop-shadow(0 0 2px rgba(220, 53, 69, 0.5));
		animation: shake 0.5s ease-in-out;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-2px); }
		75% { transform: translateX(2px); }
	}

	.tell-tale-label-small {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
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

	.metric-card {
		background: var(--color-bg-primary);
		padding: var(--spacing-sm);
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--color-border-light);
	}

	.metric-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.info-icon {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 14px;
		padding: 2px 4px;
		line-height: 1;
		opacity: 0.6;
		transition: opacity 0.2s ease;
		border-radius: var(--border-radius-sm);
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.info-icon:hover {
		opacity: 1;
		background: var(--color-bg-secondary);
	}

	.info-icon:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		opacity: 1;
	}

	.metric-value {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		line-height: 1.2;
	}

	.metric-value.green {
		color: #28a745;
	}
	.metric-value.yellow {
		color: #ffc107;
	}
	.metric-value.red {
		color: #dc3545;
	}

	.metric-value-large {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.metric-value-small {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
	}

	.metric-target {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-top: 2px;
	}

	.metric-target-small {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.metric-delta {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-muted);
		margin-top: 2px;
	}

	/* VMG Bar Mini */
	.vmg-bar-mini {
		width: 100%;
		height: 4px;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 2px;
		overflow: hidden;
		margin: 4px 0;
	}

	.vmg-bar-fill-mini {
		height: 100%;
		transition: width 0.3s ease;
	}

	.vmg-bar-fill-mini.good {
		background: #28a745;
	}
	.vmg-bar-fill-mini.ok {
		background: #ffc107;
	}
	.vmg-bar-fill-mini.poor {
		background: #dc3545;
	}

	.trend-icon {
		font-size: 10px;
		margin-left: 4px;
	}

	.trend-icon.up {
		color: #28a745;
	}
	.trend-icon.down {
		color: #dc3545;
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
