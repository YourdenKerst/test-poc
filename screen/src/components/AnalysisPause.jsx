import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LOG_STEPS = [
  { delay: 0,    label: 'Gedragsdata verwerken...' },
  { delay: 1500, label: 'Swipe-patronen analyseren...' },
  { delay: 3200, label: 'Spraakprofiel berekenen...' },
  { delay: 5000, label: 'Morele keuzes wegen...' },
  { delay: 7000, label: 'Advertentieprofiel genereren...' },
  { delay: 9500, label: 'Resultaten klaarmaken voor tablet...' },
];

export default function AnalysisPause() {
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState([]);

  useEffect(() => {
    const timers = LOG_STEPS.map((step, i) =>
      setTimeout(() => {
        setActiveStep(i);
        if (i > 0) setDoneSteps((d) => [...d, i - 1]);
      }, step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="analysis-container">
      {/* Animated orb */}
      <div className="analysis-orb">
        <motion.div
          className="orb-ring-2"
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}
        />
        <motion.div
          className="orb-ring"
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="orb-core"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="analysis-label"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        Analyseren
      </motion.div>

      {/* Log lines */}
      <div className="analysis-log">
        {LOG_STEPS.map((step, i) => {
          const isDone = doneSteps.includes(i);
          const isActive = activeStep === i;
          return (
            <motion.div
              key={i}
              className={`log-line ${isActive ? 'active' : isDone ? 'done' : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: i <= activeStep ? 1 : 0.15 }}
              transition={{ duration: 0.4 }}
            >
              {isDone ? '✓' : isActive ? '›' : '·'} {step.label}
            </motion.div>
          );
        })}
      </div>

      <div className="analysis-subtext">
        Het profiel wordt gegenereerd en naar de tablet gestuurd.
        <br />
        Dit duurt enkele seconden.
      </div>
    </div>
  );
}
