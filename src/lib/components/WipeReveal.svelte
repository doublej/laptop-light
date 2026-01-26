<script lang="ts">
	interface Props {
		active: boolean;
		startRect: DOMRect | null;
		color: string;
		duration?: number;
		oncomplete?: () => void;
	}

	let { active, startRect, color, duration = 700, oncomplete }: Props = $props();

	// Trapezoid ratios matching logo's laptop cutout
	const trapezoid = [
		{ x: 0.16, y: 0.25 }, // top-left
		{ x: 0.44, y: 0.30 }, // top-right
		{ x: 0.45, y: 0.72 }, // bottom-right
		{ x: 0.14, y: 0.76 }  // bottom-left
	];

	// Stagger rates per corner (top corners lead, bottom follow)
	const stagger = [
		[0, 0.6, 0.9, 1],   // top-left
		[0, 0.7, 0.95, 1],  // top-right
		[0, 0.3, 0.7, 1],   // bottom-right
		[0, 0.2, 0.6, 1]    // bottom-left
	];

	const glowColor = '#FFF8E7';
	const finalClip = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';

	function animateWipe(node: HTMLElement) {
		if (!startRect) return;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			node.style.clipPath = finalClip;
			node.style.backgroundColor = color;
			oncomplete?.();
			return;
		}

		const { innerWidth: vw, innerHeight: vh } = window;
		const initial = trapezoid.map(p => ({
			x: startRect.left + p.x * startRect.width,
			y: startRect.top + p.y * startRect.height
		}));
		const final = [{ x: 0, y: 0 }, { x: vw, y: 0 }, { x: vw, y: vh }, { x: 0, y: vh }];

		const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
		const toClip = (points: string[]) => `polygon(${points.join(', ')})`;
		const frameAt = (idx: number) => initial.map((p, i) =>
			`${lerp(p.x, final[i].x, stagger[i][idx])}px ${lerp(p.y, final[i].y, stagger[i][idx])}px`
		);

		const keyframes = [
			{ clipPath: toClip(frameAt(0)), backgroundColor: glowColor, offset: 0 },
			{ clipPath: toClip(frameAt(1)), backgroundColor: glowColor, offset: 0.3 },
			{ clipPath: toClip(frameAt(2)), backgroundColor: color, offset: 0.7 },
			{ clipPath: finalClip, backgroundColor: color, offset: 1 }
		];

		node.animate(keyframes, {
			duration,
			easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
			fill: 'forwards'
		}).onfinish = () => oncomplete?.();
	}
</script>

{#if active && startRect}
	<div use:animateWipe class="wipe-reveal"></div>
{/if}

<style>
	.wipe-reveal {
		position: fixed;
		inset: 0;
		z-index: 150;
		will-change: clip-path;
	}
</style>
