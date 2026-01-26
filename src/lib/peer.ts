import Peer, { type DataConnection } from 'peerjs';

export interface LightState {
	toneId: string;
	brightness: number;
	hdrEnabled: boolean;
	flickerEnabled: boolean;
	flickerIntensity: number;
}

type StateCallback = (state: LightState) => void;
type ConnectionCallback = (connected: boolean) => void;

let peer: Peer | null = null;
let connection: DataConnection | null = null;
let stateCallback: StateCallback | null = null;
let connectionCallback: ConnectionCallback | null = null;

function generatePeerId(): string {
	return 'glow-' + Math.random().toString(36).substring(2, 10);
}

export function createHost(
	onState: StateCallback,
	onConnection: ConnectionCallback
): Promise<string> {
	return new Promise((resolve, reject) => {
		const peerId = generatePeerId();
		stateCallback = onState;
		connectionCallback = onConnection;

		peer = new Peer(peerId);

		peer.on('open', (id) => {
			resolve(id);
		});

		peer.on('error', (err) => {
			console.error('PeerJS error:', err);
			reject(err);
		});

		peer.on('connection', (conn) => {
			connection = conn;

			conn.on('open', () => {
				connectionCallback?.(true);
			});

			conn.on('data', (data) => {
				stateCallback?.(data as LightState);
			});

			conn.on('close', () => {
				connection = null;
				connectionCallback?.(false);
			});

			conn.on('error', () => {
				connection = null;
				connectionCallback?.(false);
			});
		});

		peer.on('disconnected', () => {
			connectionCallback?.(false);
		});
	});
}

export function connectToHost(
	peerId: string,
	onState: StateCallback,
	onConnection: ConnectionCallback
): Promise<void> {
	return new Promise((resolve, reject) => {
		stateCallback = onState;
		connectionCallback = onConnection;

		peer = new Peer();

		peer.on('open', () => {
			connection = peer!.connect(peerId, { reliable: true });

			connection.on('open', () => {
				connectionCallback?.(true);
				resolve();
			});

			connection.on('data', (data) => {
				stateCallback?.(data as LightState);
			});

			connection.on('close', () => {
				connection = null;
				connectionCallback?.(false);
			});

			connection.on('error', (err) => {
				connection = null;
				connectionCallback?.(false);
				reject(err);
			});
		});

		peer.on('error', (err) => {
			console.error('PeerJS error:', err);
			reject(err);
		});
	});
}

export function sendState(state: LightState): void {
	if (connection?.open) {
		connection.send(state);
	}
}

export function disconnect(): void {
	connection?.close();
	connection = null;
	peer?.destroy();
	peer = null;
	stateCallback = null;
	connectionCallback = null;
}

export function isConnected(): boolean {
	return connection?.open ?? false;
}
