/**
 * Course Marks Store
 *
 * Manages race course marks (start line, windward mark, leeward mark)
 * that are placed on the map via user interaction or auto-detection.
 */

import { writable, derived, get } from 'svelte/store';
import { session } from './session';
import type { CourseMark, CourseMarkType } from '$lib/types/session';

export type PlacementMode = CourseMarkType | null;

export const placementMode = writable<PlacementMode>(null);

export const courseMarks = derived(session, ($session) =>
	$session ? $session.raceCourse.marks : []
);

export const startLine = derived(courseMarks, ($marks) => {
	const port = $marks.find((m) => m.type === 'start-port');
	const starboard = $marks.find((m) => m.type === 'start-starboard');
	return port && starboard ? { port, starboard } : null;
});

export const windwardMark = derived(courseMarks, ($marks) =>
	$marks.find((m) => m.type === 'windward') ?? null
);

export const leewardMark = derived(courseMarks, ($marks) =>
	$marks.find((m) => m.type === 'leeward') ?? null
);

export const courseMarkActions = {
	placeMark(type: CourseMarkType, lat: number, lon: number) {
		session.update(($session) => {
			if (!$session) return $session;

			const labels: Record<CourseMarkType, string> = {
				'start-port': 'Start (Port)',
				'start-starboard': 'Start (Stbd)',
				'windward': 'Windward Mark',
				'leeward': 'Leeward Mark',
				'gate-port': 'Gate (Port)',
				'gate-starboard': 'Gate (Stbd)'
			};

			const newMark: CourseMark = {
				id: crypto.randomUUID(),
				type,
				lat,
				lon,
				label: labels[type]
			};

			// Replace existing mark of the same type, or add new
			const existing = $session.raceCourse.marks.findIndex((m) => m.type === type);
			const marks = [...$session.raceCourse.marks];
			if (existing >= 0) {
				marks[existing] = newMark;
			} else {
				marks.push(newMark);
			}

			return {
				...$session,
				raceCourse: { marks }
			};
		});
	},

	removeMark(type: CourseMarkType) {
		session.update(($session) => {
			if (!$session) return $session;
			return {
				...$session,
				raceCourse: {
					marks: $session.raceCourse.marks.filter((m) => m.type !== type)
				}
			};
		});
	},

	clearAll() {
		session.update(($session) => {
			if (!$session) return $session;
			return {
				...$session,
				raceCourse: { marks: [] }
			};
		});
	},

	setPlacementMode(mode: PlacementMode) {
		placementMode.set(mode);
	}
};
