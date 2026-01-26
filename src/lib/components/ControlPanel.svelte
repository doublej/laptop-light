<script lang="ts">
	import type { Tone } from '$lib/tones';

	interface Props {
		visible: boolean;
		tones: Tone[];
		selectedToneId: string;
		brightness: number;
		flickerEnabled: boolean;
		flickerIntensity: number;
		hdrEnabled: boolean;
		hdrSupported: boolean;
		wakeLockEnabled: boolean;
		wakeLockSupported: boolean;
		isFullscreen: boolean;
		remoteConnected: boolean;
		onToneSelect: (id: string) => void;
		onBrightnessChange: (value: number) => void;
		onFlickerToggle: () => void;
		onFlickerIntensityChange: (value: number) => void;
		onHdrToggle: () => void;
		onWakeLockToggle: () => void;
		onFullscreenToggle: () => void;
		onQROpen: () => void;
	}

	let {
		visible,
		tones,
		selectedToneId,
		brightness,
		flickerEnabled,
		flickerIntensity,
		hdrEnabled,
		hdrSupported,
		wakeLockEnabled,
		wakeLockSupported,
		isFullscreen,
		remoteConnected,
		onToneSelect,
		onBrightnessChange,
		onFlickerToggle,
		onFlickerIntensityChange,
		onHdrToggle,
		onWakeLockToggle,
		onFullscreenToggle,
		onQROpen
	}: Props = $props();

	let settingsOpen = $state(false);

	function handleBrightnessInput(e: Event) {
		onBrightnessChange(Number((e.target as HTMLInputElement).value));
	}

	function handleFlickerInput(e: Event) {
		onFlickerIntensityChange(Number((e.target as HTMLInputElement).value));
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="control-panel" class:visible>
	<!-- Main control bar -->
	<div class="main-bar">
		<!-- Tone swatches -->
		<div class="tone-group">
			{#each tones as tone (tone.id)}
				<button
					class="tone-swatch"
					class:selected={tone.id === selectedToneId}
					style:--tone={tone.color}
					onclick={() => onToneSelect(tone.id)}
					aria-label={tone.name}
					title={tone.name}
				>
					{#if tone.id === selectedToneId}
						<svg class="check" viewBox="0 0 16 16" fill="currentColor">
							<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>

		<div class="divider"></div>

		<!-- Brightness slider -->
		<div class="brightness-group">
			<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="4"/>
				<path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
			</svg>
			<input
				type="range"
				min="10"
				max="100"
				value={brightness}
				oninput={handleBrightnessInput}
				class="slider"
				aria-label="Brightness"
			/>
		</div>

		<div class="divider"></div>

		<!-- Action buttons -->
		<div class="action-group">
			<button
				class="action-btn"
				class:active={settingsOpen}
				onclick={() => settingsOpen = !settingsOpen}
				aria-label="Settings"
				title="Settings"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
					<circle cx="12" cy="12" r="3"/>
				</svg>
			</button>

			<button
				class="action-btn"
				class:connected={remoteConnected}
				onclick={onQROpen}
				aria-label="Remote control"
				title="Remote control"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="5" y="5" width="6" height="6" rx="1"/>
					<rect x="13" y="5" width="6" height="6" rx="1"/>
					<rect x="5" y="13" width="6" height="6" rx="1"/>
					<path d="M13 13h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2z"/>
				</svg>
				{#if remoteConnected}
					<span class="connected-dot"></span>
				{/if}
			</button>

			<button
				class="action-btn"
				onclick={onFullscreenToggle}
				aria-label="Toggle fullscreen"
				title="Fullscreen"
			>
				{#if isFullscreen}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Settings panel -->
	{#if settingsOpen}
		<div class="settings-panel">
			<!-- Flicker -->
			<div class="setting-row">
				<button class="setting-toggle" class:enabled={flickerEnabled} onclick={onFlickerToggle}>
					<span class="setting-label">Candle Flicker</span>
					<span class="toggle-track"><span class="toggle-thumb"></span></span>
				</button>
				{#if flickerEnabled}
					<input
						type="range"
						min="0"
						max="100"
						value={flickerIntensity}
						oninput={handleFlickerInput}
						class="slider mini"
						aria-label="Flicker intensity"
					/>
				{/if}
			</div>

			<!-- HDR -->
			<div class="setting-row">
				<button
					class="setting-toggle"
					class:enabled={hdrEnabled}
					class:unsupported={!hdrSupported}
					onclick={onHdrToggle}
					disabled={!hdrSupported}
				>
					<span class="setting-label">Wide Color (P3)</span>
					<span class="toggle-track"><span class="toggle-thumb"></span></span>
				</button>
			</div>

			<!-- Always On -->
			<div class="setting-row">
				<button
					class="setting-toggle"
					class:enabled={wakeLockEnabled}
					class:unsupported={!wakeLockSupported}
					onclick={onWakeLockToggle}
					disabled={!wakeLockSupported}
				>
					<span class="setting-label">Always On</span>
					<span class="toggle-track"><span class="toggle-thumb"></span></span>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.control-panel {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		opacity: 0;
		transition: opacity 0.3s ease-out;
		pointer-events: none;
		font-family: 'DM Sans', system-ui, sans-serif;
	}

	.control-panel.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.main-bar {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 20px;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(20px);
		border-radius: 50px;
		box-shadow:
			0 4px 24px rgba(0, 0, 0, 0.12),
			0 1px 2px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.divider {
		width: 1px;
		height: 24px;
		background: rgba(0, 0, 0, 0.08);
	}

	/* Tone swatches */
	.tone-group {
		display: flex;
		gap: 8px;
	}

	.tone-swatch {
		position: relative;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid transparent;
		background: var(--tone);
		cursor: pointer;
		transition: all 0.2s ease-out;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.tone-swatch:hover {
		transform: scale(1.1);
	}

	.tone-swatch.selected {
		border-color: rgba(0, 0, 0, 0.3);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.tone-swatch .check {
		width: 14px;
		height: 14px;
		color: rgba(0, 0, 0, 0.5);
	}

	/* Brightness */
	.brightness-group {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.brightness-group .icon {
		width: 18px;
		height: 18px;
		color: rgba(0, 0, 0, 0.4);
		flex-shrink: 0;
	}

	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100px;
		height: 6px;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 3px;
		outline: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		background: #fff;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		transition: transform 0.15s ease-out;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}

	.slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background: #fff;
		border-radius: 50%;
		cursor: pointer;
		border: none;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
	}

	.slider.mini {
		width: 60px;
	}

	/* Action buttons */
	.action-group {
		display: flex;
		gap: 6px;
	}

	.action-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 50%;
		color: rgba(0, 0, 0, 0.45);
		cursor: pointer;
		transition: all 0.2s ease-out;
	}

	.action-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: rgba(0, 0, 0, 0.7);
	}

	.action-btn.active {
		background: rgba(0, 0, 0, 0.08);
		color: rgba(0, 0, 0, 0.8);
	}

	.action-btn.connected {
		color: #16a34a;
	}

	.action-btn svg {
		width: 20px;
		height: 20px;
	}

	.action-btn .connected-dot {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 6px;
		height: 6px;
		background: #22c55e;
		border-radius: 50%;
	}

	/* Settings panel */
	.settings-panel {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(20px);
		border-radius: 16px;
		box-shadow:
			0 4px 24px rgba(0, 0, 0, 0.12),
			0 1px 2px rgba(0, 0, 0, 0.08);
		min-width: 200px;
	}

	.setting-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 4px;
	}

	.setting-toggle {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		background: transparent;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: background 0.2s ease-out;
	}

	.setting-toggle:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.04);
	}

	.setting-toggle.unsupported {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.setting-label {
		font-size: 14px;
		font-weight: 500;
		color: rgba(0, 0, 0, 0.7);
	}

	.setting-toggle.enabled .setting-label {
		color: #b45309;
	}

	.toggle-track {
		position: relative;
		width: 36px;
		height: 20px;
		background: rgba(0, 0, 0, 0.12);
		border-radius: 10px;
		transition: background 0.2s ease-out;
		flex-shrink: 0;
	}

	.setting-toggle.enabled .toggle-track {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		background: #fff;
		border-radius: 50%;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.setting-toggle.enabled .toggle-thumb {
		transform: translateX(16px);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.control-panel {
			bottom: 16px;
			left: 16px;
			right: 16px;
			transform: none;
		}

		.main-bar {
			width: 100%;
			justify-content: space-between;
			padding: 10px 16px;
		}

		.slider {
			width: 70px;
		}

		.settings-panel {
			width: 100%;
		}
	}
</style>
