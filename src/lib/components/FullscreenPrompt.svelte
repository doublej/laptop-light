<script lang="ts">
	import { onMount } from 'svelte';
	import GlowLogo from './GlowLogo.svelte';

	interface Props {
		ondismiss: () => void;
	}

	let { ondismiss }: Props = $props();
	let mounted = $state(false);
	let exiting = $state(false);

	function exit(callback: () => void) {
		exiting = true;
		setTimeout(callback, 400);
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

	onMount(() => {
		requestAnimationFrame(() => {
			mounted = true;
		});
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="overlay" class:mounted class:exiting role="dialog" aria-modal="true">
	<div class="cloud-layer"></div>
	<div class="prompt">
		<GlowLogo size={220} />
		<p>Turn your screen into warm ambient lighting</p>
		<p class="hint">
			For when you find yourself without any soft light.
		</p>
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

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Space Grotesk', system-ui, sans-serif;
	}

	.cloud-layer {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(
				ellipse 100% 80% at 50% 50%,
				rgba(255, 255, 255, 0.98) 0%,
				rgba(255, 255, 255, 0.9) 30%,
				rgba(255, 255, 255, 0.6) 60%,
				rgba(255, 255, 255, 0) 100%
			),
			radial-gradient(
				ellipse 60% 50% at 30% 40%,
				rgba(255, 200, 150, 0.2) 0%,
				transparent 70%
			),
			radial-gradient(
				ellipse 60% 50% at 70% 60%,
				rgba(255, 180, 200, 0.15) 0%,
				transparent 70%
			);
		opacity: 0;
		transition: opacity 0.5s cubic-bezier(0, 0, 0.2, 1);
	}

	.overlay.mounted .cloud-layer {
		opacity: 1;
	}

	.overlay.exiting .cloud-layer {
		opacity: 0;
		transition: opacity 0.4s cubic-bezier(0.4, 0, 1, 1);
	}

	.prompt {
		position: relative;
		text-align: center;
		padding: 40px 48px;
		max-width: 360px;
		z-index: 1;
		opacity: 0;
		transform: translateY(20px) scale(0.96);
		transition:
			opacity 0.5s cubic-bezier(0, 0, 0.2, 1),
			transform 0.5s cubic-bezier(0, 0, 0.2, 1);
		transition-delay: 0.1s;
	}

	.overlay.mounted .prompt {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.overlay.exiting .prompt {
		opacity: 0;
		transform: translateY(-10px) scale(0.98);
		transition:
			opacity 0.3s cubic-bezier(0.4, 0, 1, 1),
			transform 0.3s cubic-bezier(0.4, 0, 1, 1);
		transition-delay: 0s;
	}

	p {
		margin: 12px 0 32px;
		color: rgba(30, 30, 30, 0.6);
		font-size: 1rem;
		letter-spacing: -0.01em;
	}

	.hint {
		margin: -16px 0 28px;
		font-size: 0.75rem;
		color: rgba(30, 30, 30, 0.4);
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
		color: rgba(30, 30, 30, 0.6);
		border: 1px solid rgba(30, 30, 30, 0.15);
	}

	.secondary:hover {
		background: rgba(30, 30, 30, 0.05);
		color: rgba(30, 30, 30, 0.8);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.cloud-layer,
		.prompt {
			transition-duration: 0.01ms !important;
			transition-delay: 0s !important;
		}
	}
</style>
