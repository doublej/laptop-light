export interface Tone {
	id: string;
	name: string;
	color: string;
	colorP3: string;
	colorCore: string;
	colorCoreP3: string;
	colorEdge: string;
	colorEdgeP3: string;
}

// Display-P3 colors push beyond sRGB for brighter, more saturated output
// Values >1.0 use the extended gamut available on HDR displays
export const tones: Tone[] = [
	{
		id: 'amber',
		name: 'Amber',
		color: '#FFBF00',
		colorP3: 'color(display-p3 1.1 0.8 0)',
		colorCore: '#FFE066',
		colorCoreP3: 'color(display-p3 1.1 0.9 0.4)',
		colorEdge: '#CC9900',
		colorEdgeP3: 'color(display-p3 0.85 0.65 0)'
	},
	{
		id: 'candlelight',
		name: 'Candlelight',
		color: '#FF9329',
		colorP3: 'color(display-p3 1.1 0.6 0.15)',
		colorCore: '#FFBB66',
		colorCoreP3: 'color(display-p3 1.1 0.75 0.4)',
		colorEdge: '#CC7520',
		colorEdgeP3: 'color(display-p3 0.85 0.5 0.12)'
	},
	{
		id: 'sunset',
		name: 'Sunset',
		color: '#FF6B35',
		colorP3: 'color(display-p3 1.1 0.45 0.2)',
		colorCore: '#FF9966',
		colorCoreP3: 'color(display-p3 1.1 0.65 0.4)',
		colorEdge: '#CC552A',
		colorEdgeP3: 'color(display-p3 0.85 0.36 0.16)'
	},
	{
		id: 'soft-pink',
		name: 'Soft Pink',
		color: '#FFB5A7',
		colorP3: 'color(display-p3 1.1 0.75 0.7)',
		colorCore: '#FFD4CC',
		colorCoreP3: 'color(display-p3 1.1 0.86 0.82)',
		colorEdge: '#CC9185',
		colorEdgeP3: 'color(display-p3 0.85 0.6 0.56)'
	}
];

export const defaultToneId = 'amber';
