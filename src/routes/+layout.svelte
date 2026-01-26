<script lang="ts">
	import { page } from '$app/stores';

	const siteName = 'Laptop Light';
	const defaultDescription = 'Turn your laptop screen into warm ambient lighting. Control from your phone via WebRTC.';
	const themeColor = '#f59e0b';
</script>

<svelte:head>
	<!-- Favicons -->
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<link rel="manifest" href="/manifest.json" />

	<!-- Base meta -->
	<meta name="theme-color" content={themeColor} />
	<meta name="color-scheme" content="dark" />
	<meta name="author" content="Laptop Light" />
	<meta name="robots" content="index, follow" />

	<!-- Default OG tags (pages can override) -->
	<meta property="og:site_name" content={siteName} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />

	<!-- Default Twitter tags -->
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<slot />
