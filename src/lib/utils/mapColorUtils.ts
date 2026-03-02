const SPEED_COLORS = [
	{ stop: 0, color: [200, 220, 255] },
	{ stop: 0.25, color: [100, 180, 255] },
	{ stop: 0.5, color: [255, 255, 100] },
	{ stop: 0.75, color: [255, 160, 0] },
	{ stop: 1, color: [255, 30, 30] }
];

export function speedToColor(speed: number, minSpeed: number, maxSpeed: number): string {
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

export function shiftToColor(shiftDeg: number): string {
	const maxShift = 15;
	const clamped = Math.max(-maxShift, Math.min(maxShift, shiftDeg));
	const t = clamped / maxShift;
	if (t < 0) {
		const s = Math.abs(t);
		const r = Math.round(180 + 75 * s);
		const g = Math.round(180 - 130 * s);
		const b = Math.round(180 - 140 * s);
		return `rgb(${r},${g},${b})`;
	} else {
		const s = t;
		const r = Math.round(180 - 150 * s);
		const g = Math.round(180 + 60 * s);
		const b = Math.round(180 - 150 * s);
		return `rgb(${r},${g},${b})`;
	}
}

export function angleDiff(a: number, b: number): number {
	let d = b - a;
	if (d > 180) d -= 360;
	if (d < -180) d += 360;
	return d;
}

export const MS_TO_KNOTS = 1.94384;
