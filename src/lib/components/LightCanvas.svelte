<script lang="ts">
	interface Props {
		color: string;
		colorP3: string;
		brightness: number;
		hdrEnabled: boolean;
		flickerEnabled?: boolean;
		flickerIntensity?: number;
	}

	let { color, colorP3, brightness, hdrEnabled, flickerEnabled = false, flickerIntensity = 50 }: Props = $props();

	let flickerOffset = $state(0);
	let animationId: number | null = null;

	const activeColor = $derived(hdrEnabled ? colorP3 : color);
	const effectiveOpacity = $derived((brightness / 100) * (1 - flickerOffset));

	function animateFlicker() {
		const time = performance.now() / 1000;
		const scale = flickerIntensity / 100;
		// Layer multiple sine waves for organic candle-like feel
		const wave1 = Math.sin(time * 8) * 0.12 * scale;
		const wave2 = Math.sin(time * 13) * 0.08 * scale;
		const wave3 = Math.sin(time * 23) * 0.05 * scale;
		// Random occasional dip for realistic guttering
		const noise = Math.random() < 0.03 ? Math.random() * 0.15 * scale : 0;
		flickerOffset = Math.max(0, wave1 + wave2 + wave3 + noise);
		animationId = requestAnimationFrame(animateFlicker);
	}

	$effect(() => {
		if (flickerEnabled) {
			animateFlicker();
		} else {
			if (animationId) cancelAnimationFrame(animationId);
			flickerOffset = 0;
		}
		return () => {
			if (animationId) cancelAnimationFrame(animationId);
		};
	});
</script>

<div class="canvas" style:background={activeColor} style:opacity={effectiveOpacity}></div>

<style>
	.canvas {
		position: fixed;
		inset: 0;
		z-index: 0;
	}
</style>
