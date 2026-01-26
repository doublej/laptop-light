<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { tones } from '$lib/tones';
	import { connectToHost, sendState, disconnect, type LightState } from '$lib/peer';

	let peerId = $derived($page.url.searchParams.get('peer') ?? '');
	let connected = $state(false);
	let connecting = $state(false);
	let error = $state('');

	let toneId = $state('amber');
	let brightness = $state(100);
	let hdrEnabled = $state(false);
	let flickerEnabled = $state(false);
	let flickerIntensity = $state(50);

	function handleStateUpdate(state: LightState) {
		toneId = state.toneId;
		brightness = state.brightness;
		hdrEnabled = state.hdrEnabled;
		flickerEnabled = state.flickerEnabled;
		flickerIntensity = state.flickerIntensity;
	}

	function handleConnectionChange(isConnected: boolean) {
		connected = isConnected;
		connecting = false;
		if (!isConnected && browser) {
			error = 'Connection lost. Refresh to reconnect.';
		}
	}

	function sendCurrentState() {
		sendState({
			toneId,
			brightness,
			hdrEnabled,
			flickerEnabled,
			flickerIntensity
		});
	}

	function selectTone(id: string) {
		toneId = id;
		sendCurrentState();
	}

	function updateBrightness(e: Event) {
		brightness = Number((e.target as HTMLInputElement).value);
		sendCurrentState();
	}

	function updateFlickerIntensity(e: Event) {
		flickerIntensity = Number((e.target as HTMLInputElement).value);
		sendCurrentState();
	}

	function toggleHdr() {
		hdrEnabled = !hdrEnabled;
		sendCurrentState();
	}

	function toggleFlicker() {
		flickerEnabled = !flickerEnabled;
		sendCurrentState();
	}

	onMount(async () => {
		if (!peerId) {
			error = 'No peer ID provided. Scan the QR code again.';
			return;
		}

		connecting = true;
		try {
			await connectToHost(peerId, handleStateUpdate, handleConnectionChange);
		} catch (err) {
			error = 'Failed to connect. Make sure the laptop app is running.';
			connecting = false;
		}
	});

	onDestroy(() => {
		disconnect();
	});
</script>

<svelte:head>
	<title>Laptop Light Remote</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
</svelte:head>

<main>
	{#if error}
		<div class="status-card error">
			<p>{error}</p>
			<button onclick={() => window.location.reload()}>Retry</button>
		</div>
	{:else if connecting}
		<div class="status-card">
			<div class="spinner"></div>
			<p>Connecting to laptop...</p>
		</div>
	{:else if connected}
		<header>
			<h1>Laptop Light</h1>
			<span class="connected-badge">Connected</span>
		</header>

		<section class="control-group">
			<span class="section-label">Color Tone</span>
			<div class="tone-grid" role="group" aria-label="Color tone selection">
				{#each tones as tone}
					<button
						class="tone-btn"
						class:selected={toneId === tone.id}
						style="--tone-color: {tone.color}"
						onclick={() => selectTone(tone.id)}
					>
						<span class="swatch"></span>
						<span class="name">{tone.name}</span>
					</button>
				{/each}
			</div>
		</section>

		<section class="control-group">
			<div class="slider-header">
				<span class="label-text">Brightness</span>
				<span class="value">{brightness}%</span>
			</div>
			<input
				type="range"
				min="10"
				max="100"
				value={brightness}
				oninput={updateBrightness}
				aria-label="Brightness"
			/>
		</section>

		<section class="control-group">
			<div class="toggle-row">
				<span class="label-text">Flicker Effect</span>
				<button class="toggle" class:enabled={flickerEnabled} onclick={toggleFlicker} aria-label={flickerEnabled ? 'Disable flicker' : 'Enable flicker'}>
					<span class="track"><span class="thumb"></span></span>
				</button>
			</div>
			{#if flickerEnabled}
				<div class="slider-header sub">
					<span class="label-text">Intensity</span>
					<span class="value">{flickerIntensity}%</span>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					value={flickerIntensity}
					oninput={updateFlickerIntensity}
					aria-label="Flicker intensity"
				/>
			{/if}
		</section>

		<section class="control-group">
			<div class="toggle-row">
				<span class="label-text">HDR Mode</span>
				<button class="toggle" class:enabled={hdrEnabled} onclick={toggleHdr} aria-label={hdrEnabled ? 'Disable HDR' : 'Enable HDR'}>
					<span class="track"><span class="thumb"></span></span>
				</button>
			</div>
		</section>
	{:else}
		<div class="status-card">
			<p>Waiting for connection...</p>
		</div>
	{/if}
</main>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #111;
		color: #fff;
		min-height: 100dvh;
	}

	main {
		padding: 24px;
		max-width: 400px;
		margin: 0 auto;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 32px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
	}

	.connected-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: rgba(34, 197, 94, 0.15);
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
		color: #22c55e;
	}

	.connected-badge::before {
		content: '';
		width: 6px;
		height: 6px;
		background: #22c55e;
		border-radius: 50%;
	}

	.status-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		padding: 48px 24px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 16px;
		text-align: center;
	}

	.status-card.error {
		background: rgba(239, 68, 68, 0.1);
		color: #f87171;
	}

	.status-card button {
		padding: 10px 20px;
		background: #fff;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		color: #111;
		cursor: pointer;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-top-color: #f59e0b;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.control-group {
		margin-bottom: 28px;
	}

	.section-label,
	.label-text {
		font-size: 14px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
	}

	.section-label {
		display: block;
		margin-bottom: 12px;
	}

	.slider-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.slider-header.sub {
		margin: 16px 0 8px;
	}

	.slider-header.sub .label-text {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.5);
	}

	.value {
		color: #f59e0b;
	}

	.tone-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.tone-btn {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid transparent;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease-out;
	}

	.tone-btn.selected {
		background: rgba(255, 255, 255, 0.1);
		border-color: var(--tone-color);
	}

	.tone-btn .swatch {
		width: 24px;
		height: 24px;
		background: var(--tone-color);
		border-radius: 50%;
	}

	.tone-btn .name {
		font-size: 14px;
		color: #fff;
	}

	input[type="range"] {
		width: 100%;
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		appearance: none;
		cursor: pointer;
	}

	input[type="range"]::-webkit-slider-thumb {
		width: 24px;
		height: 24px;
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		border: none;
		border-radius: 50%;
		appearance: none;
		box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.toggle {
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
	}

	.toggle .track {
		display: block;
		position: relative;
		width: 44px;
		height: 24px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		transition: background 0.2s ease-out;
	}

	.toggle.enabled .track {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	.toggle .thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 18px;
		height: 18px;
		background: #fff;
		border-radius: 50%;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.toggle.enabled .thumb {
		transform: translateX(20px);
	}
</style>
