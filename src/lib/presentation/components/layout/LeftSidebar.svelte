<script lang="ts">
	import SidebarSection from '$lib/presentation/components/shared/SidebarSection.svelte';
	import WindSelector from '$lib/components/controls/WindSelector.svelte';
	import PlayersPanel from '$lib/components/controls/PlayersPanel.svelte';
	import ImportPanel from '$lib/components/replay/ImportPanel.svelte';
	import WindInput from '$lib/components/replay/WindInput.svelte';
	import CourseMarksPanel from '$lib/components/replay/CourseMarksPanel.svelte';
	import { appMode, session } from '$lib/stores/session';

	const helpText = {
		gpx: 'Import one or more GPX files to replay a training session. Each file becomes a separate sailor track.',
		wind: 'Set the wind direction and speed. You can add wind shifts at specific times or auto-estimate from track data.',
		course: 'Define the race course by placing start line, windward, and leeward marks on the map.',
		windSim: 'Choose a pre-built wind scenario or create a custom one to start the simulation.',
		players: 'Add human or AI players. Each player controls a boat and makes tactical decisions.'
	};
</script>

<div class="sidebar sidebar-left">
	<div class="sidebar-content">
		{#if $appMode === 'replay'}
			<SidebarSection title="GPX Import" tooltip={helpText.gpx}>
				<ImportPanel />
			</SidebarSection>

			{#if $session}
				<SidebarSection title="Wind Data" tooltip={helpText.wind}>
					<WindInput />
				</SidebarSection>

				<SidebarSection title="Race Course" tooltip={helpText.course}>
					<CourseMarksPanel />
				</SidebarSection>
			{/if}
		{:else}
			<SidebarSection title="Wind Scenario" tooltip={helpText.windSim}>
				<WindSelector />
			</SidebarSection>

			<SidebarSection title="Players" tooltip={helpText.players}>
				<PlayersPanel />
			</SidebarSection>
		{/if}
	</div>
</div>
