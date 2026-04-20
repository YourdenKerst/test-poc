import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from './socket.js';
import ProfileReveal from './components/ProfileReveal.jsx';

export default function App() {
  const [state, setState] = useState('waiting'); // 'waiting' | 'revealing' | 'error'
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('profile:ready', (data) => {
      setProfile(data);
      setState('revealing');
      setError(null);
    });

    socket.on('profile:error', (data) => {
      setError(data.message);
    });

    socket.on('session:reset', () => {
      setState('waiting');
      setProfile(null);
      setError(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('profile:ready');
      socket.off('profile:error');
      socket.off('session:reset');
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {state === 'waiting' && (
          <motion.div
            key="waiting"
            className="waiting-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="waiting-logo">De Spiegel</div>

            <motion.div
              className="waiting-orb"
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="waiting-label">
              {connected ? 'Wacht op analyse...' : 'Geen verbinding met server'}
            </div>
          </motion.div>
        )}

        {state === 'revealing' && profile && (
          <motion.div
            key="revealing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ProfileReveal profile={profile} />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="error-banner">
          ⚠ Analysefout — {error}
        </div>
      )}

      {!connected && state !== 'waiting' && (
        <div className="error-banner">
          ⚠ Verbinding verbroken
        </div>
      )}
    </>
  );
}
