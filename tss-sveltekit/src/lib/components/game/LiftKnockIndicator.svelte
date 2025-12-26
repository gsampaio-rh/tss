<script lang="ts">
  export let relativeAngle: number; // Positive = lift, Negative = knock
  export let liftAmount: number; // Absolute value
  
  $: isLift = relativeAngle > 0;
  $: maxAngle = 45; // Maximum angle for full bar
  $: barFill = Math.min((liftAmount / maxAngle) * 100, 100); // Percentage fill
  $: barCount = Math.ceil(liftAmount / 5); // One bar per 5 degrees
  $: maxBars = 9; // Maximum bars to show
  
  // Calculate how many bars to show (filled vs empty)
  $: filledBars = Math.min(barCount, maxBars);
  $: emptyBars = maxBars - filledBars;
</script>

<div class="lift-knock-indicator" class:is-lift={isLift} class:is-knock={!isLift}>
  <div class="indicator-label">
    {isLift ? 'LIFT' : 'KNOCK'}
  </div>
  <div class="angle-bars">
    {#each Array(filledBars) as _, i}
      <div class="bar filled" style="animation-delay: {i * 0.05}s;"></div>
    {/each}
    {#each Array(emptyBars) as _, i}
      <div class="bar empty"></div>
    {/each}
  </div>
  <div class="angle-value">{liftAmount.toFixed(0)}°</div>
</div>

<style>
  .lift-knock-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  
  .indicator-label {
    font-weight: 700;
    font-size: 0.7rem;
    letter-spacing: 0.5px;
    min-width: 45px;
  }
  
  .is-lift .indicator-label {
    color: #28a745;
  }
  
  .is-knock .indicator-label {
    color: #dc3545;
  }
  
  .angle-bars {
    display: flex;
    gap: 2px;
    align-items: center;
    flex: 1;
  }
  
  .bar {
    height: 12px;
    width: 4px;
    border-radius: 1px;
    transition: all 0.3s ease;
  }
  
  .bar.filled {
    animation: barFill 0.4s ease-out;
  }
  
  .is-lift .bar.filled {
    background: #28a745;
  }
  
  .is-knock .bar.filled {
    background: #dc3545;
  }
  
  .bar.empty {
    background: #e9ecef;
  }
  
  .angle-value {
    font-weight: 600;
    font-size: 0.75rem;
    min-width: 30px;
    text-align: right;
  }
  
  .is-lift .angle-value {
    color: #28a745;
  }
  
  .is-knock .angle-value {
    color: #dc3545;
  }
  
  @keyframes barFill {
    from {
      opacity: 0;
      transform: scaleY(0);
    }
    to {
      opacity: 1;
      transform: scaleY(1);
    }
  }
</style>

