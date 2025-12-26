<script lang="ts">
  import { GRID_SIZE } from '$lib/types/game';
  import { settings } from '$lib/stores/settings';
  
  export let gameWidth: number;
  export let gameHeight: number;
  
  // Only label major lines (every 5 units)
  const labelInterval = 5;
  
  function formatSvgViewBox(left: number, top: number, width: number, height: number): string {
    return `${left.toFixed(3)} ${top.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
  }
  
  // Generate x-axis labels (only major lines, bottom edge)
  $: xLabels = (() => {
    const labels: number[] = [];
    for (let x = 0; x <= gameWidth; x += labelInterval) {
      labels.push(x);
    }
    return labels;
  })();
  
  // Generate y-axis labels (only major lines, left edge)
  $: yLabels = (() => {
    const labels: number[] = [];
    for (let y = 0; y <= gameHeight; y += labelInterval) {
      labels.push(y);
    }
    return labels;
  })();
</script>

<!-- Grid Reference Labels (only major lines, edges only) -->
{#if $settings.showGrid}
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox={formatSvgViewBox(0, 0, gameWidth, gameHeight)}
  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 6;"
>
  <!-- X-axis labels (bottom edge only, aligned) -->
  {#each xLabels as x}
    <text 
      x={x} 
      y={gameHeight - 0.5}
      font-size="0.65"
      fill="#777"
      opacity="0.6"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-weight="500"
    >
      {x}
    </text>
  {/each}
  
  <!-- Y-axis labels (left edge only, aligned) -->
  {#each yLabels as y}
    <text 
      x="0.5" 
      y={y + 0.25}
      font-size="0.65"
      fill="#777"
      opacity="0.6"
      text-anchor="start"
      font-family="Arial, sans-serif"
      font-weight="500"
    >
      {y}
    </text>
  {/each}
</svg>
{/if}
