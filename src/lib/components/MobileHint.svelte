<script lang="ts">
	import { onMount } from 'svelte';

	const DISMISSED_KEY = 'glow-mobile-hint-dismissed';

	let visible = $state(false);

	function dismiss() {
		visible = false;
		localStorage.setItem(DISMISSED_KEY, 'true');
	}

	onMount(() => {
		const wasDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
		if (!wasDismissed) {
			visible = true;
		}
	});
</script>

{#if visible}
	<button class="hint" onclick={dismiss} aria-label="Dismiss mobile hint">
		<span class="icon">📱</span>
		<span class="text">Connect your phone to control the light</span>
		<span class="close">×</span>
	</button>
{/if}

<style>
	.hint {
		position: fixed;
		bottom: 100px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 24px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 14px;
		color: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		z-index: 50;
		transition: opacity 0.2s, transform 0.2s;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.hint:hover {
		background: rgba(255, 255, 255, 0.18);
	}

	.icon {
		font-size: 16px;
	}

	.text {
		white-space: nowrap;
	}

	.close {
		margin-left: 4px;
		font-size: 18px;
		opacity: 0.6;
	}

	.hint:hover .close {
		opacity: 1;
	}
</style>
