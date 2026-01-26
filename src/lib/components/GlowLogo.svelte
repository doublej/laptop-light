<script lang="ts">
	let { size = 200 }: { size?: number } = $props();

	const scale = size / 200;
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="logo-container" style:--scale={scale}>
	<svg
		width={size}
		height={size * 0.5}
		viewBox="0 0 200 100"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-label="Glow logo"
		role="img"
	>
		<defs>
			<!-- Radial gradients for luminous effect -->
			<radialGradient id="glow-amber" cx="50%" cy="50%" r="50%">
				<stop offset="0%" stop-color="#FFB547" stop-opacity="0.95" />
				<stop offset="70%" stop-color="#FF8A00" stop-opacity="0.6" />
				<stop offset="100%" stop-color="#FF6B00" stop-opacity="0" />
			</radialGradient>

			<radialGradient id="glow-rose" cx="50%" cy="50%" r="50%">
				<stop offset="0%" stop-color="#FF7EB3" stop-opacity="0.85" />
				<stop offset="60%" stop-color="#FF5E99" stop-opacity="0.5" />
				<stop offset="100%" stop-color="#FF3D7F" stop-opacity="0" />
			</radialGradient>

			<radialGradient id="glow-cream" cx="50%" cy="50%" r="50%">
				<stop offset="0%" stop-color="#FFF8E7" stop-opacity="0.9" />
				<stop offset="50%" stop-color="#FFE4B8" stop-opacity="0.6" />
				<stop offset="100%" stop-color="#FFD699" stop-opacity="0" />
			</radialGradient>

			<!-- Blur filter for glow effect -->
			<filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
			</filter>

			<filter id="outer-glow" x="-100%" y="-100%" width="300%" height="300%">
				<feGaussianBlur in="SourceGraphic" stdDeviation="6" />
			</filter>
		</defs>

		<!-- Abstract mark: overlapping luminous orbs -->
		<g class="mark" transform="translate(20, 10)">
			<!-- Outer glow layer -->
			<g filter="url(#outer-glow)" opacity="0.4">
				<circle cx="40" cy="40" r="32" fill="url(#glow-amber)" />
				<circle cx="60" cy="38" r="28" fill="url(#glow-rose)" />
				<circle cx="50" cy="50" r="24" fill="url(#glow-cream)" />
			</g>

			<!-- Main orbs with soft edges -->
			<g filter="url(#soft-glow)">
				<circle cx="40" cy="40" r="28" fill="url(#glow-amber)" class="orb orb-1" />
				<circle cx="58" cy="36" r="22" fill="url(#glow-rose)" class="orb orb-2" />
				<circle cx="48" cy="48" r="18" fill="url(#glow-cream)" class="orb orb-3" />
			</g>

			<!-- Bright core -->
			<circle cx="48" cy="42" r="8" fill="#FFFAF0" opacity="0.9" class="core" />
			<circle cx="48" cy="42" r="4" fill="#FFFFFF" class="core-inner" />
		</g>

		<!-- Typography -->
		<text x="105" y="62" class="logo-text" fill="#1A1A1A">glow</text>
	</svg>
</div>

<style>
	.logo-container {
		display: inline-block;
	}

	.logo-text {
		font-family: 'Space Grotesk', system-ui, sans-serif;
		font-size: 38px;
		font-weight: 500;
		letter-spacing: -0.02em;
	}

	/* Subtle breathing animation for the orbs */
	.orb {
		transform-origin: center;
		animation: breathe 4s ease-in-out infinite;
	}

	.orb-1 {
		animation-delay: 0s;
	}

	.orb-2 {
		animation-delay: -1.3s;
	}

	.orb-3 {
		animation-delay: -2.6s;
	}

	.core {
		animation: pulse 2s ease-in-out infinite;
	}

	.core-inner {
		animation: pulse 2s ease-in-out infinite;
		animation-delay: -0.5s;
	}

	@keyframes breathe {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.05);
			opacity: 0.85;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.9;
		}
		50% {
			opacity: 0.6;
		}
	}

	/* Respect reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.orb,
		.core,
		.core-inner {
			animation: none;
		}
	}
</style>
