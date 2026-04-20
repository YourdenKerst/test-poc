import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('connect', () => console.log('[Socket] Verbonden met server'));
socket.on('disconnect', () => console.log('[Socket] Verbroken van server'));
socket.on('connect_error', (err) => console.warn('[Socket] Verbindingsfout:', err.message));
