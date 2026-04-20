import { motion } from 'framer-motion';
import { useMemo } from 'react';

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.45,
      delayChildren: 0.3,
    },
  },
};

const section = {
  hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const tagItem = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const tagContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

export default function ProfileReveal({ profile }) {
  const sessionId = useMemo(
    () => `SES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    []
  );

  const {
    persoonlijkheid = [],
    persoonlijkheid_toelichting = [],
    emotioneel_profiel = [],
    koopgedrag = [],
    advertentieprofiel = {},
    opvallendste_observatie = '',
    gezicht_observatie = null,
  } = profile;

  const waardeClass = (advertentieprofiel.waarde || '').toLowerCase();

  return (
    <div className="reveal-wrapper">
      {/* Header */}
      <motion.div
        className="reveal-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="reveal-logo">De Spiegel — Profiel</div>
        <div className="reveal-id">{sessionId}</div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show">

        {/* Persoonlijkheid */}
        <motion.div variants={section} className="profile-section section-personality">
          <div className="section-title personality">
            Persoonlijkheidsprofiel
          </div>
          <div className="trait-list">
            {persoonlijkheid.map((trait, i) => (
              <motion.div
                key={i}
                className="trait-item"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.4 }}
              >
                <div className="trait-name">
                  <span style={{ color: 'var(--accent)', marginRight: 8, fontSize: 10 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {trait}
                </div>
                {persoonlijkheid_toelichting[i] && (
                  <div className="trait-desc">{persoonlijkheid_toelichting[i]}</div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Emotioneel profiel */}
        <motion.div variants={section} className="profile-section section-emotional">
          <div className="section-title emotional">Emotioneel profiel</div>
          <motion.div className="tag-list" variants={tagContainer} initial="hidden" animate="show">
            {emotioneel_profiel.map((obs, i) => (
              <motion.span key={i} className="tag emotional" variants={tagItem}>
                {obs}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Koopgedrag */}
        <motion.div variants={section} className="profile-section section-purchase">
          <div className="section-title purchase">Gesimuleerd koopgedrag</div>
          <motion.div className="tag-list" variants={tagContainer} initial="hidden" animate="show">
            {koopgedrag.map((k, i) => (
              <motion.span key={i} className="tag purchase" variants={tagItem}>
                {k}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Advertentieprofiel */}
        <motion.div variants={section} className="profile-section section-ad">
          <div className="section-title ad">Advertentieprofiel</div>
          <div className="ad-grid">
            <div className="ad-field" style={{ gridColumn: '1 / -1' }}>
              <div className="ad-label">Advertentiewaarde</div>
              <div className={`ad-waarde ${waardeClass}`}>
                {(advertentieprofiel.waarde || '—').toUpperCase()}
              </div>
            </div>
            <div className="ad-field">
              <div className="ad-label">Beste moment</div>
              <div className="ad-value">{advertentieprofiel.beste_moment || '—'}</div>
            </div>
            <div className="ad-field">
              <div className="ad-label">Methode</div>
              <div className="ad-value">{advertentieprofiel.methode || '—'}</div>
            </div>
            <div className="ad-field" style={{ gridColumn: '1 / -1' }}>
              <div className="ad-label">Doelgroep</div>
              <div className="ad-value">{advertentieprofiel.doelgroep || '—'}</div>
            </div>
          </div>
        </motion.div>

        {/* Gezicht observatie */}
        {gezicht_observatie && gezicht_observatie !== 'Gezichtsdata niet beschikbaar voor deze sessie.' && (
          <motion.div variants={section} className="profile-section section-face">
            <div className="section-title face">Gezichtsanalyse</div>
            <motion.div
              className="observation-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4, duration: 0.8 }}
            >
              {gezicht_observatie}
            </motion.div>
          </motion.div>
        )}

        {/* Opvallendste observatie */}
        <motion.div variants={section} className="profile-section section-observation">
          <div className="section-title observation">Opvallendste observatie</div>
          <motion.div
            className="observation-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8, duration: 0.8 }}
          >
            "{opvallendste_observatie}"
          </motion.div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div variants={section} className="disclaimer">
          <div className="disclaimer-title">Over deze installatie</div>
          <div className="disclaimer-text">
            Dit profiel is gegenereerd op basis van gedragsdata die tijdens de installatie
            werd gemeten: swipe-keuzes, spreektempo, volume en beslissingstijd.
            De analyse is indicatief en bedoeld als kunstzinnige verbeelding van hoe
            digitale profilering werkt — niet als wetenschappelijk of juridisch bindend oordeel.
            Geen data wordt opgeslagen na afloop van de sessie.
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
