<script lang="ts">
	import { onMount } from 'svelte';
	import { tones, defaultToneId } from '$lib/tones';
	import LightCanvas from '$lib/components/LightCanvas.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import FullscreenPrompt from '$lib/components/FullscreenPrompt.svelte';
	import BrightnessOverlay from '$lib/components/BrightnessOverlay.svelte';
	import QRCodeModal from '$lib/components/QRCodeModal.svelte';
	import { createHost, sendState, sendMessage, disconnect, type LightState, type PeerMessage } from '$lib/peer';
	import MobileHint from '$lib/components/MobileHint.svelte';

	const HDR_STORAGE_KEY = 'laptop-light-hdr-enabled';
	const FLICKER_STORAGE_KEY = 'laptop-light-flicker-enabled';
	const FLICKER_INTENSITY_STORAGE_KEY = 'laptop-light-flicker-intensity';
	const WAKE_LOCK_STORAGE_KEY = 'laptop-light-wake-lock-enabled';
	const REMOTE_URL_KEY = 'glow-remote-url';
	const HIDE_DELAY = 2500;
	const OVERLAY_HIDE_DELAY = 1000;
	const MIN_BRIGHTNESS = 10;
	const MAX_BRIGHTNESS = 100;

	let selectedToneId = $state(defaultToneId);
	let brightness = $state(100);
	let controlsVisible = $state(true);
	let showFullscreenPrompt = $state(true);
	let isFullscreen = $state(false);
	let hdrEnabled = $state(false);
	let hdrSupported = $state(false);
	let flickerEnabled = $state(false);
	let flickerIntensity = $state(50);
	let overlayVisible = $state(false);
	let overlayMode: 'brightness' | 'flicker' = $state('brightness');
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;
	let overlayTimeout: ReturnType<typeof setTimeout> | null = null;

	// Wake Lock
	let wakeLockEnabled = $state(false);
	let wakeLockSupported = $state(false);
	let wakeLockSentinel: WakeLockSentinel | null = null;

	// Remote Control
	let showQRModal = $state(false);
	let peerId = $state('');
	let remoteConnected = $state(false);

	// Mobile detection
	let isMobile = $state(false);
	let showMobileWarning = $state(false);

	// Intro transition state
	let introExiting = $state(false);

	const selectedTone = $derived(tones.find((t) => t.id === selectedToneId) ?? tones[0]);

	function resetHideTimer() {
		controlsVisible = true;
		if (hideTimeout) clearTimeout(hideTimeout);
		hideTimeout = setTimeout(() => {
			controlsVisible = false;
		}, HIDE_DELAY);
	}

	function handleMouseMove() {
		resetHideTimer();
	}

	function handleTouchStart() {
		controlsVisible = !controlsVisible;
		if (controlsVisible) resetHideTimer();
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? -5 : 5;
		const isLeftHalf = e.clientX < window.innerWidth / 2;

		if (isLeftHalf && flickerEnabled) {
			flickerIntensity = Math.max(0, Math.min(100, flickerIntensity + delta));
			localStorage.setItem(FLICKER_INTENSITY_STORAGE_KEY, String(flickerIntensity));
			overlayMode = 'flicker';
		} else {
			brightness = Math.max(MIN_BRIGHTNESS, Math.min(MAX_BRIGHTNESS, brightness + delta));
			overlayMode = 'brightness';
		}

		overlayVisible = true;
		if (overlayTimeout) clearTimeout(overlayTimeout);
		overlayTimeout = setTimeout(() => {
			overlayVisible = false;
		}, OVERLAY_HIDE_DELAY);
	}

	function handleFullscreenChange() {
		isFullscreen = !!document.fullscreenElement;

		// Auto-enable wake lock when entering fullscreen
		if (isFullscreen && wakeLockSupported && !wakeLockEnabled) {
			wakeLockEnabled = true;
			localStorage.setItem(WAKE_LOCK_STORAGE_KEY, 'true');
			requestWakeLock();
		}
	}

	function toggleFullscreen() {
		if (document.fullscreenElement) {
			document.exitFullscreen?.();
		} else {
			document.documentElement.requestFullscreen?.();
		}
	}

	function dismissPrompt() {
		showFullscreenPrompt = false;
		introExiting = false;
		resetHideTimer();
	}

	function handleIntroExitStart() {
		introExiting = true;
	}

	function toggleHdr() {
		hdrEnabled = !hdrEnabled;
		localStorage.setItem(HDR_STORAGE_KEY, hdrEnabled ? 'true' : 'false');
	}

	function toggleFlicker() {
		flickerEnabled = !flickerEnabled;
		localStorage.setItem(FLICKER_STORAGE_KEY, flickerEnabled ? 'true' : 'false');
	}

	// Wake Lock functions
	async function requestWakeLock() {
		try {
			wakeLockSentinel = await navigator.wakeLock.request('screen');
			wakeLockSentinel.addEventListener('release', () => {
				wakeLockSentinel = null;
			});
		} catch {
			// Wake lock request failed (e.g., low battery)
		}
	}

	async function releaseWakeLock() {
		await wakeLockSentinel?.release();
		wakeLockSentinel = null;
	}

	async function toggleWakeLock() {
		wakeLockEnabled = !wakeLockEnabled;
		localStorage.setItem(WAKE_LOCK_STORAGE_KEY, wakeLockEnabled ? 'true' : 'false');

		if (wakeLockEnabled) {
			await requestWakeLock();
		} else {
			await releaseWakeLock();
		}
	}

	function handleVisibilityChange() {
		if (wakeLockEnabled && document.visibilityState === 'visible' && !wakeLockSentinel) {
			requestWakeLock();
		}
	}

	// Remote Control functions
	function getCurrentState(): LightState {
		return {
			toneId: selectedToneId,
			brightness,
			hdrEnabled,
			flickerEnabled,
			flickerIntensity
		};
	}

	function handleRemoteState(state: LightState) {
		selectedToneId = state.toneId;
		brightness = state.brightness;
		hdrEnabled = state.hdrEnabled;
		flickerEnabled = state.flickerEnabled;
		flickerIntensity = state.flickerIntensity;

		localStorage.setItem(HDR_STORAGE_KEY, hdrEnabled ? 'true' : 'false');
		localStorage.setItem(FLICKER_STORAGE_KEY, flickerEnabled ? 'true' : 'false');
		localStorage.setItem(FLICKER_INTENSITY_STORAGE_KEY, String(flickerIntensity));
	}

	function handleRemoteConnection(connected: boolean) {
		remoteConnected = connected;
		if (connected) {
			sendState(getCurrentState());
			// Save remote URL for reconnection
			const remoteUrl = `${window.location.origin}/remote?peer=${peerId}`;
			localStorage.setItem(REMOTE_URL_KEY, remoteUrl);
			// Notify remote about current QR modal state
			sendMessage({ type: 'qrModalOpen', open: showQRModal });
		}
	}

	function handleRemoteMessage(message: PeerMessage) {
		if (message.type === 'closeQRModal') {
			showQRModal = false;
		}
	}

	async function openQRModal() {
		if (!peerId) {
			peerId = await createHost(handleRemoteState, handleRemoteConnection, handleRemoteMessage);
		}
		showQRModal = true;
		if (remoteConnected) {
			sendMessage({ type: 'qrModalOpen', open: true });
		}
	}

	function closeQRModal() {
		showQRModal = false;
		if (remoteConnected) {
			sendMessage({ type: 'qrModalOpen', open: false });
		} else {
			disconnect();
			peerId = '';
		}
	}

	function dismissMobileWarning() {
		showMobileWarning = false;
		showFullscreenPrompt = true;
	}

	onMount(() => {
		// Detect mobile device
		isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
		if (isMobile) {
			showMobileWarning = true;
		}

		// Detect Display-P3 support
		hdrSupported = window.matchMedia('(color-gamut: p3)').matches;

		// Detect Wake Lock support
		wakeLockSupported = 'wakeLock' in navigator;

		// Load saved HDR preference (default to on if supported)
		const savedHdr = localStorage.getItem(HDR_STORAGE_KEY);
		if (savedHdr !== null) {
			hdrEnabled = savedHdr === 'true';
		} else {
			hdrEnabled = hdrSupported;
		}

		// Load saved flicker preference
		const savedFlicker = localStorage.getItem(FLICKER_STORAGE_KEY);
		flickerEnabled = savedFlicker === 'true';

		// Load saved flicker intensity
		const savedFlickerIntensity = localStorage.getItem(FLICKER_INTENSITY_STORAGE_KEY);
		if (savedFlickerIntensity !== null) {
			flickerIntensity = Number(savedFlickerIntensity);
		}

		// Load saved wake lock preference
		const savedWakeLock = localStorage.getItem(WAKE_LOCK_STORAGE_KEY);
		if (savedWakeLock === 'true' && wakeLockSupported) {
			wakeLockEnabled = true;
			requestWakeLock();
		}

		// Hide fullscreen prompt on mobile (shows mobile warning instead)
		if (isMobile) {
			showFullscreenPrompt = false;
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		handleFullscreenChange();

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			if (hideTimeout) clearTimeout(hideTimeout);
			if (overlayTimeout) clearTimeout(overlayTimeout);
			releaseWakeLock();
			disconnect();
		};
	});
</script>

<svelte:head>
	<title>Laptop Light - Ambient Screen Lighting</title>
	<meta name="description" content="Turn your laptop screen into warm ambient lighting. Choose from amber, candlelight, sunset, and soft pink tones. Control brightness and flicker from your phone." />

	<!-- Open Graph -->
	<meta property="og:title" content="Laptop Light - Ambient Screen Lighting" />
	<meta property="og:description" content="Turn your laptop screen into warm ambient lighting. Control from your phone via WebRTC." />
	<meta property="og:url" content="/" />

	<!-- Twitter -->
	<meta name="twitter:title" content="Laptop Light - Ambient Screen Lighting" />
	<meta name="twitter:description" content="Turn your laptop screen into warm ambient lighting. Control from your phone." />

	<!-- Additional SEO -->
	<meta name="keywords" content="ambient lighting, screen light, laptop light, warm light, candlelight effect, HDR display, remote control, WebRTC" />
	<link rel="canonical" href="/" />
</svelte:head>

<svelte:document onmousemove={handleMouseMove} />

<main ontouchstart={handleTouchStart} onwheel={handleWheel} ondblclick={toggleFullscreen}>
	<LightCanvas
		color={selectedTone.color}
		colorP3={selectedTone.colorP3}
		{brightness}
		{hdrEnabled}
		{flickerEnabled}
		{flickerIntensity}
	/>

	<ControlPanel
		visible={controlsVisible && (!showFullscreenPrompt || introExiting)}
		delayEntrance={introExiting}
		{tones}
		selectedToneId={selectedToneId}
		{brightness}
		{flickerEnabled}
		{flickerIntensity}
		{hdrEnabled}
		{hdrSupported}
		{wakeLockEnabled}
		{wakeLockSupported}
		{isFullscreen}
		{remoteConnected}
		onToneSelect={(id) => (selectedToneId = id)}
		onBrightnessChange={(v) => (brightness = v)}
		onFlickerToggle={toggleFlicker}
		onFlickerIntensityChange={(v) => {
			flickerIntensity = v;
			localStorage.setItem(FLICKER_INTENSITY_STORAGE_KEY, String(v));
		}}
		onHdrToggle={toggleHdr}
		onWakeLockToggle={toggleWakeLock}
		onFullscreenToggle={toggleFullscreen}
		onQROpen={openQRModal}
	/>

	{#if controlsVisible && !showFullscreenPrompt && !remoteConnected}
		<MobileHint />
	{/if}

	<BrightnessOverlay
		value={overlayMode === 'flicker' ? flickerIntensity : brightness}
		visible={overlayVisible}
		label={overlayMode === 'flicker' ? 'Flicker' : undefined}
	/>

	{#if showFullscreenPrompt}
		<FullscreenPrompt ondismiss={dismissPrompt} onexitstart={handleIntroExitStart} />
	{/if}

	{#if showQRModal}
		<QRCodeModal {peerId} connected={remoteConnected} onclose={closeQRModal} />
	{/if}

	{#if showMobileWarning}
		<div class="mobile-warning mounted">
			<div class="mobile-warning-content">
				<div class="laptop-icon">💻</div>
				<h2>Open on Your Laptop</h2>
				<p>This app turns your laptop screen into ambient lighting. Open this page on your laptop, then use your phone as a remote control.</p>
				<div class="mobile-warning-buttons">
					<button class="continue-btn" onclick={dismissMobileWarning}>
						Continue Anyway
					</button>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		background: #000;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	main {
		position: fixed;
		inset: 0;
		touch-action: manipulation;
	}

	.mobile-warning {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
		opacity: 0;
		transition: opacity 0.4s cubic-bezier(0, 0, 0.2, 1);
	}

	.mobile-warning.mounted {
		opacity: 1;
	}

	.mobile-warning-content {
		text-align: center;
		max-width: 320px;
		opacity: 0;
		transform: translateY(16px);
		transition:
			opacity 0.4s cubic-bezier(0, 0, 0.2, 1),
			transform 0.4s cubic-bezier(0, 0, 0.2, 1);
		transition-delay: 0.1s;
	}

	.mobile-warning.mounted .mobile-warning-content {
		opacity: 1;
		transform: translateY(0);
	}

	.laptop-icon {
		font-size: 64px;
		margin-bottom: 24px;
		opacity: 0;
		transform: scale(0.8);
		transition:
			opacity 0.5s cubic-bezier(0, 0, 0.2, 1),
			transform 0.5s cubic-bezier(0, 0, 0.2, 1);
		transition-delay: 0.2s;
	}

	.mobile-warning.mounted .laptop-icon {
		opacity: 1;
		transform: scale(1);
	}

	.mobile-warning h2 {
		margin: 0 0 16px;
		font-size: 24px;
		font-weight: 600;
		color: #fff;
	}

	.mobile-warning p {
		margin: 0 0 32px;
		font-size: 15px;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.7);
	}

	.mobile-warning-buttons {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.continue-btn {
		padding: 14px 28px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		font-size: 15px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition:
			background 0.2s cubic-bezier(0, 0, 0.2, 1),
			color 0.2s cubic-bezier(0, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0, 0, 0.2, 1);
	}

	.continue-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	.continue-btn:active {
		transform: scale(0.98);
		transition-duration: 0.1s;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.mobile-warning,
		.mobile-warning-content,
		.laptop-icon,
		.continue-btn {
			transition-duration: 0.01ms !important;
			transition-delay: 0s !important;
		}
	}
</style>
