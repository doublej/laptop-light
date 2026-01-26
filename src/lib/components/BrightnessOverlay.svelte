<script lang="ts">
	interface Props {
		value: number;
		visible: boolean;
		label?: string;
	}

	let { value, visible, label }: Props = $props();

	const isFlicker = $derived(label === 'Flicker');
</script>

<div class="overlay" class:visible class:left={isFlicker}>
	<div class="track">
		<div class="fill" class:flicker={isFlicker} style:height={`${value}%`}></div>
	</div>
	<span class="label" class:flicker={isFlicker}>{label ? `${label} ${value}%` : `${value}%`}</span>
</div>

<style>
	.overlay {
		position: fixed;
		right: 24px;
		top: 50%;
		transform: translateY(-50%) translateX(12px);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		z-index: 100;
		opacity: 0;
		transition:
			opacity 0.2s cubic-bezier(0.4, 0, 1, 1),
			transform 0.2s cubic-bezier(0.4, 0, 1, 1);
		pointer-events: none;
	}

	.overlay.left {
		right: auto;
		left: 24px;
		transform: translateY(-50%) translateX(-12px);
	}

	.overlay.visible {
		opacity: 1;
		transform: translateY(-50%) translateX(0);
		transition:
			opacity 0.25s cubic-bezier(0, 0, 0.2, 1),
			transform 0.25s cubic-bezier(0, 0, 0.2, 1);
	}

	.overlay.left.visible {
		transform: translateY(-50%) translateX(0);
	}

	.track {
		width: 48px;
		height: 200px;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 24px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.fill {
		width: 100%;
		background: rgba(255, 255, 255, 0.4);
		border-radius: 0 0 23px 23px;
		transition: height 0.1s ease-out, background 0.2s ease-out;
	}

	.fill.flicker {
		background: linear-gradient(to top, #ff8c00, #ffb040);
	}

	.label {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.5px;
		color: rgba(255, 255, 255, 0.9);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		transition: color 0.2s ease-out;
	}

	.label.flicker {
		color: #ffb040;
		text-shadow: 0 0 12px rgba(255, 176, 64, 0.6);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.overlay {
			transition-duration: 0.01ms !important;
		}
	}
</style>
