<script lang="ts">
	import GlowLogo from './GlowLogo.svelte';

	interface Props {
		ondismiss: () => void;
		onexitstart?: () => void;
	}

	let { ondismiss, onexitstart }: Props = $props();
	let exiting = $state(false);

	function exit(callback: () => void) {
		exiting = true;
		onexitstart?.();
		setTimeout(callback, 600);
	}

	function handleEnterFullscreen() {
		exit(() => {
			document.documentElement.requestFullscreen?.();
			ondismiss();
		});
	}

	function handleDismiss() {
		exit(ondismiss);
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="overlay" class:exiting role="dialog" aria-modal="true">
	<!-- Layers from back to front -->
	<div class="orange-layer"></div>
	<div class="dark-layer"></div>
	<svg class="glow-layer" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
		<defs>
			<filter id="glow-noise" x="-20%" y="-20%" width="140%" height="140%">
				<!-- Fine grain noise, grayscale only -->
				<feTurbulence type="fractalNoise" baseFrequency="2.5" numOctaves="3" result="noise" />
				<!-- Extract just luminance to avoid color -->
				<feColorMatrix type="matrix" values="0 0 0 0 1
				                                     0 0 0 0 1
				                                     0 0 0 0 1
				                                     0.3 0.3 0.3 0 0" result="grain" />
				<!-- Subtle displacement for organic edge -->
				<feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
			</filter>
			<radialGradient id="glow-gradient" cx="50%" cy="45%" r="50%">
				<stop offset="0%" stop-color="white" stop-opacity="0.9" />
				<stop offset="35%" stop-color="white" stop-opacity="0.45" />
				<stop offset="65%" stop-color="white" stop-opacity="0.1" />
				<stop offset="100%" stop-color="white" stop-opacity="0" />
			</radialGradient>
		</defs>
		<ellipse cx="50" cy="45" rx="50" ry="38" fill="url(#glow-gradient)" filter="url(#glow-noise)" />
	</svg>

	<div class="prompt">
		<div class="logo-container">
			<GlowLogo size={300} />
		</div>
		<div class="content">
			<p>Turn your screen into warm ambient lighting</p>
			<p class="hint">For when you find yourself without any soft light.</p>
			<div class="buttons">
				<button class="primary" onclick={handleEnterFullscreen}>
					Enter Fullscreen
				</button>
				<button class="secondary" onclick={handleDismiss}>
					Skip
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Space Grotesk', system-ui, sans-serif;
		background: #0a0a0a;
	}

	/* Orange background - always there, revealed when dark fades */
	.orange-layer {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
	}

	/* Dark layer - covers orange, fades out to reveal it */
	.dark-layer {
		position: absolute;
		inset: 0;
		background: #0a0a0a;
		animation: darkFadeOut 1.2s cubic-bezier(0, 0, 0.2, 1) 1.6s forwards;
	}

	@keyframes darkFadeOut {
		from { opacity: 1; }
		to { opacity: 0; }
	}

	/* White glow behind logo - SVG with noise texture */
	.glow-layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		animation: glowIn 1s cubic-bezier(0, 0, 0.2, 1) 2.4s forwards;
	}

	@keyframes glowIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.prompt {
		position: relative;
		text-align: center;
		padding: 40px 48px;
		max-width: 360px;
		z-index: 1;
	}

	/* Logo container */
	.logo-container {
		opacity: 1;
	}

	/* Target the emblem (mark) inside GlowLogo - fades in first */
	.logo-container :global(.mark) {
		opacity: 0;
		animation: emblemIn 1.2s cubic-bezier(0, 0, 0.2, 1) 0.3s forwards;
	}

	@keyframes emblemIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Target the text inside GlowLogo - fades in after emblem */
	.logo-container :global(.logo-text) {
		opacity: 0;
		animation: textIn 0.8s cubic-bezier(0, 0, 0.2, 1) 1.1s forwards;
	}

	@keyframes textIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Content fades in last */
	.content {
		opacity: 0;
		transform: translateY(16px);
		animation: contentIn 0.7s cubic-bezier(0, 0, 0.2, 1) 3s forwards;
	}

	@keyframes contentIn {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* === EXIT ANIMATIONS === */
	.overlay.exiting .dark-layer {
		animation: none;
		opacity: 0;
	}

	.overlay.exiting .glow-layer {
		animation: glowOut 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
	}

	@keyframes glowOut {
		from { opacity: 1; }
		to { opacity: 0; }
	}

	.overlay.exiting .logo-container :global(.mark) {
		animation: emblemOut 0.5s cubic-bezier(0.4, 0, 1, 1) forwards;
	}

	@keyframes emblemOut {
		from { opacity: 1; }
		to { opacity: 0; }
	}

	.overlay.exiting .logo-container :global(.logo-text) {
		animation: textOut 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
	}

	@keyframes textOut {
		from { opacity: 1; }
		to { opacity: 0; }
	}

	.overlay.exiting .content {
		animation: contentOut 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
	}

	@keyframes contentOut {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(-12px);
		}
	}

	/* === TYPOGRAPHY & BUTTONS === */
	p {
		margin: 12px 0 32px;
		color: rgba(10, 5, 0, 0.92);
		font-size: 1.125rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.25),
			0 2px 4px rgba(180, 80, 0, 0.15);
	}

	.hint {
		margin: -16px 0 28px;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(10, 5, 0, 0.75);
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.2),
			0 1px 3px rgba(180, 80, 0, 0.1);
	}

	.buttons {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	button {
		padding: 14px 28px;
		border-radius: 14px;
		font-family: 'Space Grotesk', system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		cursor: pointer;
		transition:
			transform 0.2s cubic-bezier(0, 0, 0.2, 1),
			box-shadow 0.2s cubic-bezier(0, 0, 0.2, 1),
			background 0.2s cubic-bezier(0, 0, 0.2, 1);
	}

	button:hover {
		transform: translateY(-1px);
	}

	button:active {
		transform: translateY(0);
		transition-duration: 0.1s;
	}

	.primary {
		background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
		color: white;
		border: none;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.primary:hover {
		box-shadow:
			0 6px 20px rgba(0, 0, 0, 0.2),
			0 2px 6px rgba(0, 0, 0, 0.1);
	}

	.secondary {
		background: transparent;
		color: rgba(30, 30, 30, 0.7);
		border: 1px solid rgba(30, 30, 30, 0.2);
	}

	.secondary:hover {
		background: rgba(30, 30, 30, 0.05);
		color: rgba(30, 30, 30, 0.9);
	}

	/* === REDUCED MOTION === */
	@media (prefers-reduced-motion: reduce) {
		.dark-layer,
		.glow-layer,
		.content {
			animation: none !important;
			opacity: 1 !important;
			transform: none !important;
		}

		.dark-layer {
			opacity: 0 !important;
		}

		.logo-container :global(.mark),
		.logo-container :global(.logo-text) {
			animation: none !important;
			opacity: 1 !important;
		}
	}
</style>
