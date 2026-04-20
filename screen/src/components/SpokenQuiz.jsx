import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTIONS = [
  'Beschrijf je ideale weekend in één zin.',
  'Wat is jouw grootste angst?',
  'Wanneer voel je je het meest jezelf?',
  'Wat doe je als je je verveelt?',
  'Beschrijf jezelf in drie woorden.',
];

export default function SpokenQuiz({ onComplete }) {
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const [fallbackText, setFallbackText] = useState('');
  const [speechMeasurements, setSpeechMeasurements] = useState([]);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const volumeIntervalRef = useRef(null);
  const volumeSamplesRef = useRef([]);
  const questionStartRef = useRef(null);
  const wordCountRef = useRef(0);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechAvailable(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'nl-NL';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);

    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(final || interim);
      if (final) wordCountRef.current = final.trim().split(/\s+/).filter(Boolean).length;
    };

    rec.onerror = (e) => {
      console.warn('Speech error:', e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setSpeechAvailable(false);
      }
      setIsListening(false);
    };

    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch {}
    };
  }, []);

  const startAudioMeasurement = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      volumeSamplesRef.current = [];
      const data = new Uint8Array(analyser.frequencyBinCount);

      volumeIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        volumeSamplesRef.current.push(avg);
        setVolume(avg);
      }, 100);
    } catch {
      // Microphone not available, graceful fallback
    }
  }, []);

  const stopAudioMeasurement = useCallback(() => {
    clearInterval(volumeIntervalRef.current);
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    try { audioContextRef.current?.close(); } catch {}
  }, []);

  const startListening = useCallback(async () => {
    if (!speechAvailable) return;
    setTranscript('');
    wordCountRef.current = 0;
    questionStartRef.current = Date.now();
    await startAudioMeasurement();
    try {
      recognitionRef.current?.start();
    } catch {}
  }, [speechAvailable, startAudioMeasurement]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    stopAudioMeasurement();
  }, [stopAudioMeasurement]);

  // Auto-start listening when question changes
  useEffect(() => {
    if (!speechAvailable) return;
    const timer = setTimeout(() => startListening(), 600);
    return () => {
      clearTimeout(timer);
      stopListening();
    };
  }, [qIndex, speechAvailable]);

  const handleNext = () => {
    stopListening();

    const answerText = speechAvailable ? transcript : fallbackText;
    const elapsed = (Date.now() - (questionStartRef.current || Date.now())) / 1000;
    const words = speechAvailable ? wordCountRef.current : answerText.trim().split(/\s+/).filter(Boolean).length;
    const wps = elapsed > 0 ? parseFloat((words / elapsed).toFixed(2)) : 0;
    const avgVol = volumeSamplesRef.current.length
      ? parseFloat((volumeSamplesRef.current.reduce((a, b) => a + b, 0) / volumeSamplesRef.current.length).toFixed(3))
      : 0;

    const measurement = {
      vraag: QUESTIONS[qIndex],
      antwoord: answerText,
      woorden_per_seconde: wps,
      gemiddeld_volume: avgVol,
    };

    const nextMeasurements = [...speechMeasurements, measurement];
    const nextAnswers = [...answers, answerText];

    if (qIndex + 1 >= QUESTIONS.length) {
      // Aggregate speech stats
      const allWps = nextMeasurements.map((m) => m.woorden_per_seconde);
      const allVol = nextMeasurements.map((m) => m.gemiddeld_volume);
      const spraak = {
        gemiddeld_volume: parseFloat((allVol.reduce((a, b) => a + b, 0) / allVol.length).toFixed(3)),
        woorden_per_seconde: parseFloat((allWps.reduce((a, b) => a + b, 0) / allWps.length).toFixed(2)),
        aantal_aarzelingen: nextMeasurements.filter((m) => m.woorden_per_seconde < 1.2).length,
        vragen: nextMeasurements,
      };
      onComplete(spraak);
    } else {
      setSpeechMeasurements(nextMeasurements);
      setAnswers(nextAnswers);
      setTranscript('');
      setFallbackText('');
      setVolume(0);
      volumeSamplesRef.current = [];
      setQIndex(qIndex + 1);
    }
  };

  const hasAnswer = speechAvailable ? transcript.trim().length > 0 : fallbackText.trim().length > 0;

  return (
    <>
      <div className="phase-header">
        <span className="phase-label">Fase 02 — Spraakanalyse</span>
        <span className="phase-timer">{qIndex + 1} / {QUESTIONS.length}</span>
      </div>

      <div className="quiz-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={qIndex}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, width: '100%' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="question-index">Vraag {String(qIndex + 1).padStart(2, '0')}</div>
            <div className="question-text">{QUESTIONS[qIndex]}</div>

            {speechAvailable ? (
              <>
                <div className={`speech-status ${isListening ? 'listening' : ''}`}>
                  <div className={`mic-indicator ${isListening ? 'active' : ''}`} />
                  <span className={`speech-transcript ${transcript ? 'filled' : ''}`}>
                    {transcript || (isListening ? 'Luisteren...' : 'Druk op start om te spreken')}
                  </span>
                </div>

                {/* Volume bar */}
                <div className="volume-bar-wrapper" style={{ width: 400 }}>
                  <motion.div
                    className="volume-bar-fill"
                    animate={{ width: `${Math.min(volume * 300, 100)}%` }}
                    transition={{ duration: 0.08 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="quiz-next-btn"
                    style={{ borderColor: isListening ? 'var(--accent)' : 'rgba(0,207,255,0.25)', padding: '12px 32px' }}
                    onClick={isListening ? stopListening : startListening}
                  >
                    {isListening ? '⏹ Stop' : '⏺ Opnemen'}
                  </button>
                  <button className="quiz-next-btn" onClick={handleNext} disabled={!hasAnswer}>
                    Volgende →
                  </button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  className="fallback-input"
                  rows={3}
                  placeholder="Typ je antwoord hier..."
                  value={fallbackText}
                  onChange={(e) => setFallbackText(e.target.value)}
                  style={{ width: 480 }}
                />
                <button className="quiz-next-btn" onClick={handleNext} disabled={!hasAnswer}>
                  Volgende →
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          animate={{ width: `${(qIndex / QUESTIONS.length) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>
    </>
  );
}
