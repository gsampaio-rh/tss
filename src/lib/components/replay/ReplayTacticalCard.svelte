<script lang="ts">
	import type { Boat } from '$lib/types/boat';
	import type { SailorTrack, TrainingSession, Maneuver } from '$lib/types/session';
	import { getBoatColorHex } from '$lib/types/game';
	import { TacticalAnalysisService } from '$lib/domain/services/TacticalAnalysisService';
	import { Angle } from '$lib/domain/value-objects/Angle';
	import { Position } from '$lib/domain/value-objects/Position';
	import { interpolatePosition } from '$lib/domain/services/TrackInterpolator';
	import { detectManeuvers, computeManeuverStats } from '$lib/domain/services/ManeuverDetectionService';
	import { detectLegs } from '$lib/domain/services/LegDetectionService';
	import { computePerformanceScores } from '$lib/domain/services/PerformanceMetricsService';
	import SOGTimeChart from '$lib/components/replay/charts/SOGTimeChart.svelte';
	import PerformanceRadar from '$lib/components/replay/charts/PerformanceRadar.svelte';
	import { windwardMark, leewardMark, startLine } from '$lib/stores/courseMarks';

	export let boat: Boat;
	export let track: SailorTrack;
	export let session: TrainingSession;
	export let currentTime: number;
	export let playerIndex: number;

	type TabId = 'instruments' | 'performance' | 'maneuvers' | 'sogChart' | 'radar';
	let activeTab: TabId = 'instruments';
	let isCollapsed = true;

	const MS_TO_KNOTS = 1.94384;

	$: pos = interpolatePosition(track, currentTime);
	$: speedKnots = (pos?.speed ?? 0) * MS_TO_KNOTS;
	$: heading = pos?.rotation ?? 0;
	$: normalizedHeading = ((heading % 360) + 360) % 360;
	$: tackSide = pos?.tack ? 'Port' : 'Starboard';

	// Wind at current time
	$: windDir = getWindAtTime(currentTime);
	$: windSpeed = getWindSpeedAtTime(currentTime);

	function getWindAtTime(timeMs: number): number {
		const entries = session.wind.entries;
		if (entries.length === 0) return 0;
		if (entries.length === 1) return entries[0].direction;
		for (let i = entries.length - 1; i >= 0; i--) {
			if (entries[i].time <= timeMs) return entries[i].direction;
		}
		return entries[0].direction;
	}

	function getWindSpeedAtTime(timeMs: number): number {
		const entries = session.wind.entries;
		if (entries.length === 0) return 0;
		if (entries.length === 1) return entries[0].speed;
		for (let i = entries.length - 1; i >= 0; i--) {
			if (entries[i].time <= timeMs) return entries[i].speed;
		}
		return entries[0].speed;
	}

	// TWA (True Wind Angle) - angle between heading and wind
	$: twa = angleDiff(heading, windDir);
	$: absTwa = Math.abs(twa);

	// VMG toward windward mark
	$: vmgTarget = $windwardMark || ($leewardMark ? $leewardMark : null);
	$: vmg = vmgTarget && pos
		? computeVmgToGpsMark(pos.x, pos.y, pos.speed, heading, vmgTarget.lat, vmgTarget.lon)
		: null;

	function computeVmgToGpsMark(
		x: number, y: number, speed: number, hdg: number,
		markLat: number, markLon: number
	): number {
		// Simple VMG: speed * cos(angle between heading and bearing to mark)
		// For now, use ATW-based VMG since marks are in GPS coords
		const atwRad = (absTwa * Math.PI) / 180;
		return speed * Math.cos(atwRad) * MS_TO_KNOTS;
	}

	// VMG as percentage of theoretical best
	$: vmgEfficiency = vmg !== null && speedKnots > 0
		? Math.min(100, Math.abs(vmg / speedKnots) * 100)
		: null;

	// Elapsed time
	$: elapsedS = (currentTime - session.startTime) / 1000;
	$: elapsedStr = formatDuration(elapsedS);

	// Distance to windward mark (simplified)
	$: distToMark = $windwardMark && pos
		? computeDistToMark(pos, $windwardMark.lat, $windwardMark.lon)
		: null;

	function computeDistToMark(
		p: { x: number; y: number },
		markLat: number,
		markLon: number
	): number | null {
		// Approximate distance using session bounds projection
		// This is a rough estimate
		return null; // Will be computed from GPS positions when available
	}

	// Maneuvers
	$: maneuvers = detectManeuvers(track, windDir);
	$: maneuverStats = computeManeuverStats(maneuvers);
	$: maneuversUpToNow = maneuvers.filter((m) => m.time <= currentTime);
	$: legs = detectLegs(track, session.raceCourse, windDir);
	$: legMap = new Map([[track.name, legs]]);
	$: maneuversMap = new Map([[track.name, maneuvers]]);
	$: radarScore = computePerformanceScores([track], maneuversMap, legMap, windDir, 'upwind');

	// Performance metrics
	$: timeOnStarboard = computeTimeOnTack(false);
	$: timeOnPort = computeTimeOnTack(true);
	$: speedPercentile = track.stats.maxSpeedKnots > 0
		? (speedKnots / track.stats.maxSpeedKnots) * 100
		: 0;
	$: twaOptimal = absTwa >= 35 && absTwa <= 50 ? 100 : absTwa >= 25 && absTwa <= 65 ? 70 : 30;
	function computeTimeOnTack(isPort: boolean): number {
		// Simplified: count points up to current time on each tack
		let count = 0;
		let total = 0;
		for (const pt of track.points) {
			if (pt.time > currentTime) break;
			total++;
			if (pt.tack === isPort) count++;
		}
		return total > 0 ? (count / total) * 100 : 50;
	}

	function angleDiff(a: number, b: number): number {
		let d = b - a;
		if (d > 180) d -= 360;
		if (d < -180) d += 360;
		return d;
	}

	function formatDuration(s: number): string {
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	function formatTime(ms: number): string {
		const d = new Date(ms);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}
</script>

<div
	class="sailor-card"
	class:collapsed={isCollapsed}
	data-player-index={playerIndex.toString()}
	style="--boat-color: {getBoatColorHex(boat.color)}"
>
	<!-- Header with boat name and color -->
	<div class="card-header" on:dblclick={() => (isCollapsed = !isCollapsed)}>
		<div class="player-identity">
			<div class="player-avatar" style="background-color: {getBoatColorHex(boat.color)};">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -10 14 20" width="20" height="28">
					<path d="M -4 7.5 L 4 7.5 C 5 1.5 5 -2.5 2.5 -9 L -2.5 -9 C -5 -2.5 -5 1.5 -4 7.5 Z"
						stroke="#fff" stroke-width=".5" fill="#fff" fill-opacity="0.3" />
					<path d="M 0 -6 C 2 -4 3 -1 2 6" stroke="white" fill="none" stroke-width="1" />
				</svg>
			</div>
			<div class="player-info">
				<strong class="player-name">{track.name}</strong>
			</div>
		</div>
		<div class="header-actions">
			<span class="tack-badge" class:port={pos?.tack} class:starboard={!pos?.tack}>
				{tackSide}
			</span>
			<button
				class="collapse-btn"
				on:click={() => (isCollapsed = !isCollapsed)}
				title={isCollapsed ? 'Expand card' : 'Collapse card'}
				aria-label={isCollapsed ? 'Expand card' : 'Collapse card'}
			>
				<svg class="collapse-icon" class:open={!isCollapsed} viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
					<path d="M3.646 6.146a.5.5 0 0 1 .708 0L8 9.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708z"/>
				</svg>
			</button>
		</div>
	</div>

	{#if isCollapsed}
		<div class="collapsed-metrics">
			<div class="collapsed-metric">
				<span class="metric-label-row">
					<span class="collapsed-key">SOG</span>
					<span class="info-trigger" tabindex="0" aria-label="SOG explanation" on:click|stopPropagation>
						<span class="info-dot">i</span>
						<span class="info-tooltip">Speed Over Ground: your current speed relative to the water and current GPS movement.</span>
					</span>
				</span>
				<span class="collapsed-val">{speedKnots.toFixed(1)} kts</span>
			</div>
			<div class="collapsed-metric">
				<span class="metric-label-row">
					<span class="collapsed-key">VMG</span>
					<span class="info-trigger" tabindex="0" aria-label="VMG explanation" on:click|stopPropagation>
						<span class="info-dot">i</span>
						<span class="info-tooltip">Velocity Made Good: component of speed toward the upwind/downwind target direction.</span>
					</span>
				</span>
				<span class="collapsed-val">{vmg !== null ? `${vmg.toFixed(1)} kts` : '--'}</span>
			</div>
			<div class="collapsed-metric">
				<span class="metric-label-row">
					<span class="collapsed-key">TWA</span>
					<span class="info-trigger" tabindex="0" aria-label="TWA explanation" on:click|stopPropagation>
						<span class="info-dot">i</span>
						<span class="info-tooltip">True Wind Angle: angle between boat heading and true wind direction.</span>
					</span>
				</span>
				<span class="collapsed-val">{twa > 0 ? '+' : ''}{twa.toFixed(0)}&deg;</span>
			</div>
		</div>
	{:else}
		<!-- Tabs -->
		<div class="tab-bar">
			<button class="tab" class:active={activeTab === 'instruments'} on:click={() => activeTab = 'instruments'}>
				Instruments
			</button>
			<button class="tab" class:active={activeTab === 'performance'} on:click={() => activeTab = 'performance'}>
				Performance
			</button>
			<button class="tab" class:active={activeTab === 'maneuvers'} on:click={() => activeTab = 'maneuvers'}>
				Maneuvers
			</button>
			<button class="tab" class:active={activeTab === 'sogChart'} on:click={() => activeTab = 'sogChart'}>
				SOG vs Time
			</button>
			<button class="tab" class:active={activeTab === 'radar'} on:click={() => activeTab = 'radar'}>
				Radar
			</button>
		</div>

		<!-- Tab Content -->
		<div class="tab-content">
		{#if activeTab === 'instruments'}
			<div class="instruments-grid">
				<div class="instrument">
					<div class="inst-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 2v20M2 12h20" stroke-opacity="0.3"/>
							<path d="M12 2l4 8h-8l4-8z" fill="currentColor" stroke="none"/>
						</svg>
					</div>
					<div class="inst-data">
						<span class="inst-value">{speedKnots.toFixed(1)}</span>
						<span class="inst-unit">kts</span>
					</div>
					<span class="metric-label-row">
						<span class="inst-label">SOG</span>
						<span class="info-trigger" tabindex="0" aria-label="SOG explanation" on:click|stopPropagation>
							<span class="info-dot">i</span>
							<span class="info-tooltip">Speed Over Ground in knots.</span>
						</span>
					</span>
				</div>

				<div class="instrument">
					<div class="inst-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 2L19 21H5L12 2z" fill="currentColor" stroke="none" transform="rotate({normalizedHeading}, 12, 12)"/>
						</svg>
					</div>
					<div class="inst-data">
						<span class="inst-value">{normalizedHeading.toFixed(0)}</span>
						<span class="inst-unit">deg</span>
					</div>
					<span class="metric-label-row">
						<span class="inst-label">Heading</span>
						<span class="info-trigger" tabindex="0" aria-label="Heading explanation" on:click|stopPropagation>
							<span class="info-dot">i</span>
							<span class="info-tooltip">Compass direction the boat bow is pointing to.</span>
						</span>
					</span>
				</div>

				<div class="instrument">
					<div class="inst-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="currentColor" opacity="0.3"/>
							<path d="M12 6l2.5 6L12 18l-2.5-6L12 6z" fill="currentColor"/>
						</svg>
					</div>
					<div class="inst-data">
						<span class="inst-value">{twa > 0 ? '+' : ''}{twa.toFixed(0)}</span>
						<span class="inst-unit">deg</span>
					</div>
					<span class="metric-label-row">
						<span class="inst-label">TWA</span>
						<span class="info-trigger" tabindex="0" aria-label="TWA explanation" on:click|stopPropagation>
							<span class="info-dot">i</span>
							<span class="info-tooltip">True Wind Angle relative to heading. Positive/negative indicates side.</span>
						</span>
					</span>
				</div>

				<div class="instrument">
					<div class="inst-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<div class="inst-data">
						<span class="inst-value">{vmg !== null ? vmg.toFixed(1) : '--'}</span>
						<span class="inst-unit">kts</span>
					</div>
					<span class="metric-label-row">
						<span class="inst-label">VMG</span>
						<span class="info-trigger" tabindex="0" aria-label="VMG explanation" on:click|stopPropagation>
							<span class="info-dot">i</span>
							<span class="info-tooltip">Velocity Made Good toward the active mark direction.</span>
						</span>
					</span>
				</div>

				<div class="instrument">
					<div class="inst-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
							<path d="M12 4C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" opacity="0.3"/>
							<circle cx="12" cy="11.5" r="2.5"/>
						</svg>
					</div>
					<div class="inst-data">
						<span class="inst-value">{absTwa.toFixed(0)}</span>
						<span class="inst-unit">deg</span>
					</div>
					<span class="metric-label-row">
						<span class="inst-label">ATW</span>
						<span class="info-trigger" tabindex="0" aria-label="ATW explanation" on:click|stopPropagation>
							<span class="info-dot">i</span>
							<span class="info-tooltip">Absolute True Wind Angle (always positive).</span>
						</span>
					</span>
				</div>

				<div class="instrument">
					<div class="inst-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
							<path d="M3 15h18v2H3v-2zm0-4h18v2H3v-2zm0-4h18v2H3V7z" opacity="0.3"/>
							<circle cx="12" cy="12" r="3"/>
						</svg>
					</div>
					<div class="inst-data">
						<span class="inst-value">{windSpeed > 0 ? windSpeed.toFixed(0) : '--'}</span>
						<span class="inst-unit">kts</span>
					</div>
					<span class="metric-label-row">
						<span class="inst-label">TWS</span>
						<span class="info-trigger" tabindex="0" aria-label="TWS explanation" on:click|stopPropagation>
							<span class="info-dot">i</span>
							<span class="info-tooltip">True Wind Speed in knots at current replay time.</span>
						</span>
					</span>
				</div>
			</div>

		{:else if activeTab === 'performance'}
			<div class="performance-section">
				<!-- Speed gauge -->
				<div class="perf-row">
					<span class="perf-label">Speed % of Max</span>
					<div class="perf-bar-container">
						<div class="perf-bar" style="width: {Math.min(100, speedPercentile)}%;"
							class:good={speedPercentile > 75}
							class:ok={speedPercentile > 50 && speedPercentile <= 75}
							class:poor={speedPercentile <= 50}
						></div>
					</div>
					<span class="perf-value">{speedPercentile.toFixed(0)}%</span>
				</div>

				{#if vmgEfficiency !== null}
					<div class="perf-row">
						<span class="perf-label">VMG Efficiency</span>
						<div class="perf-bar-container">
							<div class="perf-bar" style="width: {vmgEfficiency}%;"
								class:good={vmgEfficiency > 80}
								class:ok={vmgEfficiency > 60 && vmgEfficiency <= 80}
								class:poor={vmgEfficiency <= 60}
							></div>
						</div>
						<span class="perf-value">{vmgEfficiency.toFixed(0)}%</span>
					</div>
				{/if}

				<div class="perf-row">
					<span class="perf-label">TWA Optimal</span>
					<div class="perf-bar-container">
						<div class="perf-bar" style="width: {twaOptimal}%;"
							class:good={twaOptimal > 80}
							class:ok={twaOptimal > 50 && twaOptimal <= 80}
							class:poor={twaOptimal <= 50}
						></div>
					</div>
					<span class="perf-value" class:good={absTwa >= 35 && absTwa <= 50} class:ok={absTwa >= 25 && absTwa <= 65} class:poor={absTwa < 25 || absTwa > 65}>
						{absTwa.toFixed(0)}°
					</span>
				</div>

				<!-- Tack distribution -->
				<div class="tack-distribution">
					<span class="perf-label">Tack Distribution</span>
					<div class="tack-bar">
						<div class="tack-port" style="width: {timeOnPort}%;">
							P {timeOnPort.toFixed(0)}%
						</div>
						<div class="tack-stbd" style="width: {100 - timeOnPort}%;">
							S {(100 - timeOnPort).toFixed(0)}%
						</div>
					</div>
				</div>

				<!-- Summary stats -->
				<div class="perf-stats">
					<div class="stat">
						<span class="stat-label">Distance</span>
						<span class="stat-value">{(track.stats.totalDistanceM / 1000).toFixed(2)} km</span>
					</div>
					<div class="stat">
						<span class="stat-label">Duration</span>
						<span class="stat-value">{formatDuration(track.stats.durationS)}</span>
					</div>
					<div class="stat">
						<span class="stat-label">Avg Speed</span>
						<span class="stat-value">{track.stats.avgSpeedKnots.toFixed(1)} kts</span>
					</div>
					<div class="stat">
						<span class="stat-label">Max Speed</span>
						<span class="stat-value">{track.stats.maxSpeedKnots.toFixed(1)} kts</span>
					</div>
				</div>
			</div>

		{:else if activeTab === 'sogChart'}
			<div class="chart-tab">
				<div class="chart-scroll">
					<SOGTimeChart tracks={[track]} allLegs={legMap} windDirection={windDir} />
				</div>
			</div>

		{:else if activeTab === 'radar'}
			<div class="chart-tab">
				<div class="radar-single-wrap">
					<PerformanceRadar scores={radarScore} title="Upwind Performance" />
				</div>
			</div>

		{:else if activeTab === 'maneuvers'}
			<div class="maneuvers-section">
				<div class="maneuver-summary">
					<div class="maneuver-stat">
						<span class="stat-big">{maneuverStats.totalTacks}</span>
						<span class="stat-label">Tacks</span>
					</div>
					<div class="maneuver-stat">
						<span class="stat-big">{maneuverStats.totalGybes}</span>
						<span class="stat-label">Gybes</span>
					</div>
					<div class="maneuver-stat">
						<span class="stat-big">{maneuverStats.avgTackAngle > 0 ? maneuverStats.avgTackAngle.toFixed(0) + '°' : '--'}</span>
						<span class="stat-label">Avg Angle</span>
					</div>
					<div class="maneuver-stat">
						<span class="stat-big">{maneuverStats.avgTackDuration > 0 ? maneuverStats.avgTackDuration.toFixed(1) + 's' : '--'}</span>
						<span class="stat-label">Avg Time</span>
					</div>
				</div>

				{#if maneuverStats.avgSpeedLossTack > 0}
					<div class="speed-loss-row">
						<span class="perf-label">Avg Speed Loss (Tack)</span>
						<span class="speed-loss-value">-{maneuverStats.avgSpeedLossTack.toFixed(1)} kts</span>
					</div>
				{/if}

				{#if maneuverStats.avgSpeedLossGybe > 0}
					<div class="speed-loss-row">
						<span class="perf-label">Avg Speed Loss (Gybe)</span>
						<span class="speed-loss-value">-{maneuverStats.avgSpeedLossGybe.toFixed(1)} kts</span>
					</div>
				{/if}

				<!-- Recent maneuvers timeline -->
				{#if maneuversUpToNow.length > 0}
					<div class="maneuver-list">
						<span class="list-title">Recent Maneuvers</span>
						{#each maneuversUpToNow.slice(-5).reverse() as m}
							<div class="maneuver-item" class:tack={m.type === 'tack'} class:gybe={m.type === 'gybe'}>
								<span class="maneuver-type">{m.type === 'tack' ? 'T' : 'G'}</span>
								<span class="maneuver-time">{formatTime(m.time)}</span>
								<span class="maneuver-angle">{m.headingChange.toFixed(0)}°</span>
								<span class="maneuver-duration">{m.duration.toFixed(1)}s</span>
								<span class="maneuver-speed-loss">
									-{((m.speedBefore - m.speedMin) * MS_TO_KNOTS).toFixed(1)} kts
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="no-maneuvers">No maneuvers detected yet</p>
				{/if}
			</div>
		{/if}
		</div>
	{/if}
</div>

<style>
	.sailor-card {
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-lg);
		overflow: hidden;
		margin-bottom: 10px;
		box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
		transition: box-shadow 0.16s ease, border-color 0.16s ease;
	}

	.sailor-card:not(.collapsed) {
		background: linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(248, 250, 252, 1));
	}

	.sailor-card:hover {
		border-color: var(--color-border-dark);
		box-shadow: 0 4px 10px rgba(16, 24, 40, 0.1);
	}

	/* Header */
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		border-bottom: 1px solid var(--color-border-light);
		background: rgba(255, 255, 255, 0.8);
		margin: 0;
	}

	.player-identity {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.player-avatar {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
		border: 2px solid rgba(255, 255, 255, 0.7);
	}

	.player-name {
		font-size: 13px;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.tack-badge {
		font-size: 11px;
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		font-weight: var(--font-weight-semibold);
	}

	.tack-badge.port {
		background: rgba(220, 53, 69, 0.1);
		color: var(--color-danger);
	}

	.tack-badge.starboard {
		background: rgba(40, 167, 69, 0.1);
		color: var(--color-success);
	}

	.collapse-btn {
		width: 24px;
		height: 24px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.collapse-btn:hover {
		color: var(--color-text-primary);
		background: var(--color-bg-tertiary);
	}

	.collapse-icon {
		transition: transform 0.16s ease;
	}

	.collapse-icon.open {
		transform: rotate(180deg);
	}

	.collapsed-metrics {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 6px;
		padding: 10px;
		background: linear-gradient(180deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0));
	}

	.collapsed-metric {
		display: flex;
		flex-direction: column;
		padding: 6px 7px;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		min-width: 0;
	}

	.collapsed-key {
		font-size: 9px;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.metric-label-row {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.collapsed-val {
		font-size: 12px;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Tab Bar */
	.tab-bar {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		align-items: stretch;
		gap: 0;
		padding: 0 10px;
		border-bottom: 1px solid var(--color-border-light);
		background: rgba(255, 255, 255, 0.7);
		overflow: visible;
		margin: 0;
	}

	.tab {
		display: block;
		width: 100%;
		min-width: 0;
		padding: 6px 12px 5px;
		border: none;
		border-radius: 0;
		background: transparent;
		font-size: 11px;
		font-weight: var(--font-weight-semibold);
		color: rgba(71, 85, 105, 0.9);
		cursor: pointer;
		transition: color var(--transition-fast), background var(--transition-fast);
		white-space: nowrap;
		position: relative;
		text-align: center;
		line-height: 1.15;
		margin: 0;
		appearance: none;
		-webkit-appearance: none;
	}

	.tab.active {
		color: var(--boat-color);
		background: rgba(255, 255, 255, 0.55);
	}

	.tab.active::after {
		content: '';
		position: absolute;
		left: 10px;
		right: 10px;
		bottom: 0;
		height: 2px;
		border-radius: 2px 2px 0 0;
		background: var(--boat-color);
	}

	.tab:hover:not(.active) {
		color: var(--color-text-primary);
		background: rgba(15, 23, 42, 0.04);
	}

	/* Tab Content */
	.tab-content {
		padding: 10px 10px 12px;
	}

	/* Instruments Grid */
	.instruments-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 8px;
	}

	.instrument {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8px 6px;
		background: rgba(255, 255, 255, 0.85);
		border: 1px solid rgba(15, 23, 42, 0.08);
		border-radius: var(--radius-sm);
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
		gap: 3px;
	}

	.inst-icon {
		color: rgba(100, 116, 139, 0.95);
		height: 22px;
		width: 22px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		background: rgba(148, 163, 184, 0.15);
	}

	.inst-data {
		display: flex;
		align-items: baseline;
		gap: 2px;
	}

	.inst-value {
		font-size: 17px;
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		line-height: 1;
	}

	.inst-unit {
		font-size: 10px;
		color: var(--color-text-secondary);
	}

	.inst-label {
		font-size: 9px;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.7px;
	}

	.info-trigger {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		flex-shrink: 0;
	}

	.info-dot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 1px solid rgba(100, 116, 139, 0.5);
		font-size: 9px;
		font-weight: 700;
		line-height: 1;
		color: rgba(71, 85, 105, 0.9);
		background: rgba(255, 255, 255, 0.75);
	}

	.info-tooltip {
		position: absolute;
		left: 50%;
		bottom: calc(100% + 8px);
		transform: translateX(-50%);
		width: min(190px, 44vw);
		padding: 6px 8px;
		border-radius: var(--radius-sm);
		background: rgba(21, 24, 33, 0.96);
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
		font-size: 10px;
		font-weight: 500;
		line-height: 1.35;
		color: rgba(255, 255, 255, 0.92);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.14s ease;
		z-index: 1200;
		text-transform: none;
		letter-spacing: normal;
		white-space: normal;
	}

	.info-trigger:hover .info-tooltip,
	.info-trigger:focus-within .info-tooltip {
		opacity: 1;
	}

	/* Performance */
	.performance-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.chart-tab {
		padding: 0;
	}

	.chart-scroll {
		overflow-x: auto;
		overflow-y: hidden;
	}

	.radar-single-wrap {
		background: #111;
		border-radius: var(--radius-md);
		padding: 8px 6px;
		display: flex;
		justify-content: center;
		overflow-x: auto;
	}

	.perf-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.perf-label {
		font-size: 10px;
		color: var(--color-text-secondary);
		min-width: 80px;
	}

	.perf-bar-container {
		flex: 1;
		height: 6px;
		background: var(--color-bg-tertiary);
		border-radius: 3px;
		overflow: hidden;
	}

	.perf-bar {
		height: 100%;
		border-radius: 3px;
		transition: width var(--transition-base);
	}

	.perf-bar.good { background: var(--color-success); }
	.perf-bar.ok { background: var(--color-warning); }
	.perf-bar.poor { background: var(--color-danger); }

	.perf-value {
		font-size: 11px;
		font-weight: var(--font-weight-semibold);
		min-width: 32px;
		text-align: right;
		color: var(--color-text-primary);
	}

	.perf-value.good { color: var(--color-success); }
	.perf-value.ok { color: var(--color-warning); }
	.perf-value.poor { color: var(--color-danger); }

	/* Tack Distribution */
	.tack-distribution {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.tack-bar {
		display: flex;
		height: 20px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		font-size: 9px;
		font-weight: var(--font-weight-semibold);
	}

	.tack-port {
		background: rgba(220, 53, 69, 0.15);
		color: var(--color-danger);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tack-stbd {
		background: rgba(40, 167, 69, 0.15);
		color: var(--color-success);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Performance Stats */
	.perf-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
		padding-top: 6px;
		border-top: 1px solid var(--color-border-light);
	}

	.stat {
		display: flex;
		flex-direction: column;
		padding: 4px 6px;
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-sm);
	}

	.stat-label {
		font-size: 9px;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.stat-value {
		font-size: 12px;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	/* Maneuvers */
	.maneuvers-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.maneuver-summary {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
	}

	.maneuver-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 6px 2px;
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-sm);
	}

	.stat-big {
		font-size: 18px;
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		line-height: 1.1;
	}

	.maneuver-stat .stat-label {
		font-size: 8px;
	}

	.speed-loss-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 6px;
		background: rgba(220, 53, 69, 0.05);
		border-radius: var(--radius-sm);
	}

	.speed-loss-value {
		font-size: 12px;
		font-weight: var(--font-weight-semibold);
		color: var(--color-danger);
	}

	/* Maneuver List */
	.maneuver-list {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.list-title {
		font-size: 10px;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.3px;
		margin-bottom: 2px;
	}

	.maneuver-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 3px 6px;
		border-radius: var(--radius-sm);
		font-size: 10px;
	}

	.maneuver-item.tack {
		background: rgba(0, 123, 255, 0.05);
	}

	.maneuver-item.gybe {
		background: rgba(255, 140, 0, 0.05);
	}

	.maneuver-type {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 9px;
		font-weight: var(--font-weight-bold);
		color: white;
		flex-shrink: 0;
	}

	.tack .maneuver-type {
		background: var(--color-primary);
	}

	.gybe .maneuver-type {
		background: #ff8c00;
	}

	.maneuver-time {
		color: var(--color-text-secondary);
		min-width: 56px;
	}

	.maneuver-angle {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		min-width: 28px;
	}

	.maneuver-duration {
		color: var(--color-text-secondary);
		min-width: 28px;
	}

	.maneuver-speed-loss {
		color: var(--color-danger);
		font-weight: var(--font-weight-medium);
		margin-left: auto;
	}

	.no-maneuvers {
		font-size: 11px;
		color: var(--color-text-secondary);
		text-align: center;
		padding: 12px 0;
		margin: 0;
	}
</style>
