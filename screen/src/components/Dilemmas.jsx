import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DILEMMAS = [
  {
    id: 1,
    vraag: 'Je vindt een portemonnee met €200. Niemand heeft het gezien.',
    optieA: 'Inleveren bij de politie',
    optieB: 'Geld houden, portemonnee weggooien',
  },
  {
    id: 2,
    vraag: 'Je ziet een collega iets stelen van het werk.',
    optieA: 'Melden bij de manager',
    optieB: 'Niks zeggen — niet jouw probleem',
  },
  {
    id: 3,
    vraag: 'Je kunt een goede vriend helpen door een kleine leugen te vertellen.',
    optieA: 'Liegen voor je vriend',
    optieB: 'Eerlijk zijn, ook al kost het',
  },
  {
    id: 4,
    vraag: 'Je krijgt per ongeluk €50 te veel wisselgeld van een grote keten.',
    optieA: 'Terugbrengen',
    optieB: 'Houden — hun fout, hun probleem',
  },
];

const DECISION_TIME = 15; // seconds visible timer

export default function Dilemmas({ onComplete }) {
  const [dIndex, setDIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setSelected(null);

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 250);

    return () => clearInterval(timerRef.current);
  }, [dIndex]);

  const choose = (optie) => {
    if (selected) return;
    clearInterval(timerRef.current);
    setSelected(optie);

    const beslissingstijd = Date.now() - startRef.current;
    const entry = {
      vraag: DILEMMAS[dIndex].vraag,
      keuze: optie,
      beslissingstijd_ms: beslissingstijd,
    };

    const nextResults = [...results, entry];

    setTimeout(() => {
      if (dIndex + 1 >= DILEMMAS.length) {
        onComplete(nextResults);
      } else {
        setResults(nextResults);
        setDIndex(dIndex + 1);
      }
    }, 700);
  };

  const dilemma = DILEMMAS[dIndex];
  const timerUrgent = elapsed >= 8;

  return (
    <>
      <div className="phase-header">
        <span className="phase-label">Fase 03 — Morele keuzes</span>
        <span className="phase-timer">{dIndex + 1} / {DILEMMAS.length}</span>
      </div>

      <div className="dilemma-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={dIndex}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, width: '100%' }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={`decision-timer ${timerUrgent ? 'urgent' : ''}`}
              animate={timerUrgent ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              {String(elapsed).padStart(2, '0')}s
            </motion.div>

            <div className="dilemma-question">{dilemma.vraag}</div>

            <div className="dilemma-choices">
              {[
                { key: 'A', label: dilemma.optieA },
                { key: 'B', label: dilemma.optieB },
              ].map(({ key, label }) => (
                <motion.button
                  key={key}
                  className={`dilemma-btn ${selected === label ? 'selected' : ''}`}
                  onClick={() => choose(label)}
                  whileHover={!selected ? { scale: 1.02 } : {}}
                  whileTap={!selected ? { scale: 0.98 } : {}}
                  disabled={!!selected}
                >
                  <span style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-dim)', display: 'block', marginBottom: 10 }}>
                    OPTIE {key}
                  </span>
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          animate={{ width: `${(dIndex / DILEMMAS.length) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>
    </>
  );
}
