/**
 * Wind Particle SVG Utilities
 * 
 * Helper functions for creating SVG paths and gradients for wind particles.
 */

/**
 * Format SVG viewBox attribute
 */
export function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
	return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
}

/**
 * Create teardrop/droplet shape path - elegant and simple
 */
export function createTeardropPath(
	x: number,
	y: number,
	angle: number,
	length: number,
	width: number
): string {
	// Head center (rounded front) - 70% along the length
	const headX = x + Math.cos(angle) * length * 0.7;
	const headY = y + Math.sin(angle) * length * 0.7;
	const headRadius = width * 0.5;

	// Tail point (sharp end) - 30% behind center
	const tailX = x - Math.cos(angle) * length * 0.3;
	const tailY = y - Math.sin(angle) * length * 0.3;

	// Perpendicular direction for width
	const perpAngle = angle + Math.PI / 2;

	// Create smooth teardrop using quadratic curves
	// Start from tail (point)
	let pathData = `M ${tailX.toFixed(2)} ${tailY.toFixed(2)}`;

	// Left side: smooth curve from tail to head
	const numPoints = 8;
	for (let i = 1; i <= numPoints; i++) {
		const t = i / numPoints;
		// Smooth easing for natural taper
		const easeT = t * t * (3 - 2 * t); // Smoothstep

		// Position along the length
		const posX = tailX + (headX - tailX) * easeT;
		const posY = tailY + (headY - tailY) * easeT;

		// Width tapers smoothly from head to tail
		const currentWidth = headRadius * (1 - easeT * 0.99);

		// Perpendicular offset
		const offsetX = Math.cos(perpAngle) * currentWidth;
		const offsetY = Math.sin(perpAngle) * currentWidth;

		if (i === 1) {
			pathData += ` L ${(posX + offsetX).toFixed(2)} ${(posY + offsetY).toFixed(2)}`;
		} else {
			// Use quadratic curve for smoothness
			const prevT = (i - 1) / numPoints;
			const prevEaseT = prevT * prevT * (3 - 2 * prevT);
			const prevPosX = tailX + (headX - tailX) * prevEaseT;
			const prevPosY = tailY + (headY - tailY) * prevEaseT;
			const prevWidth = headRadius * (1 - prevEaseT * 0.99);
			const prevOffsetX = Math.cos(perpAngle) * prevWidth;
			const prevOffsetY = Math.sin(perpAngle) * prevWidth;

			const controlX = (prevPosX + prevOffsetX + posX + offsetX) / 2;
			const controlY = (prevPosY + prevOffsetY + posY + offsetY) / 2;
			pathData += ` Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${(posX + offsetX).toFixed(2)} ${(posY + offsetY).toFixed(2)}`;
		}
	}

	// Rounded head (semi-circle) - 6 points for smooth arc
	const headPoints = 6;
	for (let i = 0; i <= headPoints; i++) {
		const headAngle = angle + Math.PI / 2 + (i / headPoints) * Math.PI;
		const headPointX = headX + Math.cos(headAngle) * headRadius;
		const headPointY = headY + Math.sin(headAngle) * headRadius;

		if (i === 0) {
			pathData += ` L ${headPointX.toFixed(2)} ${headPointY.toFixed(2)}`;
		} else {
			// Smooth arc using quadratic curves
			pathData += ` Q ${headX.toFixed(2)} ${headY.toFixed(2)} ${headPointX.toFixed(2)} ${headPointY.toFixed(2)}`;
		}
	}

	// Right side (mirror of left) - back to tail
	for (let i = numPoints - 1; i >= 0; i--) {
		const t = i / numPoints;
		const easeT = t * t * (3 - 2 * t);

		const posX = tailX + (headX - tailX) * easeT;
		const posY = tailY + (headY - tailY) * easeT;
		const currentWidth = headRadius * (1 - easeT * 0.99);

		const offsetX = Math.cos(perpAngle) * currentWidth;
		const offsetY = Math.sin(perpAngle) * currentWidth;

		if (i === numPoints - 1) {
			pathData += ` L ${(posX - offsetX).toFixed(2)} ${(posY - offsetY).toFixed(2)}`;
		} else {
			const prevT = (i + 1) / numPoints;
			const prevEaseT = prevT * prevT * (3 - 2 * prevT);
			const prevPosX = tailX + (headX - tailX) * prevEaseT;
			const prevPosY = tailY + (headY - tailY) * prevEaseT;
			const prevWidth = headRadius * (1 - prevEaseT * 0.99);
			const prevOffsetX = Math.cos(perpAngle) * prevWidth;
			const prevOffsetY = Math.sin(perpAngle) * prevWidth;

			const controlX = (prevPosX - prevOffsetX + posX - offsetX) / 2;
			const controlY = (prevPosY - prevOffsetY + posY - offsetY) / 2;
			pathData += ` Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${(posX - offsetX).toFixed(2)} ${(posY - offsetY).toFixed(2)}`;
		}
	}

	pathData += ` Z`;
	return pathData;
}

/**
 * Create gradient for teardrop (bright at head, darker at tail)
 */
export function createGradient(
	svg: SVGElement,
	defsElement: SVGDefsElement | null,
	id: string,
	opacity: number
): { gradient: SVGLinearGradientElement; defsElement: SVGDefsElement } {
	let defs = defsElement;
	if (!defs) {
		defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		svg.insertBefore(defs, svg.firstChild);
	}

	const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
	gradient.setAttribute('id', id);
	gradient.setAttribute('x1', '0%');
	gradient.setAttribute('y1', '0%');
	gradient.setAttribute('x2', '100%');
	gradient.setAttribute('y2', '0%');

	// Bright white/light blue at head (0%)
	const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stop1.setAttribute('offset', '0%');
	stop1.setAttribute('stop-color', `hsla(200, 70%, 90%, ${opacity})`);
	gradient.appendChild(stop1);

	// Light blue in middle (40%)
	const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stop2.setAttribute('offset', '40%');
	stop2.setAttribute('stop-color', `hsla(205, 65%, 75%, ${opacity * 0.95})`);
	gradient.appendChild(stop2);

	// Medium blue (70%)
	const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stop3.setAttribute('offset', '70%');
	stop3.setAttribute('stop-color', `hsla(210, 55%, 60%, ${opacity * 0.8})`);
	gradient.appendChild(stop3);

	// Darker blue at tail (100%)
	const stop4 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stop4.setAttribute('offset', '100%');
	stop4.setAttribute('stop-color', `hsla(215, 45%, 50%, ${opacity * 0.5})`);
	gradient.appendChild(stop4);

	defs.appendChild(gradient);
	return { gradient, defsElement: defs };
}

