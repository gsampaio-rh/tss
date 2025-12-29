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
 * Create unit streak path (centered at origin, pointing right)
 * This is a tapered capsule: small rounded head, long thin tail
 * Designed to be transformed (translate, rotate, scale) rather than regenerated
 */
export function createUnitStreakPath(length: number = 1.0, headWidth: number = 0.15): string {
	// Head: small rounded cap at the front (right side, x > 0)
	const headRadius = headWidth * 0.5;
	const headX = length * 0.4; // Head is 40% along the length
	
	// Tail: tapers to near-zero at the back (left side, x < 0)
	const tailX = -length * 0.6;
	
	// Create a tapered streak using quadratic curves
	// Start from tail (point)
	let pathData = `M ${tailX.toFixed(3)} 0`;
	
	// Left side: smooth curve from tail to head
	const numPoints = 6;
	for (let i = 1; i <= numPoints; i++) {
		const t = i / numPoints;
		// Smooth easing for natural taper
		const easeT = t * t * (3 - 2 * t); // Smoothstep
		
		// Position along the length
		const posX = tailX + (headX - tailX) * easeT;
		
		// Width tapers smoothly from head to tail
		const currentWidth = headRadius * (1 - easeT * 0.98);
		
		if (i === 1) {
			pathData += ` L ${posX.toFixed(3)} ${currentWidth.toFixed(3)}`;
		} else {
			const prevT = (i - 1) / numPoints;
			const prevEaseT = prevT * prevT * (3 - 2 * prevT);
			const prevPosX = tailX + (headX - tailX) * prevEaseT;
			const prevWidth = headRadius * (1 - prevEaseT * 0.98);
			
			const controlX = (prevPosX + posX) / 2;
			const controlY = (prevWidth + currentWidth) / 2;
			pathData += ` Q ${controlX.toFixed(3)} ${controlY.toFixed(3)} ${posX.toFixed(3)} ${currentWidth.toFixed(3)}`;
		}
	}
	
	// Rounded head (semi-circle) - 4 points for smooth arc
	const headPoints = 4;
	for (let i = 0; i <= headPoints; i++) {
		const headAngle = Math.PI / 2 + (i / headPoints) * Math.PI;
		const headPointX = headX + Math.cos(headAngle) * headRadius;
		const headPointY = Math.sin(headAngle) * headRadius;
		
		if (i === 0) {
			pathData += ` L ${headPointX.toFixed(3)} ${headPointY.toFixed(3)}`;
		} else {
			pathData += ` Q ${headX.toFixed(3)} 0 ${headPointX.toFixed(3)} ${headPointY.toFixed(3)}`;
		}
	}
	
	// Right side (mirror of left) - back to tail
	for (let i = numPoints - 1; i >= 0; i--) {
		const t = i / numPoints;
		const easeT = t * t * (3 - 2 * t);
		
		const posX = tailX + (headX - tailX) * easeT;
		const currentWidth = headRadius * (1 - easeT * 0.98);
		
		if (i === numPoints - 1) {
			pathData += ` L ${posX.toFixed(3)} ${(-currentWidth).toFixed(3)}`;
		} else {
			const prevT = (i + 1) / numPoints;
			const prevEaseT = prevT * prevT * (3 - 2 * prevT);
			const prevPosX = tailX + (headX - tailX) * prevEaseT;
			const prevWidth = headRadius * (1 - prevEaseT * 0.98);
			
			const controlX = (prevPosX + posX) / 2;
			const controlY = (-prevWidth - currentWidth) / 2;
			pathData += ` Q ${controlX.toFixed(3)} ${controlY.toFixed(3)} ${posX.toFixed(3)} ${(-currentWidth).toFixed(3)}`;
		}
	}
	
	pathData += ` Z`;
	return pathData;
}

/**
 * Create shared gradients for wind particles (near and far layers)
 * These gradients are created once and reused by all particles
 */
export function createSharedGradients(
	svg: SVGElement,
	defsElement: SVGDefsElement | null
): SVGDefsElement {
	let defs = defsElement;
	if (!defs) {
		defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		svg.insertBefore(defs, svg.firstChild);
	}

	// Check if gradients already exist
	if (defs.querySelector('#windNear') && defs.querySelector('#windFar')) {
		return defs;
	}

	// Near gradient (brighter, higher opacity)
	const gradientNear = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
	gradientNear.setAttribute('id', 'windNear');
	gradientNear.setAttribute('x1', '0%');
	gradientNear.setAttribute('y1', '0%');
	gradientNear.setAttribute('x2', '100%');
	gradientNear.setAttribute('y2', '0%');

	const stopNear1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stopNear1.setAttribute('offset', '0%');
	stopNear1.setAttribute('stop-color', 'hsla(200, 50%, 85%, 0.7)'); // Brighter at head
	gradientNear.appendChild(stopNear1);

	const stopNear2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stopNear2.setAttribute('offset', '40%');
	stopNear2.setAttribute('stop-color', 'hsla(205, 45%, 70%, 0.65)');
	gradientNear.appendChild(stopNear2);

	const stopNear3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stopNear3.setAttribute('offset', '70%');
	stopNear3.setAttribute('stop-color', 'hsla(210, 40%, 60%, 0.5)');
	gradientNear.appendChild(stopNear3);

	const stopNear4 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stopNear4.setAttribute('offset', '100%');
	stopNear4.setAttribute('stop-color', 'hsla(215, 35%, 50%, 0.3)'); // Fades at tail
	gradientNear.appendChild(stopNear4);

	defs.appendChild(gradientNear);

	// Far gradient (dimmer, lower opacity)
	const gradientFar = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
	gradientFar.setAttribute('id', 'windFar');
	gradientFar.setAttribute('x1', '0%');
	gradientFar.setAttribute('y1', '0%');
	gradientFar.setAttribute('x2', '100%');
	gradientFar.setAttribute('y2', '0%');

	const stopFar1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stopFar1.setAttribute('offset', '0%');
	stopFar1.setAttribute('stop-color', 'hsla(200, 40%, 80%, 0.4)');
	gradientFar.appendChild(stopFar1);

	const stopFar2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stopFar2.setAttribute('offset', '40%');
	stopFar2.setAttribute('stop-color', 'hsla(205, 35%, 65%, 0.35)');
	gradientFar.appendChild(stopFar2);

	const stopFar3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stopFar3.setAttribute('offset', '70%');
	stopFar3.setAttribute('stop-color', 'hsla(210, 30%, 55%, 0.25)');
	gradientFar.appendChild(stopFar3);

	const stopFar4 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
	stopFar4.setAttribute('offset', '100%');
	stopFar4.setAttribute('stop-color', 'hsla(215, 25%, 45%, 0.15)');
	gradientFar.appendChild(stopFar4);

	defs.appendChild(gradientFar);

	return defs;
}

