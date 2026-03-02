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
	import type { CourseMark, Maneuver, TrackColorMode, FavouredTackData } from '$lib/types/session';

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
	let currentTileLayer: 'satellite' | 'street' = 'satellite';
	let ready = false;
	let detecting = false;

	export let trackColorMode: TrackColorMode = 'boat';
	export let showAnalysisDrawer = false;

	const SATELLITE_URL =
		'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
	const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	const SATELLITE_ATTR =
		'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
	const OSM_ATTR =
		'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

	let satelliteLayer: import('leaflet').TileLayer;
	let streetLayer: import('leaflet').TileLayer;

	// ── Speed gradient helpers ──

	const SPEED_COLORS = [
		{ stop: 0, color: [200, 220, 255] },
		{ stop: 0.25, color: [100, 180, 255] },
		{ stop: 0.5, color: [255, 255, 100] },
		{ stop: 0.75, color: [255, 160, 0] },
		{ stop: 1, color: [255, 30, 30] }
	];

	function speedToColor(speed: number, minSpeed: number, maxSpeed: number): string {
		const range = maxSpeed - minSpeed;
		if (range <= 0) return 'rgb(200,220,255)';
		const t = Math.max(0, Math.min(1, (speed - minSpeed) / range));

		for (let i = 0; i < SPEED_COLORS.length - 1; i++) {
			if (t >= SPEED_COLORS[i].stop && t <= SPEED_COLORS[i + 1].stop) {
				const segT =
					(t - SPEED_COLORS[i].stop) /
					(SPEED_COLORS[i + 1].stop - SPEED_COLORS[i].stop);
				const c1 = SPEED_COLORS[i].color;
				const c2 = SPEED_COLORS[i + 1].color;
				const r = Math.round(c1[0] + (c2[0] - c1[0]) * segT);
				const g = Math.round(c1[1] + (c2[1] - c1[1]) * segT);
				const b = Math.round(c1[2] + (c2[2] - c1[2]) * segT);
				return `rgb(${r},${g},${b})`;
			}
		}
		return 'rgb(255,30,30)';
	}

	// ── Favoured tack gradient helpers ──

	function shiftToColor(shiftDeg: number): string {
		const maxShift = 15;
		const clamped = Math.max(-maxShift, Math.min(maxShift, shiftDeg));
		const t = clamped / maxShift; // -1 to 1
		if (t < 0) {
			// Left shift: gray to red
			const s = Math.abs(t);
			const r = Math.round(180 + 75 * s);
			const g = Math.round(180 - 130 * s);
			const b = Math.round(180 - 140 * s);
			return `rgb(${r},${g},${b})`;
		} else {
			// Right shift: gray to green
			const s = t;
			const r = Math.round(180 - 150 * s);
			const g = Math.round(180 + 60 * s);
			const b = Math.round(180 - 150 * s);
			return `rgb(${r},${g},${b})`;
		}
	}

	// ── Speed range for all tracks ──

	let speedRange = { min: 0, max: 10 };
	const MS_TO_KNOTS = 1.94384;

	function computeSpeedRange() {
		if (!$session) return;
		let min = Infinity;
		let max = -Infinity;
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

	// ── Favoured tack data cache ──
	let favouredTackCache: Map<string, FavouredTackData> = new Map();

	function computeFavouredTackCache() {
		if (!$session) return;
		favouredTackCache = new Map();
		for (const track of $session.tracks) {
			const data = computeFavouredTackData(track, $session.wind);
			favouredTackCache.set(track.name, data);
		}
	}

	// ── Icons ──

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
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">${shape}</svg>
				<span class="course-mark-label" style="color: ${color}">${mark.label}</span>
			</div>`,
			iconSize: [28, 28],
			iconAnchor: [14, 14]
		});
	}

	function createTriangleIcon(color: string, label: string, filled: boolean) {
		if (!L) return null;
		const fill = filled ? color : 'none';
		const stroke = filled ? '#fff' : color;
		return L.divIcon({
			className: 'max-marker-icon',
			html: `<div class="max-marker-wrapper">
				<svg viewBox="0 0 20 20" width="18" height="18">
					<polygon points="10,2 2,18 18,18" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
				</svg>
				<span class="max-marker-label" style="color:${color}">${label}</span>
			</div>`,
			iconSize: [18, 18],
			iconAnchor: [9, 18]
		});
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

		map = L.map(mapContainer, {
			zoomControl: true,
			attributionControl: true
		});

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

	// ── Track rendering (supports all color modes) ──

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
				color: getBoatColorHex(track.color),
				weight: 3,
				opacity: 0.7,
				lineCap: 'round',
				lineJoin: 'round'
			}).addTo(map!);
			trackPolylines.push(polyline);
		}
	}

	function renderSpeedColorTracks() {
		if (!L || !map || !$session) return;
		const SEGMENT_SIZE = 5;

		for (const track of $session.tracks) {
			const gps = track.rawGps;
			const pts = track.points;
			const len = Math.min(gps.length, pts.length);

			for (let i = 0; i < len - 1; i += SEGMENT_SIZE) {
				const end = Math.min(i + SEGMENT_SIZE, len - 1);
				const segLatLngs: import('leaflet').LatLng[] = [];
				let avgSpeed = 0;
				let count = 0;
				for (let j = i; j <= end; j++) {
					segLatLngs.push(L!.latLng(gps[j].lat, gps[j].lon));
					avgSpeed += pts[j].speed * MS_TO_KNOTS;
					count++;
				}
				avgSpeed = count > 0 ? avgSpeed / count : 0;
				const color = speedToColor(avgSpeed, speedRange.min, speedRange.max);

				const polyline = L.polyline(segLatLngs, {
					color,
					weight: 4,
					opacity: 0.85,
					lineCap: 'round',
					lineJoin: 'round'
				}).addTo(map!);
				trackPolylines.push(polyline);
			}
		}
	}

	function renderFavouredTackTracks() {
		if (!L || !map || !$session) return;
		const SEGMENT_SIZE = 5;

		for (const track of $session.tracks) {
			const gps = track.rawGps;
			const ftData = favouredTackCache.get(track.name);
			if (!ftData) continue;

			const len = Math.min(gps.length, ftData.shiftPoints.length);
			for (let i = 0; i < len - 1; i += SEGMENT_SIZE) {
				const end = Math.min(i + SEGMENT_SIZE, len - 1);
				const segLatLngs: import('leaflet').LatLng[] = [];
				let avgShift = 0;
				let count = 0;
				for (let j = i; j <= end; j++) {
					segLatLngs.push(L!.latLng(gps[j].lat, gps[j].lon));
					if (j < ftData.shiftPoints.length) {
						avgShift += ftData.shiftPoints[j].shiftDeg;
						count++;
					}
				}
				avgShift = count > 0 ? avgShift / count : 0;
				const color = shiftToColor(avgShift);

				const polyline = L.polyline(segLatLngs, {
					color,
					weight: 4,
					opacity: 0.85,
					lineCap: 'round',
					lineJoin: 'round'
				}).addTo(map!);
				trackPolylines.push(polyline);
			}
		}
	}

	// ── Max VMG / Max SOG markers ──

	function clearMaxMarkers() {
		maxMarkers.forEach((m) => m.remove());
		maxMarkers = [];
	}

	function renderMaxMarkers() {
		if (!L || !map || !$session) return;
		clearMaxMarkers();

		for (const track of $session.tracks) {
			const gps = track.rawGps;
			const pts = track.points;
			const len = Math.min(gps.length, pts.length);
			const hex = getBoatColorHex(track.color);

			let maxSogIdx = 0;
			let maxSog = 0;
			let maxVmgIdx = 0;
			let maxVmg = -Infinity;

			const windDir = $session.wind.entries.length > 0
				? $session.wind.entries[0].direction
				: 0;

			for (let i = 0; i < len; i++) {
				const sogKts = pts[i].speed * MS_TO_KNOTS;
				if (sogKts > maxSog) {
					maxSog = sogKts;
					maxSogIdx = i;
				}
				const twa = Math.abs(angleDiffLocal(pts[i].rotation, windDir));
				const vmg = sogKts * Math.cos((twa * Math.PI) / 180);
				if (vmg > maxVmg) {
					maxVmg = vmg;
					maxVmgIdx = i;
				}
			}

			const sogIcon = createTriangleIcon(hex, `${maxSog.toFixed(1)}`, false);
			if (sogIcon) {
				const m = L.marker([gps[maxSogIdx].lat, gps[maxSogIdx].lon], { icon: sogIcon }).addTo(map!);
				m.bindTooltip(`Max SOG: ${maxSog.toFixed(1)} kts`, { direction: 'top', offset: [0, -12] });
				maxMarkers.push(m);
			}

			const vmgIcon = createTriangleIcon(hex, `${maxVmg.toFixed(1)}`, true);
			if (vmgIcon) {
				const m = L.marker([gps[maxVmgIdx].lat, gps[maxVmgIdx].lon], { icon: vmgIcon }).addTo(map!);
				m.bindTooltip(`Max VMG: ${maxVmg.toFixed(1)} kts`, { direction: 'top', offset: [0, -12] });
				maxMarkers.push(m);
			}
		}
	}

	function angleDiffLocal(a: number, b: number): number {
		let d = b - a;
		if (d > 180) d -= 360;
		if (d < -180) d += 360;
		return d;
	}

	// ── Boat markers ──

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

		if (trackColorMode === 'boat') {
			$session.tracks.forEach((track, i) => {
				if (!trackPolylines[i]) return;
				const visible = track.rawGps.filter((p) => p.time.getTime() <= timeMs);
				const latLngs = visible.map((p) => L!.latLng(p.lat, p.lon));
				trackPolylines[i].setLatLngs(latLngs);
			});
		}
		// For speed/favoured tack modes, progressive rendering is complex;
		// we show the full track coloring for the whole session.
	}

	// ── Course marks ──

	function renderCourseMarks() {
		if (!L || !map) return;
		courseMarkMarkers.forEach((m) => m.remove());
		courseMarkMarkers.clear();
		if (startLinePolyline) {
			startLinePolyline.remove();
			startLinePolyline = null;
		}

		for (const mark of $courseMarks) {
			const icon = createCourseMarkIcon(mark);
			if (!icon) continue;
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
				let closest = gps[0];
				let minDt = Math.abs(gps[0].time.getTime() - m.time);
				for (const p of gps) {
					const dt = Math.abs(p.time.getTime() - m.time);
					if (dt < minDt) { minDt = dt; closest = p; }
				}

				const marker = L.circleMarker([closest.lat, closest.lon], {
					radius: 5, color: '#ffffff', weight: 1.5,
					fillColor: hex, fillOpacity: 0.85
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

	function toggleTackMarks() {
		showTackMarks = !showTackMarks;
		renderTackMarkers();
	}

	function handleAutoDetect() {
		if (!$session) return;
		detecting = true;
		try {
			const windDir = $session.wind.entries.length > 0 ? $session.wind.entries[0].direction : undefined;
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

	function setColorMode(mode: TrackColorMode) {
		trackColorMode = mode;
		if (ready && map) {
			renderTracks();
		}
	}

	function toggleAnalysisDrawer() {
		showAnalysisDrawer = !showAnalysisDrawer;
	}

	// ── Wind info ──
	$: currentWindDir = $session?.wind?.entries?.[0]?.direction ?? 0;
	$: currentWindSpeed = $session?.wind?.entries?.[0]?.speed ?? 0;

	// ── Favoured tack data for selected track (first track for overlay) ──
	$: activeFavouredTack = $session && $session.tracks.length > 0
		? favouredTackCache.get($session.tracks[0].name) ?? null
		: null;

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

	$: if (ready && map && $courseMarks && $startLine !== undefined) {
		renderCourseMarks();
	}

	$: if (map && mapContainer) {
		mapContainer.style.cursor = $placementMode ? 'crosshair' : '';
	}

	$: currentCourseMarks = $courseMarks;

	onMount(async () => {
		const leaflet = await import('leaflet');
		L = leaflet.default ?? leaflet;

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
		if (map) { map.remove(); map = null; }
	});
</script>

<div class="map-replay-wrapper">
	<div bind:this={mapContainer} class="map-container"></div>

	<!-- Map toolbar -->
	<div class="map-toolbar">
		<!-- Layer toggle -->
		<button class="toolbar-btn" on:click={toggleTileLayer} title="Switch map tiles">
			{#if currentTileLayer === 'satellite'}
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
					<path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM2.04 4.326c.325 1.329 2.532 2.54 3.717 3.19.48.263.793.434.743.484-.08.08-.162.158-.242.234-.416.396-.787.749-.758 1.266.035.634.618.824 1.214 1.017.577.188 1.168.38 1.286.983.082.417-.075.988-.22 1.52-.215.782-.406 1.48.22 1.48 1.5-.5 3.798-3.186 4-5 .138-1.243-2-2-3.5-2.5-.478-.16-.755.081-.99.284-.172.15-.322.279-.51.216-.445-.148-2.5-2-1.5-2.5.78-.39.952-.171 1.227.182.078.099.163.208.273.318.609.304.662-.132.723-.633.039-.322.081-.671.277-.867.434-.434 1.265-.791 2.028-1.12.712-.306 1.365-.587 1.579-.88A7 7 0 1 1 2.04 4.327Z"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
					<path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022Z"/>
				</svg>
			{/if}
		</button>

		<div class="toolbar-separator"></div>

		<!-- Color mode selector -->
		<div class="color-mode-group">
			<button
				class="toolbar-btn"
				class:active={trackColorMode === 'boat'}
				on:click={() => setColorMode('boat')}
				title="Color tracks by boat"
			>Boat</button>
			<button
				class="toolbar-btn"
				class:active={trackColorMode === 'speed'}
				on:click={() => setColorMode('speed')}
				title="Color tracks by speed (SOG)"
			>Speed</button>
			<button
				class="toolbar-btn"
				class:active={trackColorMode === 'favouredTack'}
				on:click={() => setColorMode('favouredTack')}
				title="Color tracks by wind shift (favoured tack)"
			>Shift</button>
		</div>

		<div class="toolbar-separator"></div>

		<!-- Tack marks toggle -->
		<button class="toolbar-btn" class:active={showTackMarks} on:click={toggleTackMarks} title="Show/hide tack and gybe markers">
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
				<path d="M8 0a1 1 0 0 1 1 1v5.268l4.562-2.634a1 1 0 1 1 1 1.732L10 8l4.562 2.634a1 1 0 1 1-1 1.732L9 9.732V15a1 1 0 1 1-2 0V9.732l-4.562 2.634a1 1 0 1 1-1-1.732L6 8 1.438 5.366a1 1 0 0 1 1-1.732L7 6.268V1a1 1 0 0 1 1-1z"/>
			</svg>
			<span>Tacks</span>
		</button>

		<div class="toolbar-separator"></div>

		<!-- Auto-detect course -->
		<button class="toolbar-btn toolbar-btn-accent" on:click={handleAutoDetect} disabled={detecting || !$session} title="Auto-detect course marks">
			<span>{detecting ? 'Detecting...' : 'Auto-Detect'}</span>
		</button>

		<div class="toolbar-separator"></div>

		<!-- Analysis drawer toggle -->
		<button class="toolbar-btn" class:active={showAnalysisDrawer} on:click={toggleAnalysisDrawer} title="Toggle analysis charts">
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
				<path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5h-2v12h2V2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z"/>
			</svg>
			<span>Analysis</span>
		</button>
	</div>

	<!-- TWS/TWD wind badge -->
	{#if $session && currentWindSpeed > 0}
		<div class="wind-badge">
			<div class="wind-badge-row">
				<span class="wind-badge-label">TWS</span>
				<span class="wind-badge-value">{currentWindSpeed.toFixed(1)}kts</span>
			</div>
			<div class="wind-badge-row">
				<span class="wind-badge-label">TWD</span>
				<span class="wind-badge-value">{currentWindDir.toFixed(0)}&deg;</span>
			</div>
		</div>
	{/if}

	<!-- Speed scale legend (shown in speed mode) -->
	{#if trackColorMode === 'speed'}
		<div class="speed-legend">
			<div class="speed-legend-title">SOG [kts]</div>
			<div class="speed-legend-bar">
				<span class="speed-legend-label">{speedRange.max.toFixed(1)}</span>
				<div class="speed-gradient-bar"></div>
				<span class="speed-legend-label">{speedRange.min.toFixed(1)}</span>
			</div>
		</div>
	{/if}

	<!-- Favoured tack overlay (shown in favouredTack mode) -->
	{#if trackColorMode === 'favouredTack' && activeFavouredTack}
		<div class="favtack-overlay">
			<div class="favtack-title">Mean TWA: {activeFavouredTack.meanTWA.toFixed(0)}&deg;</div>

			<!-- Wind direction arrow -->
			<div class="favtack-wind-arrow" style="transform: rotate({currentWindDir}deg)">
				<svg viewBox="0 0 24 24" width="32" height="32">
					<path d="M12 2 L8 12 L12 10 L16 12 Z" fill="rgba(100,200,255,0.6)" stroke="#fff" stroke-width="1"/>
				</svg>
			</div>

			<!-- Donut: Right Side vs Left Side -->
			<div class="favtack-donut-label">Right / Left Side</div>
			<svg viewBox="0 0 80 80" width="72" height="72" class="favtack-donut">
				<circle cx="40" cy="40" r="30" fill="none" stroke="#dc3545" stroke-width="10" />
				<circle cx="40" cy="40" r="30" fill="none" stroke="#28a745" stroke-width="10"
					stroke-dasharray="{(activeFavouredTack.rightSidePercent / 100) * 188.5} {188.5}"
					stroke-dashoffset="47.1" />
				<circle cx="40" cy="40" r="20" fill="rgba(255,255,255,0.9)" />
			</svg>

			<!-- Donut: Right Shift vs Left Shift -->
			<div class="favtack-donut-label">Right / Left Shift</div>
			<svg viewBox="0 0 80 80" width="72" height="72" class="favtack-donut">
				<circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,180,180,0.7)" stroke-width="10" />
				<circle cx="40" cy="40" r="30" fill="none" stroke="rgba(180,255,180,0.7)" stroke-width="10"
					stroke-dasharray="{(activeFavouredTack.rightShiftPercent / 100) * 188.5} {188.5}"
					stroke-dashoffset="47.1" />
				<circle cx="40" cy="40" r="20" fill="rgba(255,255,255,0.9)" />
			</svg>

			<div class="favtack-legend-labels">
				<span class="favtack-legend-item" style="color:#dc3545">Left Shift</span>
				<span class="favtack-legend-item" style="color:#28a745">Right Shift</span>
			</div>

			<!-- Shift gradient legend -->
			<div class="favtack-gradient">
				<div class="favtack-gradient-bar"></div>
				<div class="favtack-gradient-labels">
					<span>Left 15&deg;</span>
					<span>0</span>
					<span>15&deg; Right</span>
				</div>
			</div>
		</div>
	{/if}
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

	/* ── Toolbar ── */

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
	.toolbar-btn:hover { background: var(--color-bg-tertiary); }
	.toolbar-btn.active { background: var(--color-primary); color: #fff; }
	.toolbar-btn.active:hover { background: var(--color-primary-hover); }
	.toolbar-btn-accent { color: var(--color-primary); }
	.toolbar-btn-accent:hover { background: rgba(0, 123, 255, 0.1); }
	.toolbar-btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.toolbar-separator {
		width: 1px;
		height: 20px;
		background: var(--color-border-light);
		margin: 0 2px;
	}

	.color-mode-group {
		display: flex;
		gap: 1px;
	}

	/* ── Wind badge ── */

	.wind-badge {
		position: absolute;
		top: 50px;
		right: 10px;
		z-index: 1000;
		padding: 6px 10px;
		border-radius: var(--radius-md);
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		color: #fff;
		font-size: 11px;
		line-height: 1.4;
	}
	.wind-badge-row { display: flex; gap: 6px; justify-content: space-between; }
	.wind-badge-label { opacity: 0.7; font-weight: 500; }
	.wind-badge-value { font-weight: 700; font-variant-numeric: tabular-nums; }

	/* ── Speed legend ── */

	.speed-legend {
		position: absolute;
		bottom: 30px;
		left: 10px;
		z-index: 1000;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(8px);
		box-shadow: var(--shadow-md);
		font-size: 10px;
	}
	.speed-legend-title {
		font-weight: 700;
		font-size: 11px;
		margin-bottom: 4px;
		text-align: center;
		color: var(--color-text-primary);
	}
	.speed-legend-bar {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}
	.speed-legend-label {
		font-variant-numeric: tabular-nums;
		color: var(--color-text-secondary);
		font-weight: 600;
	}
	.speed-gradient-bar {
		width: 16px;
		height: 100px;
		border-radius: 3px;
		background: linear-gradient(to bottom,
			rgb(255, 30, 30),
			rgb(255, 160, 0),
			rgb(255, 255, 100),
			rgb(100, 180, 255),
			rgb(200, 220, 255)
		);
		border: 1px solid rgba(0,0,0,0.15);
	}

	/* ── Favoured tack overlay ── */

	.favtack-overlay {
		position: absolute;
		top: 50px;
		left: 10px;
		z-index: 1000;
		padding: 10px 12px;
		border-radius: var(--radius-lg);
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(8px);
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		max-width: 120px;
	}
	.favtack-title {
		font-weight: 700;
		font-size: 12px;
		color: var(--color-text-primary);
	}
	.favtack-wind-arrow {
		transition: transform 0.3s;
	}
	.favtack-donut-label {
		font-size: 9px;
		color: var(--color-text-secondary);
		font-weight: 600;
		margin-top: 2px;
	}
	.favtack-donut {
		display: block;
	}
	.favtack-legend-labels {
		display: flex;
		gap: 8px;
		font-size: 9px;
		font-weight: 600;
	}
	.favtack-legend-item {
		display: flex;
		align-items: center;
		gap: 3px;
	}
	.favtack-gradient {
		width: 100%;
		margin-top: 4px;
	}
	.favtack-gradient-bar {
		height: 10px;
		border-radius: 3px;
		background: linear-gradient(to right,
			rgb(180, 40, 40),
			rgb(220, 120, 120),
			rgb(180, 180, 180),
			rgb(120, 200, 120),
			rgb(30, 140, 30)
		);
		border: 1px solid rgba(0,0,0,0.1);
	}
	.favtack-gradient-labels {
		display: flex;
		justify-content: space-between;
		font-size: 8px;
		color: var(--color-text-secondary);
		margin-top: 2px;
	}

	/* ── Marker styles ── */

	:global(.boat-map-marker) { background: none !important; border: none !important; }
	:global(.course-mark-icon) { background: none !important; border: none !important; }
	:global(.course-mark-wrapper) { display: flex; flex-direction: column; align-items: center; gap: 2px; }
	:global(.course-mark-label) { font-size: 10px; font-weight: 600; text-shadow: 0 0 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.7); white-space: nowrap; }
	:global(.max-marker-icon) { background: none !important; border: none !important; }
	:global(.max-marker-wrapper) { display: flex; flex-direction: column; align-items: center; gap: 1px; }
	:global(.max-marker-label) { font-size: 9px; font-weight: 700; text-shadow: 0 0 3px rgba(255,255,255,0.9); white-space: nowrap; }
</style>
