<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';

	interface Props {
		peerId: string;
		connected: boolean;
		onclose: () => void;
	}

	let { peerId, connected, onclose }: Props = $props();

	let canvas: HTMLCanvasElement;
	let remoteUrl = $derived(
		typeof window !== 'undefined'
			? `${window.location.origin}/remote?peer=${peerId}`
			: ''
	);

	onMount(() => {
		if (remoteUrl) {
			QRCode.toCanvas(canvas, remoteUrl, {
				width: 200,
				margin: 2,
				color: { dark: '#1e1e1e', light: '#ffffff' }
			});
		}
	});
</script>

<div class="overlay" onclick={onclose} onkeydown={(e) => e.key === 'Escape' && onclose()} role="presentation">
	<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
		<button class="close-btn" onclick={onclose} aria-label="Close">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6L6 18M6 6l12 12" />
			</svg>
		</button>

		<h2>Remote Control</h2>

		<div class="qr-container">
			<canvas bind:this={canvas}></canvas>
		</div>

		<p class="instruction">Scan with your phone to control the light</p>

		<div class="status" class:connected>
			<span class="dot"></span>
			{connected ? 'Phone connected' : 'Waiting for connection...'}
		</div>

		<p class="url">{remoteUrl}</p>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		z-index: 100;
	}

	.modal {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px;
		background: white;
		border-radius: 24px;
		max-width: 320px;
		text-align: center;
	}

	.close-btn {
		position: absolute;
		top: 12px;
		right: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: rgba(30, 30, 30, 0.06);
		border: none;
		border-radius: 50%;
		color: rgba(30, 30, 30, 0.5);
		cursor: pointer;
		transition: all 0.2s ease-out;
	}

	.close-btn:hover {
		background: rgba(30, 30, 30, 0.1);
		color: rgba(30, 30, 30, 0.8);
	}

	.close-btn svg {
		width: 16px;
		height: 16px;
	}

	h2 {
		margin: 0 0 24px;
		font-size: 20px;
		font-weight: 600;
		color: #1e1e1e;
	}

	.qr-container {
		padding: 16px;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	.qr-container canvas {
		display: block;
	}

	.instruction {
		margin: 20px 0 16px;
		font-size: 14px;
		color: rgba(30, 30, 30, 0.6);
	}

	.status {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: rgba(30, 30, 30, 0.05);
		border-radius: 20px;
		font-size: 13px;
		color: rgba(30, 30, 30, 0.6);
	}

	.status.connected {
		background: rgba(34, 197, 94, 0.1);
		color: #16a34a;
	}

	.dot {
		width: 8px;
		height: 8px;
		background: rgba(30, 30, 30, 0.3);
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}

	.status.connected .dot {
		background: #22c55e;
		animation: none;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 1; }
	}

	.url {
		margin: 16px 0 0;
		font-size: 11px;
		color: rgba(30, 30, 30, 0.4);
		word-break: break-all;
	}
</style>
