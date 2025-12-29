<script lang="ts">
	export let isOpen = false;

	function handleClose() {
		isOpen = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}
</script>

{#if isOpen}
	<div
		class="modal show"
		tabindex="-1"
		role="dialog"
		style="display: block; background-color: rgba(0,0,0,0.5);"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
	>
		<div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							fill="currentColor"
							viewBox="0 0 16 16"
							style="margin-right: 0.5rem; vertical-align: middle;"
						>
							<path
								d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
							/>
						</svg>
						Help & Documentation
					</h5>
					<button type="button" class="btn-close" aria-label="Close" on:click={handleClose}
					></button>
				</div>
				<div class="modal-body">
					<div class="help-content">
						<!-- Getting Started -->
						<section class="help-section mb-4">
							<h6 class="section-title">Getting Started</h6>
							<p>
								The Tactical Sailing Simulator (TSS) helps you understand and practice sailing
								tactics, especially how wind shifts affect boat performance and positioning.
							</p>
							<ol>
								<li>
									<strong>Start Phase:</strong> Add players, position boats on the start line (drag to
									move), and select a wind scenario.
								</li>
								<li>
									<strong>Race Phase:</strong> Each turn, select actions for each boat (Forward, Tack,
									or To Mark).
								</li>
								<li>
									<strong>Analysis:</strong> Use the tactical cards and insights panel to understand boat
									performance.
								</li>
							</ol>
						</section>

						<!-- Basic Controls -->
						<section class="help-section mb-4">
							<h6 class="section-title">Basic Controls</h6>
							<ul>
								<li><strong>Start Race:</strong> Begins the race and locks wind/positions</li>
								<li><strong>Next Turn:</strong> Advances the game by one turn</li>
								<li><strong>Back:</strong> Undoes the last turn (if available)</li>
								<li>
									<strong>Boat Actions:</strong>
									<ul>
										<li><strong>Forward:</strong> Continue on current tack</li>
										<li><strong>Tack:</strong> Change tack (port ↔ starboard)</li>
										<li><strong>To Mark:</strong> Sail directly toward the windward mark</li>
									</ul>
								</li>
							</ul>
						</section>

						<!-- Wind & Tactics -->
						<section class="help-section mb-4">
							<h6 class="section-title">Understanding Wind & Tactics</h6>
							<div class="tactical-concepts">
								<div class="concept-item mb-3">
									<strong>Lift vs Header:</strong>
									<ul>
										<li>
											<strong>Lift:</strong> Wind shift that allows you to sail closer to the mark (favorable)
										</li>
										<li>
											<strong>Header:</strong> Wind shift that forces you away from the mark (unfavorable)
										</li>
									</ul>
								</div>
								<div class="concept-item mb-3">
									<strong>VMG (Velocity Made Good):</strong>
									<p class="mb-1">Your speed toward the mark. Higher VMG = better performance.</p>
								</div>
								<div class="concept-item mb-3">
									<strong>ATW (Angle to Wind):</strong>
									<p class="mb-1">The angle between your boat's heading and the wind direction.</p>
								</div>
								<div class="concept-item mb-3">
									<strong>Wind Zones:</strong>
									<p class="mb-1">
										Visual indicators showing different sailing angles relative to wind (dead zone,
										close hauled, beam reach, etc.)
									</p>
								</div>
							</div>
						</section>

						<!-- Visual Features -->
						<section class="help-section mb-4">
							<h6 class="section-title">Visual Features</h6>
							<ul>
								<li>
									<strong>Wind Particles:</strong> Teardrop shapes showing wind direction and flow
								</li>
								<li><strong>Boat Tracks:</strong> Trails showing where each boat has sailed</li>
								<li>
									<strong>Laylines:</strong> Lines showing optimal approach angles to the mark
								</li>
								<li>
									<strong>Wind Zones:</strong> Colored arcs showing different sailing angles (enable in
									settings)
								</li>
								<li>
									<strong>Dirty Air Zones:</strong> Visual representation of turbulent air behind boats
									(enable in settings)
								</li>
								<li><strong>Grid:</strong> Reference grid for distance estimation</li>
							</ul>
						</section>

						<!-- Settings -->
						<section class="help-section mb-4">
							<h6 class="section-title">Settings</h6>
							<p>Toggle various visual elements on/off:</p>
							<ul>
								<li><strong>Boats:</strong> Show/hide boats</li>
								<li><strong>Tracks:</strong> Show/hide boat movement trails</li>
								<li><strong>Laylines:</strong> Show/hide optimal approach lines</li>
								<li><strong>Wind Indicators:</strong> Show/hide wind particles</li>
								<li><strong>Grid:</strong> Show/hide reference grid</li>
								<li><strong>Wind Zones:</strong> Show/hide sailing angle zones</li>
								<li><strong>Dirty Air Zones:</strong> Show/hide turbulent air visualization</li>
								<li>
									<strong>Dirty Air Effects:</strong> Enable/disable speed penalties from dirty air
								</li>
							</ul>
						</section>

						<!-- Tips -->
						<section class="help-section mb-4">
							<h6 class="section-title">Tips & Best Practices</h6>
							<ul>
								<li>Watch for wind shifts - a lift on one tack is a header on the other</li>
								<li>Use the tactical insights panel to understand when to tack</li>
								<li>Position boats strategically on the start line using drag-and-drop</li>
								<li>Monitor VMG efficiency - aim for 95%+ for optimal performance</li>
								<li>Pay attention to dirty air when boats are close together</li>
								<li>Use wind zones to understand optimal sailing angles</li>
							</ul>
						</section>

						<!-- Keyboard Shortcuts -->
						<section class="help-section mb-4">
							<h6 class="section-title">Keyboard Shortcuts</h6>
							<ul>
								<li><kbd>Esc</kbd> - Close modals</li>
								<li><kbd>Enter</kbd> / <kbd>Space</kbd> - Activate focused buttons</li>
								<li>More shortcuts coming soon...</li>
							</ul>
						</section>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" on:click={handleClose}> Got it! </button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.help-content {
		line-height: 1.6;
	}

	.help-section {
		border-bottom: 1px solid #e9ecef;
		padding-bottom: 1rem;
	}

	.help-section:last-child {
		border-bottom: none;
	}

	.section-title {
		color: #0d6efd;
		font-weight: 600;
		margin-bottom: 0.75rem;
		font-size: 1.1rem;
	}

	.help-section ul,
	.help-section ol {
		margin-bottom: 0.5rem;
		padding-left: 1.5rem;
	}

	.help-section li {
		margin-bottom: 0.5rem;
	}

	.concept-item {
		background-color: #f8f9fa;
		padding: 0.75rem;
		border-radius: 0.25rem;
		border-left: 3px solid #0d6efd;
	}

	.concept-item strong {
		display: block;
		margin-bottom: 0.5rem;
		color: #212529;
	}

	.concept-item ul {
		margin-top: 0.5rem;
		margin-bottom: 0;
	}

	kbd {
		background-color: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 0.25rem;
		padding: 0.125rem 0.375rem;
		font-size: 0.875em;
		font-family: monospace;
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
	}

	.modal.show {
		display: block !important;
	}
</style>
