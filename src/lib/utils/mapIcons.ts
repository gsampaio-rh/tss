import { getBoatColorHex } from '$lib/types/game';
import type { CourseMark } from '$lib/types/session';

type LeafletModule = typeof import('leaflet');

export function createBoatIcon(L: LeafletModule, color: string, rotation: number) {
	const hex = getBoatColorHex(color);
	return L.divIcon({
		className: 'boat-map-marker',
		html: `<div style="transform: rotate(${rotation}deg); transform-origin: center;">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -10 14 20" width="24" height="34">
				<path d="M -4 7.5 L 4 7.5 C 5 1.5 5 -2.5 2.5 -9 L -2.5 -9 C -5 -2.5 -5 1.5 -4 7.5 Z"
					stroke="#fff" stroke-width=".5" fill="${hex}" />
				<path d="M 0 -6 C 2 -4 3 -1 2 6" stroke="white" fill="none" stroke-width="1" />
				<ellipse rx="0.7" ry="0.7" cx="0" cy="-6" fill="#fff" />
			</svg>
		</div>`,
		iconSize: [24, 34],
		iconAnchor: [12, 17]
	});
}

const MARK_COLORS: Record<string, string> = {
	'start-port': '#dc3545',
	'start-starboard': '#28a745',
	'windward': '#ff8c00',
	'leeward': '#007bff',
	'gate-port': '#dc3545',
	'gate-starboard': '#28a745'
};

const MARK_SHAPES: Record<string, string> = {
	'start-port': '<circle cx="12" cy="12" r="8" fill="COLOR" stroke="#fff" stroke-width="2"/>',
	'start-starboard': '<circle cx="12" cy="12" r="8" fill="COLOR" stroke="#fff" stroke-width="2"/>',
	'windward': '<polygon points="12,4 4,20 20,20" fill="COLOR" stroke="#fff" stroke-width="2"/>',
	'leeward': '<polygon points="12,20 4,4 20,4" fill="COLOR" stroke="#fff" stroke-width="2"/>',
	'gate-port': '<rect x="4" y="4" width="16" height="16" fill="COLOR" stroke="#fff" stroke-width="2"/>',
	'gate-starboard': '<rect x="4" y="4" width="16" height="16" fill="COLOR" stroke="#fff" stroke-width="2"/>'
};

export function createCourseMarkIcon(L: LeafletModule, mark: CourseMark) {
	const color = MARK_COLORS[mark.type] || '#666';
	const shape = (MARK_SHAPES[mark.type] || MARK_SHAPES['windward']).replace('COLOR', color);
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

export function createTriangleIcon(L: LeafletModule, color: string, label: string, filled: boolean) {
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
