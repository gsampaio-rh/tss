<script lang="ts">
  import { windScenarios, selectedWindIndex, windActions } from '$lib/stores/wind';
  import { gameActions } from '$lib/stores/game';
  import type { WindScenario } from '$lib/types/wind';
  import { splitWind, formatNumber, getWindSvg } from '$lib/utils/windEditorUtils';
  import { onMount, onDestroy } from 'svelte';
  
  export let isOpen = false;
  export let isCreate = false; // true for create mode, false for edit mode
  
  let scenarioName = '';
  let windText = '';
  let mapWidth = 40;
  let mapHeight = 30;
  let startLineSize = 15;
  let errorText = '';
  let windCount = '0 / 0';
  let windAverage = '0.0';
  let previewContainer: HTMLDivElement;
  let isReadOnly = false;
  let editIndex = -1;
  
  // Reactive: update preview when inputs change
  $: if (isOpen) {
    updatePreview();
    checkErrors();
  }
  
  function checkErrors() {
    const windtmp = splitWind(windText);
    const errors: string[] = [];
    
    for (let i = 0; i < windtmp.length; i++) {
      if (isNaN(parseInt(windtmp[i]))) {
        if (windtmp[i] !== '') {
          errors.push(`"${windtmp[i]}" is not a number`);
        }
      }
    }
    
    if (errors.length > 0) {
      errorText = errors[0];
    } else {
      errorText = '';
    }
  }
  
  function updatePreview() {
    if (!previewContainer) return;
    
    const parsedWind: number[] = [];
    const size = Math.round((mapHeight - 4) / Math.sin(Math.PI / 4));
    const windtmp = splitWind(windText);
    
    let averageWind = 0;
    
    for (let i = 0; i < size; i++) {
      const parsedValue = parseInt(windtmp[i % windtmp.length]);
      if (!isNaN(parsedValue)) {
        parsedWind.push(parsedValue);
        averageWind += parsedValue;
      } else {
        parsedWind.push(0);
      }
    }
    
    averageWind = parsedWind.length > 0 ? averageWind / parsedWind.length : 0;
    windAverage = averageWind.toFixed(1);
    windCount = `${windtmp.length} / ${size}`;
    
    // Clear and render preview
    previewContainer.innerHTML = '';
    if (parsedWind.length > 0) {
      const svg = getWindSvg(parsedWind, 0, window.innerWidth / 4 - 20, window.innerHeight - 166, 1.5);
      previewContainer.appendChild(svg);
    }
  }
  
  function handleOpen() {
    if (isCreate) {
      // Create mode: set defaults
      editIndex = -1;
      isReadOnly = false;
      
      // Generate next "User Defined" name
      let userDefinedIndex = 1;
      $windScenarios.forEach(scenario => {
        if (scenario.name.includes('User Defined')) {
          const match = scenario.name.match(/User Defined (\d+)/);
          if (match) {
            const index = parseInt(match[1]);
            if (index >= userDefinedIndex) {
              userDefinedIndex = index + 1;
            }
          }
        }
      });
      
      scenarioName = `User Defined ${userDefinedIndex}`;
      windText = '0, 0, 0';
      mapWidth = 40;
      mapHeight = 30;
      startLineSize = 15;
    } else {
      // Edit mode: load current scenario
      const currentIndex = $selectedWindIndex;
      if (currentIndex >= 0 && currentIndex < $windScenarios.length) {
        editIndex = currentIndex;
        const scenario = $windScenarios[currentIndex];
        
        isReadOnly = scenario.type !== 'User defined';
        
        scenarioName = scenario.name;
        mapWidth = scenario.width;
        mapHeight = scenario.height;
        startLineSize = scenario.startsize || 15;
        
        // Format wind array as comma-separated string
        windText = scenario.wind.map(w => w.toString()).join(', ');
      }
    }
    
    // Update preview after a tick to ensure DOM is ready
    setTimeout(() => {
      updatePreview();
      checkErrors();
    }, 0);
  }
  
  function handleSave() {
    if (isReadOnly || errorText) return;
    
    const windValues = splitWind(windText).map(w => {
      const parsed = parseInt(w);
      return isNaN(parsed) ? 0 : parsed;
    });
    
    const newScenario: WindScenario = {
      name: scenarioName,
      type: 'User defined',
      wind: windValues,
      width: formatNumber(mapWidth, 40),
      height: formatNumber(mapHeight, 30),
      startsize: formatNumber(startLineSize, 15),
      stepscount: windValues.length
    };
    
    if (editIndex === -1) {
      // Create new
      windActions.addScenario(newScenario);
      windActions.selectWind($windScenarios.length - 1);
    } else {
      // Update existing
      windActions.updateScenario(editIndex, newScenario);
      windActions.selectWind(editIndex);
    }
    
    // Update game with new wind
    gameActions.changeWind(newScenario);
    
    isOpen = false;
  }
  
  function handleDelete() {
    if (editIndex === -1 || isReadOnly) return;
    
    windActions.deleteScenario(editIndex);
    
    // Select previous scenario
    const newIndex = Math.max(0, editIndex - 1);
    windActions.selectWind(newIndex);
    gameActions.changeWind($windScenarios[newIndex]);
    
    isOpen = false;
  }
  
  function handleCopy() {
    if (editIndex === -1) return;
    
    const scenario = $windScenarios[editIndex];
    const copiedScenario: WindScenario = {
      ...scenario,
      name: scenario.name + ' copy',
      type: 'User defined',
      stepscount: scenario.wind.length
    };
    
    windActions.addScenario(copiedScenario);
    windActions.selectWind($windScenarios.length - 1);
    gameActions.changeWind(copiedScenario);
    
    isOpen = false;
  }
  
  function handleShare() {
    if (editIndex === -1 || isReadOnly) return;
    
    const scenario = $windScenarios[editIndex];
    const url = `https://tss.boats/#w${JSON.stringify(scenario)}`;
    navigator.clipboard.writeText(encodeURI(url));
    
    // TODO: Show tooltip feedback
    alert('Link copied to clipboard!');
  }
  
  // Handle window resize for preview
  let resizeHandler: () => void;
  onMount(() => {
    resizeHandler = () => {
      if (isOpen) updatePreview();
    };
    window.addEventListener('resize', resizeHandler);
  });
  
  onDestroy(() => {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
  });
  
  // Watch for modal open
  $: if (isOpen) {
    handleOpen();
  }
</script>

{#if isOpen}
  <!-- Bootstrap Modal -->
  <div 
    class="modal fade show" 
    style="display: block; background: rgba(0,0,0,0.5);"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog modal-fullscreen">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5">Wind Editor</h1>
          <div class="mr-0">
            {#if !isCreate && !isReadOnly}
              <button 
                class="btn btn-outline-primary" 
                on:click={handleShare}
                title="Share wind scenario"
              >
                Share
              </button>
            {/if}
            <button 
              type="button" 
              class="btn-close" 
              on:click={() => isOpen = false}
              aria-label="Close"
            ></button>
          </div>
        </div>
        
        <div class="modal-body row overflow-hidden">
          <div class="col" style="height: 100%; overflow: auto;">
            {#if isReadOnly}
              <div class="alert alert-warning">
                This is a predefined wind preset. It cannot be changed. Use 'Create Wind' button to
                create custom wind scenario.
              </div>
            {/if}
            
            <div class="mb-3">
              <label class="form-label">Scenario name</label>
              <input 
                type="text" 
                class="form-control" 
                bind:value={scenarioName}
                placeholder='i.e. "pendulum 1"'
                disabled={isReadOnly}
              />
            </div>
            
            <div class="mb-0">
              <label class="form-label">
                Wind change
                <a 
                  data-bs-toggle="tooltip" 
                  data-bs-title="Enter wind change. Use space, comma or enter as delimiter."
                  data-bs-placement="right" 
                  style="color: var(--bs-primary); margin-left: 0.5rem;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="bi" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                  </svg>
                </a>
              </label>
              <textarea 
                class="form-control" 
                rows="7"
                bind:value={windText}
                placeholder="i.e. 5, 10, 15, 20, 15..."
                disabled={isReadOnly}
              ></textarea>
            </div>
            
            <div class="mb-3 row">
              <div class="col d-block invalid-feedback" style="display: {errorText ? 'block' : 'none'} !important;">
                {errorText}
              </div>
              <div class="col-auto"><span>Average wind: </span><span>{windAverage}</span></div>
              <div class="col-auto text-end"><span>Wind length: </span><span>{windCount}</span></div>
            </div>
            
            <div class="mb-3">
              <div class="row">
                <div class="col">
                  <label class="form-label">Map width</label>
                  <input 
                    type="number" 
                    min="5" 
                    max="200" 
                    class="form-control" 
                    bind:value={mapWidth}
                    disabled={isReadOnly}
                  />
                </div>
                <div class="col">
                  <label class="form-label">Map height</label>
                  <input 
                    type="number" 
                    min="5" 
                    max="200" 
                    class="form-control" 
                    bind:value={mapHeight}
                    disabled={isReadOnly}
                  />
                </div>
                <div class="col">
                  <label class="form-label">Start line size</label>
                  <input 
                    type="number" 
                    min="5" 
                    max="200" 
                    class="form-control" 
                    bind:value={startLineSize}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-3 h-100" bind:this={previewContainer} style="height: 100%;"></div>
        </div>
        
        <div class="modal-footer">
          <div class="row w-100 g-2">
            <div class="col-auto">
              {#if !isCreate && !isReadOnly}
                <button 
                  type="button" 
                  class="btn btn-danger col-auto" 
                  on:click={handleDelete}
                >
                  Delete
                </button>
              {/if}
            </div>
            <div class="col-auto">
              {#if !isCreate && !isReadOnly}
                <button 
                  class="btn btn-primary" 
                  on:click={handleCopy}
                >
                  Make a copy
                </button>
              {/if}
            </div>
            <div class="col"></div>
            
            <div class="col-auto">
              {#if !isReadOnly}
                <button 
                  type="button" 
                  class="btn btn-primary col-auto" 
                  on:click={handleSave}
                  disabled={!!errorText}
                >
                  Save changes
                </button>
              {/if}
            </div>
            <div class="col-auto">
              <button 
                type="button" 
                class="btn btn-secondary" 
                on:click={() => isOpen = false}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal.show {
    display: block !important;
  }
  
  .invalid-feedback {
    color: #dc3545;
    font-size: 0.875em;
  }
</style>
