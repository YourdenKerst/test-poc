import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CARDS = [
  { id: 1,  type: 'text',  content: 'Avontuur gaat boven zekerheid' },
  { id: 2,  type: 'emoji', content: '🌍', label: 'Wereld boven eigenbelang' },
  { id: 3,  type: 'text',  content: 'Vrijheid is belangrijker dan veiligheid' },
  { id: 4,  type: 'emoji', content: '🏙️', label: 'Het stadsleven trekt je aan' },
  { id: 5,  type: 'text',  content: 'Je werkt liever alleen dan in een team' },
  { id: 6,  type: 'emoji', content: '💰', label: 'Geld maakt gelukkig' },
  { id: 7,  type: 'text',  content: 'Regels zijn er om te volgen' },
  { id: 8,  type: 'emoji', content: '🌲', label: 'Natuur boven luxe' },
  { id: 9,  type: 'text',  content: 'Carrière gaat voor privéleven' },
  { id: 10, type: 'emoji', content: '❤️', label: 'Emoties boven logica' },
  { id: 11, type: 'text',  content: 'Je vertrouwt je instinct meer dan feiten' },
  { id: 12, type: 'emoji', content: '✨', label: 'Luxe en comfort zijn essentieel' },
  { id: 13, type: 'text',  content: 'Je past je gemakkelijk aan nieuwe situaties aan' },
  { id: 14, type: 'emoji', content: '🎯', label: 'Resultaat telt, methode niet' },
  { id: 15, type: 'text',  content: 'Je zou liever beroemd zijn dan rijk' },
];

export default function SwipeFeed({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [swipes, setSwipes] = useState([]);
  const [exitDir, setExitDir] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const cardStart = useRef(Date.now());

  useEffect(() => {
    cardStart.current = Date.now();
  }, [index]);

  const swipe = (dir) => {
    if (isExiting) return;
    setIsExiting(true);
    setExitDir(dir);

    const card = CARDS[index];
    const entry = {
      kaart: card.type === 'emoji' ? card.label : card.content,
      richting: dir === 'right' ? 'rechts' : 'links',
      pauzeDuur_ms: Date.now() - cardStart.current,
    };

    const nextSwipes = [...swipes, entry];

    setTimeout(() => {
      if (index + 1 >= CARDS.length) {
        onComplete(nextSwipes);
      } else {
        setSwipes(nextSwipes);
        setIndex(index + 1);
        setExitDir(null);
        setIsExiting(false);
      }
    }, 280);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') swipe('left');
      if (e.key === 'ArrowRight') swipe('right');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, isExiting, swipes]);

  const card = CARDS[index];
  const progress = index / CARDS.length;

  return (
    <>
      <div className="phase-header">
        <span className="phase-label">Fase 01 — Preferenties</span>
        <span className="phase-timer">{index + 1} / {CARDS.length}</span>
      </div>

      <div className="swipe-area">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="swipe-card"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.88,
              x: exitDir === 'right' ? 280 : exitDir === 'left' ? -280 : 0,
              transition: { duration: 0.25, ease: 'easeIn' },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="card-counter-badge">{String(index + 1).padStart(2, '0')}</div>
            {card.type === 'emoji' ? (
              <>
                <motion.div
                  className="card-emoji"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  {card.content}
                </motion.div>
                <div className="card-text">{card.label}</div>
              </>
            ) : (
              <div className="card-text large">{card.content}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="swipe-controls">
        <button className="swipe-btn left" onClick={() => swipe('left')}>
          ✕ &nbsp; Nee
        </button>
        <button className="swipe-btn right" onClick={() => swipe('right')}>
          ✓ &nbsp; Ja
        </button>
      </div>

      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>
    </>
  );
}
