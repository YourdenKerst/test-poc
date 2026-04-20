# De Spiegel — Setup

## 1. API key instellen

Kopieer `.env.example` naar `.env` in de root:

```bash
cp .env.example .env
```

Vul je Anthropic API key in:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## 2. Alle dependencies installeren

```bash
npm run install:all
```

Dit installeert packages voor root, server, screen én tablet.

## 3. Starten

```bash
npm run dev
```

Dit start gelijktijdig:
- **Server** op `http://localhost:3001`
- **Scherm-app** op `http://localhost:5173`
- **Tablet-app** op `http://localhost:5174`

## Gebruik

1. Open `http://localhost:5173` op het grote scherm
2. Open `http://localhost:5174` op de tablet
3. Start de sessie op het grote scherm
4. Doorloop de drie fases
5. Het profiel verschijnt automatisch op de tablet
6. Klik "Volgende bezoeker" op het grote scherm om te resetten

## Opmerkingen

- **Spraakherkenning** werkt alleen in Chrome/Edge (Web Speech API)
- **Microfoon** wordt gevraagd bij fase 2 — sta toe in de browser
- Als Claude API niet beschikbaar is, wordt een fallback-profiel gebruikt
- Geen data wordt opgeslagen — alles verdwijnt bij reset
