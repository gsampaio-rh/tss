/**
 * Split wind string into array of values
 * Handles comma, space, or newline delimiters
 */
export function splitWind(windText: string): string[] {
  if (!windText) return [];
  return windText
    .split(/[,\s\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Format number with default fallback
 */
export function formatNumber(value: number, defaultValue: number): number {
  if (isNaN(value) || value <= 0) {
    return defaultValue;
  }
  return Math.round(value);
}

/**
 * Generate SVG for wind visualization
 */
export function getWindSvg(
  windValues: number[],
  startIndex: number,
  width: number,
  height: number,
  scale: number
): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width.toString());
  svg.setAttribute('height', height.toString());
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  
  if (windValues.length === 0) return svg;
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const pathData: string[] = [];
  
  const stepWidth = width / windValues.length;
  const centerY = height / 2;
  const maxWind = Math.max(...windValues.map(Math.abs), 1);
  
  windValues.forEach((wind, index) => {
    const x = index * stepWidth;
    const y = centerY - (wind / maxWind) * (height / 2) * scale;
    
    if (index === 0) {
      pathData.push(`M ${x} ${y}`);
    } else {
      pathData.push(`L ${x} ${y}`);
    }
  });
  
  path.setAttribute('d', pathData.join(' '));
  path.setAttribute('stroke', '#007bff');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');
  
  svg.appendChild(path);
  return svg;
}

/**
 * Get SVG path command for wind visualization
 */
export function getSvgPathCommand(x: number, y: number, isFirst: boolean): string {
  return isFirst ? `M ${x} ${y}` : `L ${x} ${y}`;
}

/**
 * Get SVG line element
 */
export function getSvgLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string = '#000',
  strokeWidth: number = 1
): SVGLineElement {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1.toString());
  line.setAttribute('y1', y1.toString());
  line.setAttribute('x2', x2.toString());
  line.setAttribute('y2', y2.toString());
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', strokeWidth.toString());
  return line;
}

