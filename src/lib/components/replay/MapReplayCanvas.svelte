<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { session, replayTracks } from '$lib/stores/session';
	import { timeline } from '$lib/stores/timeline';
	import { interpolateGpsPosition } from '$lib/domain/services/TrackInterpolator';
	import { getBoatColorHex } from '$lib/types/game';
	import { get } from 'svelte/store';
	import { placementMode, courseMarks, courseMarkActions, startLine } from '$lib/stores/courseMarks';
	import { detectManeuvers } from '$lib/domain/services/ManeuverDetectionService';
	import { autoDetectCourse } from '$lib/domain/services/CourseDetectionService';
	import type { CourseMark, Maneuver } from '$lib/types/session';

	let mapContainer: HTMLDivElement;
	let L: typeof import('leaflet') | null = null;
	let map: import('leaflet').Map | null = null;
	let trackPolylines: import('leaflet').Polyline[] = [];
	let boatMarkers: import('leaflet').Marker[] = [];
	let courseMarkMarkers: Map<string, import('leaflet').Marker> = new Map();
	let startLinePolyline: import('leaflet').Polyline | null = null;
	let tackMarkers: import('leaflet').CircleMarker[] = [];
	let showTackMarks = false;
	let currentTileLayer: 'satellite' | 'street' = 'satellite';
	let ready = false;
	let detecting = false;

	const SATELLITE_URL =
		'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
	const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	const SATELLITE_ATTR =
		'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
	const OSM_ATTR =
		'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

	let satelliteLayer: import('leaflet').TileLayer;
	let streetLayer: import('leaflet').TileLayer;

	function createBoatIcon(color: string, rotation: number) {
		if (!L) return null;
		const hex = getBoatColorHex(color);
		return L.divIcon({
			className: 'boat-map-marker',
			html: `<div style="transform: rotate(${rotation}deg); transform-origin: center;">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -10 14 20" width="28" height="40">
					<path d="M -4 7.5 L 4 7.5 C 5 1.5 5 -2.5 2.5 -9 L -2.5 -9 C -5 -2.5 -5 1.5 -4 7.5 Z"
						stroke="#fff" stroke-width=".5" fill="${hex}" />
					<path d="M 0 -6 C 2 -4 3 -1 2 6" stroke="white" fill="none" stroke-width="1" />
					<ellipse rx="0.7" ry="0.7" cx="0" cy="-6" fill="#fff" />
				</svg>
			</div>`,
			iconSize: [28, 40],
			iconAnchor: [14, 20]
		});
	}

	function createCourseMarkIcon(mark: CourseMark) {
		if (!L) return null;

		const colors: Record<string, string> = {
			'start-port': '#dc3545',
			'start-starboard': '#28a745',
			'windward': '#ff8c00',
			'leeward': '#007bff',
			'gate-port': '#dc3545',
			'gate-starboard': '#28a745'
		};

		const shapes: Record<string, string> = {
			'start-port': '<circle cx="12" cy="12" r="8" fill="COLOR" stroke="#fff" stroke-width="2"/>',
			'start-starboard': '<circle cx="12" cy="12" r="8" fill="COLOR" stroke="#fff" stroke-width="2"/>',
			'windward': '<polygon points="12,4 4,20 20,20" fill="COLOR" stroke="#fff" stroke-width="2"/>',
			'leeward': '<polygon points="12,20 4,4 20,4" fill="COLOR" stroke="#fff" stroke-width="2"/>',
			'gate-port': '<rect x="4" y="4" width="16" height="16" fill="COLOR" stroke="#fff" stroke-width="2"/>',
			'gate-starboard': '<rect x="4" y="4" width="16" height="16" fill="COLOR" stroke="#fff" stroke-width="2"/>'
		};

		const color = colors[mark.type] || '#666';
		const shape = (shapes[mark.type] || shapes['windward']).replace('COLOR', color);

		return L.divIcon({
			className: 'course-mark-icon',
			html: `<div class="course-mark-wrapper">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
					${shape}
				</svg>
				<span class="course-mark-label" style="color: ${color}">${mark.label}</span>
			</div>`,
			iconSize: [28, 28],
			iconAnchor: [14, 14]
		});
	}

	function handleMapClick(e: import('leaflet').LeafletMouseEvent) {
		const mode = get(placementMode);
		if (!mode) return;

		courseMarkActions.placeMark(mode, e.latlng.lat, e.latlng.lng);
		courseMarkActions.setPlacementMode(null);
	}

	function initMap() {
		if (!L || !mapContainer || !$session) return;

		const { bounds } = $session;
		const sw = L.latLng(bounds.minLat, bounds.minLon);
		const ne = L.latLng(bounds.maxLat, bounds.maxLon);
		const leafletBounds = L.latLngBounds(sw, ne);

		map = L.map(mapContainer, {
			zoomControl: true,
			attributionControl: true
		});

		satelliteLayer = L.tileLayer(SATELLITE_URL, {
			attribution: SATELLITE_ATTR,
			maxZoom: 19
		});

		streetLayer = L.tileLayer(OSM_URL, {
			attribution: OSM_ATTR,
			maxZoom: 19
		});

		satelliteLayer.addTo(map);
		map.fitBounds(leafletBounds.pad(0.15));

		map.on('click', handleMapClick);

		addTrackPolylines();
		addBoatMarkers();
		renderCourseMarks();
		ready = true;
	}

	function addTrackPolylines() {
		if (!L || !map) return;
		trackPolylines.forEach((p) => p.remove());
		trackPolylines = [];

		for (const track of $replayTracks) {
			const latLngs = track.rawGps.map((p) => L!.latLng(p.lat, p.lon));
			const polyline = L.polyline(latLngs, {
				color: getBoatColorHex(track.color),
				weight: 3,
				opacity: 0.7,
				lineCap: 'round',
				lineJoin: 'round'
			}).addTo(map!);
			trackPolylines.push(polyline);
		}
	}

	function addBoatMarkers() {
		if (!L || !map || !$session) return;
		boatMarkers.forEach((m) => m.remove());
		boatMarkers = [];

		for (const track of $session.tracks) {
			const icon = createBoatIcon(track.color, 0);
			if (!icon) continue;
			const firstPt = track.rawGps[0];
			const marker = L.marker([firstPt.lat, firstPt.lon], { icon }).addTo(map!);
			marker.bindTooltip(track.name, {
				permanent: false,
				direction: 'top',
				offset: [0, -22]
			});
			boatMarkers.push(marker);
		}
	}

	function updateBoatPositions(timeMs: number) {
		if (!L || !$session || boatMarkers.length === 0) return;

		$session.tracks.forEach((track, i) => {
			const pos = interpolateGpsPosition(track, timeMs);
			if (pos && boatMarkers[i]) {
				boatMarkers[i].setLatLng([pos.lat, pos.lon]);
				const icon = createBoatIcon(track.color, pos.rotation);
				if (icon) boatMarkers[i].setIcon(icon);
			}
		});
	}

	function updateProgressiveTracks(timeMs: number) {
		if (!L || !$session || trackPolylines.length === 0) return;

		$session.tracks.forEach((track, i) => {
			if (!trackPolylines[i]) return;
			const visible = track.rawGps.filter((p) => p.time.getTime() <= timeMs);
			const latLngs = visible.map((p) => L!.latLng(p.lat, p.lon));
			trackPolylines[i].setLatLngs(latLngs);
		});
	}

	function renderCourseMarks() {
		if (!L || !map) return;

		// Clear existing markers
		courseMarkMarkers.forEach((m) => m.remove());
		courseMarkMarkers.clear();
		if (startLinePolyline) {
			startLinePolyline.remove();
			startLinePolyline = null;
		}

		for (const mark of $courseMarks) {
			const icon = createCourseMarkIcon(mark);
			if (!icon) continue;

			const marker = L.marker([mark.lat, mark.lon], {
				icon,
				draggable: true
			}).addTo(map!);

			marker.on('dragend', () => {
				const pos = marker.getLatLng();
				courseMarkActions.placeMark(mark.type, pos.lat, pos.lng);
			});

			marker.bindTooltip(mark.label, {
				permanent: false,
				direction: 'top',
				offset: [0, -16]
			});

			courseMarkMarkers.set(mark.id, marker);
		}

		// Draw start line if both ends are placed
		const sl = $startLine;
		if (sl && L && map) {
			startLinePolyline = L.polyline(
				[
					[sl.port.lat, sl.port.lon],
					[sl.starboard.lat, sl.starboard.lon]
				],
				{
					color: '#ffffff',
					weight: 3,
					opacity: 0.9,
					dashArray: '8, 6'
				}
			).addTo(map);
		}
	}

	function renderTackMarkers() {
		if (!L || !map || !$session) return;

		// Clear existing
		tackMarkers.forEach((m) => m.remove());
		tackMarkers = [];

		if (!showTackMarks) return;

		const windDir = $session.wind.entries.length > 0
			? $session.wind.entries[0].direction
			: undefined;

		for (const track of $session.tracks) {
			const maneuvers = detectManeuvers(track, windDir);
			const hex = getBoatColorHex(track.color);

			for (const m of maneuvers) {
				// Find the GPS position nearest to the maneuver time
				const gps = track.rawGps;
				let closest = gps[0];
				let minDt = Math.abs(gps[0].time.getTime() - m.time);
				for (const p of gps) {
					const dt = Math.abs(p.time.getTime() - m.time);
					if (dt < minDt) {
						minDt = dt;
						closest = p;
					}
				}

				const isTack = m.type === 'tack';
				const marker = L.circleMarker([closest.lat, closest.lon], {
					radius: 5,
					color: isTack ? '#ffffff' : '#ffffff',
					weight: 1.5,
					fillColor: hex,
					fillOpacity: 0.85
				}).addTo(map!);

				const speedLoss = ((m.speedBefore - m.speedMin) * 1.94384).toFixed(1);
				marker.bindTooltip(
					`<b>${m.type === 'tack' ? 'Tack' : 'Gybe'}</b><br/>` +
					`Angle: ${m.headingChange.toFixed(0)}°<br/>` +
					`Duration: ${m.duration.toFixed(1)}s<br/>` +
					`Speed loss: -${speedLoss} kts`,
					{ direction: 'top', offset: [0, -8] }
				);

				tackMarkers.push(marker);
			}
		}
	}

	function toggleTackMarks() {
		showTackMarks = !showTackMarks;
		renderTackMarkers();
	}

	function handleAutoDetect() {
		if (!$session) return;
		detecting = true;

		try {
			const windDir = $session.wind.entries.length > 0
				? $session.wind.entries[0].direction
				: undefined;
			const detected = autoDetectCourse($session.tracks, windDir);

			for (const mark of detected) {
				courseMarkActions.placeMark(mark.type, mark.lat, mark.lon);
			}
		} finally {
			detecting = false;
		}
	}

	function toggleTileLayer() {
		if (!map) return;
		if (currentTileLayer === 'satellite') {
			map.removeLayer(satelliteLayer);
			streetLayer.addTo(map);
			currentTileLayer = 'street';
		} else {
			map.removeLayer(streetLayer);
			satelliteLayer.addTo(map);
			currentTileLayer = 'satellite';
		}
	}

	$: if (ready && map && $timeline.currentTime) {
		updateBoatPositions($timeline.currentTime);
		updateProgressiveTracks($timeline.currentTime);
	}

	$: if (ready && map && $replayTracks.length > 0) {
		addTrackPolylines();
		addBoatMarkers();
		if (showTackMarks) renderTackMarkers();
	}

	$: if (ready && map && $courseMarks && $startLine !== undefined) {
		renderCourseMarks();
	}

	$: if (map && mapContainer) {
		mapContainer.style.cursor = $placementMode ? 'crosshair' : '';
	}

	// Subscribe to courseMarks to force re-render of course mark layer
	$: currentCourseMarks = $courseMarks;

	onMount(async () => {
		const leaflet = await import('leaflet');
		L = leaflet.default ?? leaflet;

		// Import CSS by adding a link tag (avoids SSR import issues)
		const cssId = 'leaflet-css';
		if (!document.getElementById(cssId)) {
			const link = document.createElement('link');
			link.id = cssId;
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);
		}

		initMap();
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
	});
</script>

<div class="map-replay-wrapper">
	<div bind:this={mapContainer} class="map-container"></div>

	<!-- Map toolbar -->
	<div class="map-toolbar">
		<!-- Layer toggle -->
		<button
			class="toolbar-btn"
			on:click={toggleTileLayer}
			title="Switch between satellite and street map"
		>
			{#if currentTileLayer === 'satellite'}
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
					<path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM2.04 4.326c.325 1.329 2.532 2.54 3.717 3.19.48.263.793.434.743.484-.08.08-.162.158-.242.234-.416.396-.787.749-.758 1.266.035.634.618.824 1.214 1.017.577.188 1.168.38 1.286.983.082.417-.075.988-.22 1.52-.215.782-.406 1.48.22 1.48 1.5-.5 3.798-3.186 4-5 .138-1.243-2-2-3.5-2.5-.478-.16-.755.081-.99.284-.172.15-.322.279-.51.216-.445-.148-2.5-2-1.5-2.5.78-.39.952-.171 1.227.182.078.099.163.208.273.318.609.304.662-.132.723-.633.039-.322.081-.671.277-.867.434-.434 1.265-.791 2.028-1.12.712-.306 1.365-.587 1.579-.88A7 7 0 1 1 2.04 4.327Z"/>
				</svg>
				<span>Street</span>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
					<path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022Z"/>
				</svg>
				<span>Satellite</span>
			{/if}
		</button>

		<div class="toolbar-separator"></div>

		<!-- Tack marks toggle -->
		<button
			class="toolbar-btn"
			class:active={showTackMarks}
			on:click={toggleTackMarks}
			title="Show/hide tack and gybe markers on track"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
				<path d="M8 0a1 1 0 0 1 1 1v5.268l4.562-2.634a1 1 0 1 1 1 1.732L10 8l4.562 2.634a1 1 0 1 1-1 1.732L9 9.732V15a1 1 0 1 1-2 0V9.732l-4.562 2.634a1 1 0 1 1-1-1.732L6 8 1.438 5.366a1 1 0 0 1 1-1.732L7 6.268V1a1 1 0 0 1 1-1z"/>
			</svg>
			<span>Tacks</span>
		</button>

		<div class="toolbar-separator"></div>

		<!-- Auto-detect course -->
		<button
			class="toolbar-btn toolbar-btn-accent"
			on:click={handleAutoDetect}
			disabled={detecting || !$session}
			title="Auto-detect start line, windward mark, and leeward mark"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
				<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.399l-.502.032.084-.418 2.338-.528zm-.415-3.078a.887.887 0 1 1 0 1.774.887.887 0 0 1 0-1.774z"/>
			</svg>
			<span>{detecting ? 'Detecting...' : 'Auto-Detect'}</span>
		</button>
	</div>
</div>

<style>
	.map-replay-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
	}

	.map-container {
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.map-toolbar {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: 0;
		padding: 3px;
		border: 1px solid var(--color-border-medium);
		border-radius: var(--radius-lg);
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(8px);
		box-shadow: var(--shadow-md);
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 5px 10px;
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-text-primary);
		font-size: 11px;
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.toolbar-btn:hover {
		background: var(--color-bg-tertiary);
	}

	.toolbar-btn.active {
		background: var(--color-primary);
		color: #fff;
	}

	.toolbar-btn.active:hover {
		background: var(--color-primary-hover);
	}

	.toolbar-btn-accent {
		color: var(--color-primary);
	}

	.toolbar-btn-accent:hover {
		background: rgba(0, 123, 255, 0.1);
	}

	.toolbar-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.toolbar-separator {
		width: 1px;
		height: 20px;
		background: var(--color-border-light);
		margin: 0 2px;
	}

	:global(.boat-map-marker) {
		background: none !important;
		border: none !important;
	}

	:global(.course-mark-icon) {
		background: none !important;
		border: none !important;
	}

	:global(.course-mark-wrapper) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	:global(.course-mark-label) {
		font-size: 10px;
		font-weight: 600;
		text-shadow: 0 0 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.7);
		white-space: nowrap;
	}
</style>
