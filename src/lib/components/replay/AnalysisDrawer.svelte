<script lang="ts">
	import { session } from '$lib/stores/session';
	import { courseMarks } from '$lib/stores/courseMarks';
	import { detectLegs } from '$lib/domain/services/LegDetectionService';
	import { detectManeuvers } from '$lib/domain/services/ManeuverDetectionService';
	import { computePerformanceScores } from '$lib/domain/services/PerformanceMetricsService';
	import SOGTimeChart from './charts/SOGTimeChart.svelte';
	import PerformanceRadar from './charts/PerformanceRadar.svelte';
	import { getBoatColorHex } from '$lib/types/game';
	import type { SailorTrack, Leg, Maneuver, PerformanceScore } from '$lib/types/session';

	export let open = false;

	type AnalysisTab = 'sog' | 'radar';
	let activeTab: AnalysisTab = 'sog';

	$: windDir = $session?.wind?.entries?.[0]?.direction ?? 0;
	$: raceCourse = $session?.raceCourse ?? { marks: [] };

	$: allLegs = computeAllLegs($session?.tracks ?? [], raceCourse, windDir);
	$: allManeuvers = computeAllManeuvers($session?.tracks ?? [], windDir);

	$: upwindScores = $session
		? computePerformanceScores($session.tracks, allManeuvers, allLegs, windDir, 'upwind')
		: [];
	$: downwindScores = $session
		? computePerformanceScores($session.tracks, allManeuvers, allLegs, windDir, 'downwind')
		: [];

	function computeAllLegs(
		tracks: SailorTrack[],
		rc: typeof raceCourse,
		wd: number
	): Map<string, Leg[]> {
		const map = new Map<string, Leg[]>();
		for (const track of tracks) {
			map.set(track.name, detectLegs(track, rc, wd));
		}
		return map;
	}

	function computeAllManeuvers(
		tracks: SailorTrack[],
		wd: number
	): Map<string, Maneuver[]> {
		const map = new Map<string, Maneuver[]>();
		for (const track of tracks) {
			map.set(track.name, detectManeuvers(track, wd));
		}
		return map;
	}
</script>

{#if open && $session}
	<div class="analysis-drawer">
		<div class="drawer-header">
			<div class="drawer-tabs">
				<button
					class="drawer-tab"
					class:active={activeTab === 'sog'}
					on:click={() => (activeTab = 'sog')}
				>SOG vs Time</button>
				<button
					class="drawer-tab"
					class:active={activeTab === 'radar'}
					on:click={() => (activeTab = 'radar')}
				>Performance Radar</button>
			</div>
		</div>

		<div class="drawer-content">
			{#if activeTab === 'sog'}
				<SOGTimeChart
					tracks={$session.tracks}
					{allLegs}
					windDirection={windDir}
				/>
			{:else if activeTab === 'radar'}
				<div class="radar-container">
					<div class="radar-pair">
						<PerformanceRadar scores={upwindScores} title="Upwind" />
						<!-- Legend in middle -->
						<div class="radar-legend">
							{#each $session.tracks as track}
								<div class="radar-legend-item">
									<span class="radar-legend-swatch" style="background:{getBoatColorHex(track.color)}"></span>
									<span class="radar-legend-name">{track.name}</span>
								</div>
							{/each}
						</div>
						<PerformanceRadar scores={downwindScores} title="Downwind" />
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.analysis-drawer {
		background: var(--color-bg-primary, #fff);
		border-top: 2px solid var(--color-border-medium, #ddd);
		display: flex;
		flex-direction: column;
		height: 300px;
		overflow: hidden;
	}

	.drawer-header {
		padding: 6px 12px;
		border-bottom: 1px solid var(--color-border-light, #eee);
		flex-shrink: 0;
	}

	.drawer-tabs {
		display: flex;
		gap: 2px;
	}

	.drawer-tab {
		padding: 6px 16px;
		border: none;
		border-radius: var(--radius-md, 6px);
		background: transparent;
		color: var(--color-text-secondary, #666);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	.drawer-tab:hover {
		background: var(--color-bg-tertiary, #f0f0f0);
	}
	.drawer-tab.active {
		background: var(--color-primary, #007bff);
		color: #fff;
	}

	.drawer-content {
		flex: 1;
		overflow: auto;
	}

	.radar-container {
		padding: 16px;
		background: #111;
		min-height: 100%;
	}

	.radar-pair {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}

	.radar-legend {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 0 8px;
	}
	.radar-legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.radar-legend-swatch {
		width: 20px;
		height: 4px;
		border-radius: 2px;
		flex-shrink: 0;
	}
	.radar-legend-name {
		font-size: 10px;
		color: rgba(255, 255, 255, 0.8);
		white-space: nowrap;
	}
</style>
