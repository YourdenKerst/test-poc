import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { socket } from './socket.js';
import SwipeFeed from './components/SwipeFeed.jsx';
import SpokenQuiz from './components/SpokenQuiz.jsx';
import Dilemmas from './components/Dilemmas.jsx';
import AnalysisPause from './components/AnalysisPause.jsx';
import { useFaceTracker } from './hooks/useFaceTracker.js';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: 'easeIn' } },
};

export default function App() {
  const [phase, setPhase] = useState('intro');
  const [connected, setConnected] = useState(socket.connected);
  const [session, setSession] = useState({ swipes: [], spraak: {}, dilemmas: [] });

  const face = useFaceTracker();

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('profile:ready', () => {
      setPhase('done');
    });

    socket.on('session:reset', () => {
      face.reset();
      setSession({ swipes: [], spraak: {}, dilemmas: [] });
      setPhase('intro');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('profile:ready');
      socket.off('session:reset');
    };
  }, [face.reset]);

  // Keep face tracker phase in sync
  useEffect(() => {
    face.setPhase(phase);
  }, [phase, face.setPhase]);

  const handleStart = () => {
    face.startTracking(); // non-blocking — camera permission prompt fires async
    setPhase('swipe');
  };

  const handleSwipeDone = (swipes) => {
    setSession((s) => ({ ...s, swipes }));
    setPhase('quiz');
  };

  const handleQuizDone = (spraak) => {
    setSession((s) => ({ ...s, spraak }));
    setPhase('dilemmas');
  };

  const handleDilemmasDone = (dilemmas) => {
    face.stopTracking();
    const gezicht = face.getSummary(); // null if no camera permission
    const finalSession = { ...session, dilemmas, gezicht };
    setSession(finalSession);
    setPhase('analyzing');
    socket.emit('session:analyze', finalSession);
  };

  const handleReset = () => {
    socket.emit('session:reset');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          DE <span>SPIEGEL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {face.isActive && <RecIndicator />}
          <div className={`connection-dot ${connected ? '' : 'disconnected'}`} title={connected ? 'Verbonden' : 'Verbinding verbroken'} />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" className="phase-container" {...pageVariants}>
            <IntroScreen onStart={handleStart} />
          </motion.div>
        )}

        {phase === 'swipe' && (
          <motion.div key="swipe" className="phase-container" {...pageVariants}>
            <SwipeFeed onComplete={handleSwipeDone} />
          </motion.div>
        )}

        {phase === 'quiz' && (
          <motion.div key="quiz" className="phase-container" {...pageVariants}>
            <SpokenQuiz onComplete={handleQuizDone} />
          </motion.div>
        )}

        {phase === 'dilemmas' && (
          <motion.div key="dilemmas" className="phase-container" {...pageVariants}>
            <Dilemmas onComplete={handleDilemmasDone} />
          </motion.div>
        )}

        {phase === 'analyzing' && (
          <motion.div key="analyzing" className="phase-container" {...pageVariants}>
            <AnalysisPause />
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key="done" className="phase-container" {...pageVariants}>
            <DoneScreen onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>

      {!connected && (
        <div className="disconnect-banner">
          ⚠ Geen verbinding met server — controleer of de server actief is
        </div>
      )}
    </div>
  );
}

function RecIndicator() {
  return (
    <motion.div
      className="rec-indicator"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      title=""
    />
  );
}

function IntroScreen({ onStart }) {
  return (
    <div className="intro-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="intro-title">
          DE <span>SPIEGEL</span>
        </div>
      </motion.div>

      <motion.div
        className="intro-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        In de volgende drie minuten worden je gedragspatronen
        geregistreerd en geanalyseerd.
        <br />
        Bekijk je profiel op de tablet na afloop.
      </motion.div>

      <motion.div
        className="intro-phases"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        {[
          { num: '01', name: 'Preferenties' },
          { num: '02', name: 'Spraak' },
          { num: '03', name: 'Dilemma\'s' },
        ].map((p) => (
          <div key={p.num} className="intro-phase">
            <div className="phase-num">{p.num}</div>
            <div className="phase-name">{p.name}</div>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <button className="start-btn" onClick={onStart}>
          Begin sessie
        </button>
      </motion.div>
    </div>
  );
}

function DoneScreen({ onReset }) {
  return (
    <div className="done-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="done-icon"
      >
        ◉
      </motion.div>

      <motion.div
        className="done-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Analyse voltooid
      </motion.div>

      <motion.div
        className="done-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Bekijk je profiel op de tablet.
        <br />
        Klik onderstaande knop wanneer klaar voor de volgende bezoeker.
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <button className="reset-btn" onClick={onReset}>
          Volgende bezoeker
        </button>
      </motion.div>
    </div>
  );
}
