<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { tones } from '$lib/tones';
	import { connectToHost, sendState, sendMessage, disconnect, type LightState, type PeerMessage } from '$lib/peer';

	const REMOTE_URL_KEY = 'glow-remote-url';
	const HOMESCREEN_HINT_KEY = 'glow-homescreen-hint-dismissed';

	let peerId = $derived($page.url.searchParams.get('peer') ?? '');
	let connected = $state(false);
	let connecting = $state(false);
	let error = $state('');
	let qrModalOpenOnHost = $state(false);
	let showHomescreenHint = $state(false);

	let toneId = $state('amber');
	let brightness = $state(100);
	let hdrEnabled = $state(false);
	let flickerEnabled = $state(false);
	let flickerIntensity = $state(50);

	function isIOS(): boolean {
		if (!browser) return false;
		return /iPad|iPhone|iPod/.test(navigator.userAgent);
	}

	function isInAppBrowser(): boolean {
		if (!browser) return false;
		const ua = navigator.userAgent;
		// iOS in-app browsers (QR scanner, social apps, etc.)
		// Check for standalone mode (PWA) and Safari in user agent
		const isStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
		return isIOS() && !isStandalone && !/Safari/.test(ua);
	}

	function openInSafari() {
		// Use the x-safari URL scheme to open in Safari
		window.location.href = window.location.href;
	}

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
		if (isConnected && browser) {
			// Save current URL for reconnection
			localStorage.setItem(REMOTE_URL_KEY, window.location.href);
		} else if (!isConnected && browser) {
			error = 'Connection lost. Refresh to reconnect.';
		}
	}

	function handleMessage(message: PeerMessage) {
		if (message.type === 'qrModalOpen') {
			qrModalOpenOnHost = message.open;
			// When QR modal closes on host, show homescreen hint if not dismissed
			if (!message.open && !localStorage.getItem(HOMESCREEN_HINT_KEY)) {
				showHomescreenHint = true;
			}
		}
	}

	function hideQROnHost() {
		sendMessage({ type: 'closeQRModal' });
		qrModalOpenOnHost = false; // Dismiss locally immediately
	}

	function dismissHomescreenHint() {
		showHomescreenHint = false;
		localStorage.setItem(HOMESCREEN_HINT_KEY, 'true');
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
		// If no peer ID in URL, check for saved URL
		if (!peerId) {
			const savedUrl = localStorage.getItem(REMOTE_URL_KEY);
			if (savedUrl) {
				goto(savedUrl, { replaceState: true });
				return;
			}
			error = 'No peer ID provided. Scan the QR code again.';
			return;
		}

		connecting = true;
		try {
			await connectToHost(peerId, handleStateUpdate, handleConnectionChange, handleMessage);
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
	<title>Remote Control - Laptop Light</title>
	<meta name="description" content="Control your laptop's ambient lighting from your phone. Adjust brightness, color tones, and flicker effects wirelessly." />
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />

	<!-- Open Graph -->
	<meta property="og:title" content="Laptop Light Remote" />
	<meta property="og:description" content="Control your laptop's ambient lighting from your phone." />
	<meta property="og:image" content="/og-image.png" />

	<!-- Twitter -->
	<meta name="twitter:title" content="Laptop Light Remote" />
	<meta name="twitter:description" content="Control your laptop's ambient lighting from your phone." />
	<meta name="twitter:image" content="/og-image.png" />

	<!-- Prevent indexing of remote control page -->
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main>
	{#if isInAppBrowser()}
		<div class="safari-prompt">
			<p>For the best experience, open in Safari</p>
			<button onclick={openInSafari}>Open in Safari</button>
			<p class="safari-hint">Tap the Safari icon in the bottom-right, or copy the URL</p>
		</div>
	{:else if error}
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

	{#if connected && qrModalOpenOnHost}
		<div class="qr-overlay">
			<div class="qr-overlay-content">
				<span class="check-icon">✓</span>
				<p>Connected!</p>
				<button class="hide-qr-btn" onclick={hideQROnHost}>Hide QR Code</button>
			</div>
		</div>
	{/if}

	{#if showHomescreenHint}
		<div class="homescreen-hint">
			<button class="dismiss-hint" onclick={dismissHomescreenHint} aria-label="Dismiss">×</button>
			<p class="hint-title">Save for quick access</p>
			{#if isIOS()}
				<p class="hint-instruction">Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></p>
			{:else}
				<p class="hint-instruction">Tap <strong>Menu (⋮)</strong> → <strong>Add to Home Screen</strong></p>
			{/if}
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

	.qr-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.85);
		z-index: 100;
	}

	.qr-overlay-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		text-align: center;
	}

	.check-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
		border-radius: 50%;
		font-size: 32px;
		color: white;
	}

	.qr-overlay-content p {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
	}

	.hide-qr-btn {
		padding: 14px 28px;
		background: white;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 500;
		color: #111;
		cursor: pointer;
	}

	.homescreen-hint {
		position: fixed;
		bottom: 24px;
		left: 24px;
		right: 24px;
		padding: 16px 20px;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 16px;
		z-index: 50;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dismiss-hint {
		position: absolute;
		top: 8px;
		right: 12px;
		padding: 4px 8px;
		background: none;
		border: none;
		font-size: 20px;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
	}

	.hint-title {
		margin: 0 0 8px;
		font-size: 15px;
		font-weight: 600;
	}

	.hint-instruction {
		margin: 0;
		font-size: 14px;
		color: rgba(255, 255, 255, 0.7);
	}

	.hint-instruction strong {
		color: #f59e0b;
	}

	.safari-prompt {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 48px 24px;
		text-align: center;
	}

	.safari-prompt p {
		margin: 0;
		font-size: 18px;
		font-weight: 500;
	}

	.safari-prompt button {
		padding: 14px 32px;
		background: linear-gradient(135deg, #007AFF 0%, #0051D4 100%);
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		color: white;
		cursor: pointer;
	}

	.safari-hint {
		font-size: 13px !important;
		font-weight: 400 !important;
		color: rgba(255, 255, 255, 0.5);
	}
</style>
