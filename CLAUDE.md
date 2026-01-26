# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glow is a SvelteKit web app that turns your laptop screen into warm ambient lighting. Features include color tone selection (amber, candlelight, sunset, soft pink), brightness control, candle-like flicker animation, HDR/Display-P3 color support, screen wake lock, and remote control via phone.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server with network access (--host)
bun run build        # Build for production
bun run preview      # Preview production build
bun run check        # TypeScript and Svelte type checking
```

## Architecture

### State Management
All state lives in `src/routes/+page.svelte` using Svelte 5 runes (`$state`, `$derived`, `$effect`). User preferences persist to localStorage.

### Component Structure
- `+page.svelte` - Main page, owns all state, composes UI
- `ControlPanel.svelte` - Floating pill-shaped control bar with settings panel
- `LightCanvas.svelte` - Full-screen solid color with flicker animation
- `BrightnessOverlay.svelte` - Vertical indicator for scroll-wheel adjustments
- `FullscreenPrompt.svelte` - Initial fullscreen suggestion modal
- `QRCodeModal.svelte` - QR code for remote control connection
- `GlowLogo.svelte` - Animated logo

### Remote Control (`src/routes/remote/+page.svelte`)
Phone connects via WebRTC (PeerJS) for real-time control. Peer connection logic in `src/lib/peer.ts`.

### Color System (`src/lib/tones.ts`)
Each tone defines sRGB and Display-P3 colors. LightCanvas switches based on `hdrEnabled` and device support via `matchMedia('(color-gamut: p3)')`.

### Interaction Patterns
- Mouse movement shows controls, auto-hides after 2.5s
- Scroll wheel adjusts brightness (right half) or flicker intensity (left half when enabled)
- Touch tap toggles controls visibility
- Settings gear opens secondary options (Flicker, Wide Color, Always On)

## Tech Stack
- Svelte 5 with TypeScript
- SvelteKit with Vercel adapter
- Vite + Bun
- PeerJS (WebRTC), qrcode
