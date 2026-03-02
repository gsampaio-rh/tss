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
	import { computeFavouredTackData } from '$lib/domain/services/WindShiftAnalysisService';
	import type { TrackColorMode, FavouredTackData } from '$lib/types/session';

	import { speedToColor, shiftToColor, angleDiff, MS_TO_KNOTS } from '$lib/utils/mapColorUtils';
	import { createBoatIcon, createCourseMarkIcon, createTriangleIcon } from '$lib/utils/mapIcons';
	import WindCompass from './overlays/WindCompass.svelte';
	import MapViewControls from './overlays/MapViewControls.svelte';
	import MapActionControls from './overlays/MapActionControls.svelte';

	let mapContainer: HTMLDivElement;
	let L: typeof import('leaflet') | null = null;
	let map: import('leaflet').Map | null = null;
	let trackPolylines: import('leaflet').Polyline[] = [];
	let boatMarkers: import('leaflet').Marker[] = [];
	let courseMarkMarkers: Map<string, import('leaflet').Marker> = new Map();
	let startLinePolyline: import('leaflet').Polyline | null = null;
	let tackMarkers: import('leaflet').CircleMarker[] = [];
	let maxMarkers: import('leaflet').Marker[] = [];
	let showTackMarks = false;
	let showCourseMarksOnMap = true;
	let currentTileLayer: 'satellite' | 'street' = 'satellite';
	let ready = false;
	let detecting = false;

	export let trackColorMode: TrackColorMode = 'boat';
	export let showAnalysisDrawer = false;

	const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
	const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	const SATELLITE_ATTR = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
	const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

	let satelliteLayer: import('leaflet').TileLayer;
	let streetLayer: import('leaflet').TileLayer;

	// ── Computed data ──

	let speedRange = { min: 0, max: 10 };
	let favouredTackCache: Map<string, FavouredTackData> = new Map();

	function computeSpeedRange() {
		if (!$session) return;
		let min = Infinity, max = -Infinity;
		for (const track of $session.tracks) {
			for (const pt of track.points) {
				const kts = pt.speed * MS_TO_KNOTS;
				if (kts < min) min = kts;
				if (kts > max) max = kts;
			}
		}
		if (min === Infinity) { min = 0; max = 10; }
		speedRange = { min, max };
	}

	function computeFavouredTackCache() {
		if (!$session) return;
		favouredTackCache = new Map();
		for (const track of $session.tracks) {
			const data = computeFavouredTackData(track, $session.wind);
			favouredTackCache.set(track.name, data);
		}
	}

	// ── Map interactions ──

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

		map = L.map(mapContainer, { zoomControl: true, attributionControl: true });
		satelliteLayer = L.tileLayer(SATELLITE_URL, { attribution: SATELLITE_ATTR, maxZoom: 19 });
		streetLayer = L.tileLayer(OSM_URL, { attribution: OSM_ATTR, maxZoom: 19 });
		satelliteLayer.addTo(map);
		map.fitBounds(leafletBounds.pad(0.15));
		map.on('click', handleMapClick);

		computeSpeedRange();
		computeFavouredTackCache();
		renderTracks();
		addBoatMarkers();
		renderCourseMarks();
		ready = true;
	}

	// ── Track rendering ──

	function renderTracks() {
		if (!L || !map || !$session) return;
		trackPolylines.forEach((p) => p.remove());
		trackPolylines = [];
		clearMaxMarkers();

		if (trackColorMode === 'boat') {
			renderBoatColorTracks();
		} else if (trackColorMode === 'speed') {
			computeSpeedRange();
			renderSpeedColorTracks();
			renderMaxMarkers();
		} else if (trackColorMode === 'favouredTack') {
			computeFavouredTackCache();
			renderFavouredTackTracks();
		}
	}

	function renderBoatColorTracks() {
		if (!L || !map) return;
		for (const track of $replayTracks) {
			const latLngs = track.rawGps.map((p) => L!.latLng(p.lat, p.lon));
			const polyline = L.polyline(latLngs, {
				color: getBoatColorHex(track.color), weight: 3, opacity: 0.7,
				lineCap: 'round', lineJoin: 'round'
			}).addTo(map!);
			trackPolylines.push(polyline);
		}
	}

	function renderSpeedColorTracks() {
		if (!L || !map || !$session) return;
		const SEG = 5;
		for (const track of $session.tracks) {
			const gps = track.rawGps, pts = track.points;
			const len = Math.min(gps.length, pts.length);
			for (let i = 0; i < len - 1; i += SEG) {
				const end = Math.min(i + SEG, len - 1);
				const segLatLngs: import('leaflet').LatLng[] = [];
				let avgSpeed = 0, count = 0;
				for (let j = i; j <= end; j++) {
					segLatLngs.push(L!.latLng(gps[j].lat, gps[j].lon));
					avgSpeed += pts[j].speed * MS_TO_KNOTS;
					count++;
				}
				avgSpeed = count > 0 ? avgSpeed / count : 0;
				const polyline = L.polyline(segLatLngs, {
					color: speedToColor(avgSpeed, speedRange.min, speedRange.max),
					weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round'
				}).addTo(map!);
				trackPolylines.push(polyline);
			}
		}
	}

	function renderFavouredTackTracks() {
		if (!L || !map || !$session) return;
		const SEG = 5;
		for (const track of $session.tracks) {
			const gps = track.rawGps;
			const ftData = favouredTackCache.get(track.name);
			if (!ftData) continue;
			const len = Math.min(gps.length, ftData.shiftPoints.length);
			for (let i = 0; i < len - 1; i += SEG) {
				const end = Math.min(i + SEG, len - 1);
				const segLatLngs: import('leaflet').LatLng[] = [];
				let avgShift = 0, count = 0;
				for (let j = i; j <= end; j++) {
					segLatLngs.push(L!.latLng(gps[j].lat, gps[j].lon));
					if (j < ftData.shiftPoints.length) { avgShift += ftData.shiftPoints[j].shiftDeg; count++; }
				}
				avgShift = count > 0 ? avgShift / count : 0;
				const polyline = L.polyline(segLatLngs, {
					color: shiftToColor(avgShift),
					weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round'
				}).addTo(map!);
				trackPolylines.push(polyline);
			}
		}
	}

	// ── Max VMG / Max SOG markers ──

	function clearMaxMarkers() { maxMarkers.forEach((m) => m.remove()); maxMarkers = []; }

	function renderMaxMarkers() {
		if (!L || !map || !$session) return;
		clearMaxMarkers();
		for (const track of $session.tracks) {
			const gps = track.rawGps, pts = track.points;
			const len = Math.min(gps.length, pts.length);
			const hex = getBoatColorHex(track.color);
			let maxSogIdx = 0, maxSog = 0, maxVmgIdx = 0, maxVmg = -Infinity;
			const windDir = $session.wind.entries.length > 0 ? $session.wind.entries[0].direction : 0;

			for (let i = 0; i < len; i++) {
				const sogKts = pts[i].speed * MS_TO_KNOTS;
				if (sogKts > maxSog) { maxSog = sogKts; maxSogIdx = i; }
				const twa = Math.abs(angleDiff(pts[i].rotation, windDir));
				const vmg = sogKts * Math.cos((twa * Math.PI) / 180);
				if (vmg > maxVmg) { maxVmg = vmg; maxVmgIdx = i; }
			}

			const sogIcon = createTriangleIcon(L, hex, `${maxSog.toFixed(1)}`, false);
			const m1 = L.marker([gps[maxSogIdx].lat, gps[maxSogIdx].lon], { icon: sogIcon }).addTo(map!);
			m1.bindTooltip(`Max SOG: ${maxSog.toFixed(1)} kts`, { direction: 'top', offset: [0, -12] });
			maxMarkers.push(m1);

			const vmgIcon = createTriangleIcon(L, hex, `${maxVmg.toFixed(1)}`, true);
			const m2 = L.marker([gps[maxVmgIdx].lat, gps[maxVmgIdx].lon], { icon: vmgIcon }).addTo(map!);
			m2.bindTooltip(`Max VMG: ${maxVmg.toFixed(1)} kts`, { direction: 'top', offset: [0, -12] });
			maxMarkers.push(m2);
		}
	}

	// ── Boat markers ──

	function addBoatMarkers() {
		if (!L || !map || !$session) return;
		boatMarkers.forEach((m) => m.remove());
		boatMarkers = [];
		for (const track of $session.tracks) {
			const icon = createBoatIcon(L, track.color, 0);
			const firstPt = track.rawGps[0];
			const marker = L.marker([firstPt.lat, firstPt.lon], { icon }).addTo(map!);
			marker.bindTooltip(track.name, { permanent: false, direction: 'top', offset: [0, -22] });
			boatMarkers.push(marker);
		}
	}

	function updateBoatPositions(timeMs: number) {
		if (!L || !$session || boatMarkers.length === 0) return;
		$session.tracks.forEach((track, i) => {
			const pos = interpolateGpsPosition(track, timeMs);
			if (pos && boatMarkers[i]) {
				boatMarkers[i].setLatLng([pos.lat, pos.lon]);
				const icon = createBoatIcon(L!, track.color, pos.rotation);
				boatMarkers[i].setIcon(icon);
			}
		});
	}

	function updateProgressiveTracks(timeMs: number) {
		if (!L || !$session || trackPolylines.length === 0) return;
		if (trackColorMode === 'boat') {
			$session.tracks.forEach((track, i) => {
				if (!trackPolylines[i]) return;
				const visible = track.rawGps.filter((p) => p.time.getTime() <= timeMs);
				trackPolylines[i].setLatLngs(visible.map((p) => L!.latLng(p.lat, p.lon)));
			});
		}
	}

	// ── Course marks ──

	function renderCourseMarks() {
		if (!L || !map) return;
		courseMarkMarkers.forEach((m) => m.remove());
		courseMarkMarkers.clear();
		if (startLinePolyline) { startLinePolyline.remove(); startLinePolyline = null; }

		for (const mark of $courseMarks) {
			const icon = createCourseMarkIcon(L, mark);
			const marker = L.marker([mark.lat, mark.lon], { icon, draggable: true }).addTo(map!);
			marker.on('dragend', () => {
				const pos = marker.getLatLng();
				courseMarkActions.placeMark(mark.type, pos.lat, pos.lng);
			});
			marker.bindTooltip(mark.label, { permanent: false, direction: 'top', offset: [0, -16] });
			courseMarkMarkers.set(mark.id, marker);
		}

		const sl = $startLine;
		if (sl && L && map) {
			startLinePolyline = L.polyline(
				[[sl.port.lat, sl.port.lon], [sl.starboard.lat, sl.starboard.lon]],
				{ color: '#ffffff', weight: 3, opacity: 0.9, dashArray: '8, 6' }
			).addTo(map);
		}
	}

	// ── Tack markers ──

	function renderTackMarkers() {
		if (!L || !map || !$session) return;
		tackMarkers.forEach((m) => m.remove());
		tackMarkers = [];
		if (!showTackMarks) return;
		const windDir = $session.wind.entries.length > 0 ? $session.wind.entries[0].direction : undefined;

		for (const track of $session.tracks) {
			const maneuvers = detectManeuvers(track, windDir);
			const hex = getBoatColorHex(track.color);
			for (const m of maneuvers) {
				const gps = track.rawGps;
				let closest = gps[0], minDt = Math.abs(gps[0].time.getTime() - m.time);
				for (const p of gps) {
					const dt = Math.abs(p.time.getTime() - m.time);
					if (dt < minDt) { minDt = dt; closest = p; }
				}
				const marker = L.circleMarker([closest.lat, closest.lon], {
					radius: 5, color: '#ffffff', weight: 1.5, fillColor: hex, fillOpacity: 0.85
				}).addTo(map!);
				const speedLoss = ((m.speedBefore - m.speedMin) * 1.94384).toFixed(1);
				marker.bindTooltip(
					`<b>${m.type === 'tack' ? 'Tack' : 'Gybe'}</b><br/>` +
					`Angle: ${m.headingChange.toFixed(0)}\u00B0<br/>` +
					`Duration: ${m.duration.toFixed(1)}s<br/>` +
					`Speed loss: -${speedLoss} kts`,
					{ direction: 'top', offset: [0, -8] }
				);
				tackMarkers.push(marker);
			}
		}
	}

	// ── Control handlers (dispatched from child overlays) ──

	function handleToggleTile() {
		if (!map) return;
		if (currentTileLayer === 'satellite') {
			map.removeLayer(satelliteLayer); streetLayer.addTo(map); currentTileLayer = 'street';
		} else {
			map.removeLayer(streetLayer); satelliteLayer.addTo(map); currentTileLayer = 'satellite';
		}
	}

	function handleSetColorMode(e: CustomEvent<TrackColorMode>) {
		trackColorMode = e.detail;
		if (ready && map) renderTracks();
	}

	function handleToggleMarks() {
		showCourseMarksOnMap = !showCourseMarksOnMap;
		if (showCourseMarksOnMap) { renderCourseMarks(); }
		else {
			courseMarkMarkers.forEach((m) => m.remove()); courseMarkMarkers.clear();
			if (startLinePolyline) { startLinePolyline.remove(); startLinePolyline = null; }
		}
	}

	function handleToggleTacks() { showTackMarks = !showTackMarks; renderTackMarkers(); }

	function handleAutoDetect() {
		if (!$session) return;
		detecting = true;
		try {
			const windDir = $session.wind.entries.length > 0 ? $session.wind.entries[0].direction : undefined;
			const detected = autoDetectCourse($session.tracks, windDir);
			for (const mark of detected) courseMarkActions.placeMark(mark.type, mark.lat, mark.lon);
		} finally { detecting = false; }
	}

	function handleToggleAnalysis() { showAnalysisDrawer = !showAnalysisDrawer; }

	// ── Wind info ──
	$: currentWindDir = $session?.wind?.entries?.[0]?.direction ?? 0;
	$: currentWindSpeed = $session?.wind?.entries?.[0]?.speed ?? 0;

	// ── Reactive statements ──

	$: if (ready && map && $timeline.currentTime) {
		updateBoatPositions($timeline.currentTime);
		updateProgressiveTracks($timeline.currentTime);
	}

	$: if (ready && map && $replayTracks.length > 0) {
		renderTracks();
		addBoatMarkers();
		if (showTackMarks) renderTackMarkers();
	}

	$: if (ready && map && $courseMarks && $startLine !== undefined && showCourseMarksOnMap) {
		renderCourseMarks();
	}

	$: if (map && mapContainer) {
		mapContainer.style.cursor = $placementMode ? 'crosshair' : '';
	}

	onMount(async () => {
		const leaflet = await import('leaflet');
		L = leaflet.default ?? leaflet;
		const cssId = 'leaflet-css';
		if (!document.getElementById(cssId)) {
			const link = document.createElement('link');
			link.id = cssId; link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);
		}
		initMap();
	});

	onDestroy(() => { if (map) { map.remove(); map = null; } });
</script>

<div class="map-replay-wrapper">
	<div bind:this={mapContainer} class="map-container"></div>

	<div class="overlay-tr">
		{#if $session}
			<WindCompass direction={currentWindDir} speed={currentWindSpeed} />
		{/if}
	</div>

	<div class="overlay-bl">
		<MapViewControls
			{trackColorMode}
			showCourseMarks={showCourseMarksOnMap}
			{showTackMarks}
			{currentTileLayer}
			on:toggleTile={handleToggleTile}
			on:setColorMode={handleSetColorMode}
			on:toggleMarks={handleToggleMarks}
			on:toggleTacks={handleToggleTacks}
		/>
	</div>

	<div class="overlay-br">
		<MapActionControls
			{detecting}
			disabled={!$session}
			showAnalysis={showAnalysisDrawer}
			on:autoDetect={handleAutoDetect}
			on:toggleAnalysis={handleToggleAnalysis}
		/>
	</div>
</div>

<style>
	.map-replay-wrapper {
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
		width: 100%; height: 100%;
	}

	.map-container {
		width: 100%; height: 100%;
		z-index: 1;
	}

	.overlay-tr {
		position: absolute;
		top: 12px; right: 12px;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
	}

	.overlay-bl {
		position: absolute;
		bottom: 62px; left: 12px;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.overlay-br {
		position: absolute;
		bottom: 62px; right: 12px;
		z-index: 1000;
	}

	:global(.boat-map-marker) { background: none !important; border: none !important; }
	:global(.course-mark-icon) { background: none !important; border: none !important; }
	:global(.course-mark-wrapper) { display: flex; flex-direction: column; align-items: center; gap: 2px; }
	:global(.course-mark-label) { font-size: 10px; font-weight: 600; text-shadow: 0 0 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.7); white-space: nowrap; }
	:global(.max-marker-icon) { background: none !important; border: none !important; }
	:global(.max-marker-wrapper) { display: flex; flex-direction: column; align-items: center; gap: 1px; }
	:global(.max-marker-label) { font-size: 9px; font-weight: 700; text-shadow: 0 0 3px rgba(255,255,255,0.9); white-space: nowrap; }
</style>
