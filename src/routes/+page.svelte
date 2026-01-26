<script lang="ts">
	import { onMount } from 'svelte';
	import { tones, defaultToneId } from '$lib/tones';
	import LightCanvas from '$lib/components/LightCanvas.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import FullscreenPrompt from '$lib/components/FullscreenPrompt.svelte';
	import BrightnessOverlay from '$lib/components/BrightnessOverlay.svelte';
	import QRCodeModal from '$lib/components/QRCodeModal.svelte';
	import { createHost, sendState, disconnect, type LightState } from '$lib/peer';

	const HDR_STORAGE_KEY = 'laptop-light-hdr-enabled';
	const FLICKER_STORAGE_KEY = 'laptop-light-flicker-enabled';
	const FLICKER_INTENSITY_STORAGE_KEY = 'laptop-light-flicker-intensity';
	const WAKE_LOCK_STORAGE_KEY = 'laptop-light-wake-lock-enabled';
	const HIDE_DELAY = 2500;
	const OVERLAY_HIDE_DELAY = 1000;
	const MIN_BRIGHTNESS = 10;
	const MAX_BRIGHTNESS = 100;

	let selectedToneId = $state(defaultToneId);
	let brightness = $state(100);
	let controlsVisible = $state(true);
	let showFullscreenPrompt = $state(false);
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
		resetHideTimer();
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
		}
	}

	async function openQRModal() {
		if (!peerId) {
			peerId = await createHost(handleRemoteState, handleRemoteConnection);
		}
		showQRModal = true;
	}

	function closeQRModal() {
		showQRModal = false;
		if (!remoteConnected) {
			disconnect();
			peerId = '';
		}
	}

	onMount(() => {
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

		showFullscreenPrompt = true;

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
	<title>Laptop Light</title>
	<meta name="description" content="Turn your laptop screen into warm ambient lighting" />
</svelte:head>

<svelte:document onmousemove={handleMouseMove} />

<main ontouchstart={handleTouchStart} onwheel={handleWheel}>
	<LightCanvas
		color={selectedTone.color}
		colorP3={selectedTone.colorP3}
		{brightness}
		{hdrEnabled}
		{flickerEnabled}
		{flickerIntensity}
	/>

	<ControlPanel
		visible={controlsVisible && !showFullscreenPrompt}
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

	<BrightnessOverlay
		value={overlayMode === 'flicker' ? flickerIntensity : brightness}
		visible={overlayVisible}
		label={overlayMode === 'flicker' ? 'Flicker' : undefined}
	/>

	{#if showFullscreenPrompt}
		<FullscreenPrompt ondismiss={dismissPrompt} />
	{/if}

	{#if showQRModal}
		<QRCodeModal {peerId} connected={remoteConnected} onclose={closeQRModal} />
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
</style>
