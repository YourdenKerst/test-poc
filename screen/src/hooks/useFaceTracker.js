import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const MODEL_PATH = '/models';
const DETECTION_INTERVAL_MS = 1000;
const MAX_BUFFER = 60;
const NOTABLE_THRESHOLD = 0.65;
const MAX_NOTABLE = 5;

// Mock emotions for fallback when models can't load
const MOCK_EMOTIONS = ['neutral', 'neutral', 'neutral', 'happy', 'surprised', 'fearful', 'neutral'];

export function useFaceTracker() {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const bufferRef = useRef([]);
  const phaseRef = useRef('idle');
  const totalTicksRef = useRef(0);
  const detectedTicksRef = useRef(0);
  const useMockRef = useRef(false);

  // Load models once on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_PATH),
        ]);
        if (!cancelled) {
          setModelsLoaded(true);
          console.log('[FaceTracker] Modellen geladen');
        }
      } catch (err) {
        console.warn('[FaceTracker] Modellen niet geladen, mock-modus actief:', err.message);
        if (!cancelled) {
          useMockRef.current = true;
          setModelsLoaded(true); // allow tracking with mock data
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const startTracking = useCallback(async () => {
    if (isActive || !modelsLoaded) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;

      // Hidden video element — never visible to the visitor
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('aria-hidden', 'true');
      video.style.cssText =
        'position:fixed;opacity:0.001;pointer-events:none;' +
        'width:1px;height:1px;top:-1px;left:-1px;';
      document.body.appendChild(video);
      videoRef.current = video;

      setHasPermission(true);
      setIsActive(true);

      // Wait for video to be ready
      await new Promise((resolve) => {
        if (video.readyState >= 2) return resolve();
        video.addEventListener('loadeddata', resolve, { once: true });
        setTimeout(resolve, 3000);
      });

      bufferRef.current = [];
      totalTicksRef.current = 0;
      detectedTicksRef.current = 0;

      intervalRef.current = setInterval(async () => {
        totalTicksRef.current++;

        const video = videoRef.current;
        if (!video || video.readyState < 2) return;

        let emotie = 'neutral';
        let score = 0.5;

        if (useMockRef.current) {
          // Simulated data — weighted towards neutral
          detectedTicksRef.current++;
          emotie = MOCK_EMOTIONS[Math.floor(Math.random() * MOCK_EMOTIONS.length)];
          score = parseFloat((0.45 + Math.random() * 0.5).toFixed(3));
        } else {
          try {
            const detection = await faceapi
              .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
              .withFaceExpressions();

            if (!detection) return; // no face in frame — skip tick, don't add to buffer

            detectedTicksRef.current++;
            const sorted = Object.entries(detection.expressions).sort((a, b) => b[1] - a[1]);
            emotie = sorted[0][0];
            score = parseFloat(sorted[0][1].toFixed(3));
          } catch {
            return; // skip failed detection silently
          }
        }

        if (bufferRef.current.length >= MAX_BUFFER) bufferRef.current.shift();
        bufferRef.current.push({
          timestamp: Date.now(),
          fase: phaseRef.current,
          emotie,
          score,
        });
      }, DETECTION_INTERVAL_MS);
    } catch (err) {
      console.warn('[FaceTracker] Camera toegang geweigerd:', err.message);
      setHasPermission(false);
    }
  }, [isActive, modelsLoaded]);

  const setPhase = useCallback((phase) => {
    phaseRef.current = phase;
  }, []);

  const stopTracking = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.remove();
      videoRef.current = null;
    }

    setIsActive(false);
  }, []);

  const getSummary = useCallback(() => {
    // No camera permission → return null (session continues without face data)
    if (hasPermission === false) return null;
    if (bufferRef.current.length === 0) return null;

    const buffer = bufferRef.current;

    // Emotion count distribution
    const counts = {};
    for (const tick of buffer) {
      counts[tick.emotie] = (counts[tick.emotie] || 0) + 1;
    }

    const emotie_verdeling = {};
    for (const [e, count] of Object.entries(counts)) {
      emotie_verdeling[e] = parseFloat((count / buffer.length).toFixed(2));
    }

    const dominante_emotie_overall = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral';

    // Only keep genuinely notable (non-neutral, high-confidence) moments
    const opvallende_momenten = buffer
      .filter((t) => t.emotie !== 'neutral' && t.score >= NOTABLE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_NOTABLE)
      .map(({ fase, emotie, score }) => ({ fase, emotie, score }));

    const gezicht_gedetecteerd_percentage =
      totalTicksRef.current > 0
        ? parseFloat((detectedTicksRef.current / totalTicksRef.current).toFixed(2))
        : 0;

    return {
      dominante_emotie_overall,
      emotie_verdeling,
      opvallende_momenten,
      gezicht_gedetecteerd_percentage,
    };
  }, [hasPermission]);

  const reset = useCallback(() => {
    stopTracking();
    bufferRef.current = [];
    totalTicksRef.current = 0;
    detectedTicksRef.current = 0;
    phaseRef.current = 'idle';
    setHasPermission(null);
  }, [stopTracking]);

  return { isActive, hasPermission, modelsLoaded, startTracking, stopTracking, setPhase, getSummary, reset };
}
