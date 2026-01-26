import Peer, { type DataConnection } from 'peerjs';

export interface LightState {
	toneId: string;
	brightness: number;
	hdrEnabled: boolean;
	flickerEnabled: boolean;
	flickerIntensity: number;
}

export type PeerMessage =
	| { type: 'state'; data: LightState }
	| { type: 'qrModalOpen'; open: boolean }
	| { type: 'closeQRModal' };

type StateCallback = (state: LightState) => void;
type ConnectionCallback = (connected: boolean) => void;
type MessageCallback = (message: PeerMessage) => void;

const HOST_PEER_ID_KEY = 'glow-host-peer-id';

let peer: Peer | null = null;
let connection: DataConnection | null = null;
let stateCallback: StateCallback | null = null;
let connectionCallback: ConnectionCallback | null = null;
let messageCallback: MessageCallback | null = null;

function getOrCreateHostPeerId(): string {
	if (typeof localStorage === 'undefined') {
		return 'glow-' + Math.random().toString(36).substring(2, 10);
	}
	let id = localStorage.getItem(HOST_PEER_ID_KEY);
	if (!id) {
		id = 'glow-' + Math.random().toString(36).substring(2, 10);
		localStorage.setItem(HOST_PEER_ID_KEY, id);
	}
	return id;
}

export function createHost(
	onState: StateCallback,
	onConnection: ConnectionCallback,
	onMessage?: MessageCallback
): Promise<string> {
	return new Promise((resolve, reject) => {
		const peerId = getOrCreateHostPeerId();
		stateCallback = onState;
		connectionCallback = onConnection;
		messageCallback = onMessage ?? null;

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
				const msg = data as PeerMessage;
				if (msg.type === 'state') {
					stateCallback?.(msg.data);
				} else {
					messageCallback?.(msg);
				}
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
	onConnection: ConnectionCallback,
	onMessage?: MessageCallback
): Promise<void> {
	return new Promise((resolve, reject) => {
		stateCallback = onState;
		connectionCallback = onConnection;
		messageCallback = onMessage ?? null;

		peer = new Peer();

		peer.on('open', () => {
			connection = peer!.connect(peerId, { reliable: true });

			connection.on('open', () => {
				connectionCallback?.(true);
				resolve();
			});

			connection.on('data', (data) => {
				const msg = data as PeerMessage;
				if (msg.type === 'state') {
					stateCallback?.(msg.data);
				} else {
					messageCallback?.(msg);
				}
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
	sendMessage({ type: 'state', data: state });
}

export function sendMessage(message: PeerMessage): void {
	if (connection?.open) {
		connection.send(message);
	}
}

export function disconnect(): void {
	connection?.close();
	connection = null;
	peer?.destroy();
	peer = null;
	stateCallback = null;
	connectionCallback = null;
	messageCallback = null;
}

export function isConnected(): boolean {
	return connection?.open ?? false;
}
