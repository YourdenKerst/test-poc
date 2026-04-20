import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Je bent een gedragspsycholoog die uitsluitend op basis van gedragssignalen een persoonlijk profiel opstelt. Je ontvangt ruwe meetdata van een bezoeker en genereert een confronterend maar niet stigmatiserend profiel.

Toon: direct, analytisch, alsof je de persoon echt hebt geobserveerd. Geen vage taal. Geen oordeel. Alleen observaties.

Als de data een "gezicht" veld bevat: gebruik deze gezichtsdata om de persoonlijkheids- en emotie-secties te verdiepen.
Wees specifiek: als iemand hoog scoorde op 'surprised' tijdens een dilemma, benoem dat als gedragsobservatie.
Noem nooit technische termen als 'face-api', 'score', 'buffer' of 'detectie' — spreek altijd in gedragsobservaties.
Voorbeeld: niet "surprised score 0.91" maar "reageerde zichtbaar verrast op morele druk."
Als gezicht null is of ontbreekt: genereer gezicht_observatie als "Gezichtsdata niet beschikbaar voor deze sessie."

Geef je output als JSON met deze structuur:
{
  "persoonlijkheid": ["kenmerk 1", "kenmerk 2", "kenmerk 3"],
  "persoonlijkheid_toelichting": ["korte toelichting per kenmerk"],
  "emotioneel_profiel": ["observatie 1", "observatie 2"],
  "koopgedrag": ["kenmerk 1", "kenmerk 2"],
  "advertentieprofiel": {
    "waarde": "hoog/middel/laag",
    "beste_moment": "...",
    "doelgroep": "...",
    "methode": "..."
  },
  "opvallendste_observatie": "Één zin die de bezoeker het meest zal verrassen.",
  "gezicht_observatie": "Één concrete zin over wat het gezicht verriet dat woorden niet zeiden."
}

Geef ALLEEN de JSON terug, geen uitleg eromheen.`;

const FALLBACK_PROFILE = {
  persoonlijkheid: ['Analytisch', 'Selectief', 'Onafhankelijk'],
  persoonlijkheid_toelichting: [
    'Langere pauzes bij ambigue kaarten duiden op systematische verwerking',
    'Selectief patroon in swipe-keuzes wijst op duidelijke persoonlijke normen',
    'Antwoorden zijn beknopt en zonder sociale wenselijkheid geformuleerd',
  ],
  emotioneel_profiel: [
    'Gecontroleerde emotieregulatie — nauwelijks zichtbare aarzeling',
    'Verhoogde alertheid bij morele keuzes; beslissingstijd stijgt met 40%',
  ],
  koopgedrag: [
    'Prijs-kwaliteitsgericht, weinig impulsaankopen',
    'Loyaal aan vertrouwde merken; wantrouwig tegenover nieuwe aanbieders',
  ],
  advertentieprofiel: {
    waarde: 'middel',
    beste_moment: 'Avond 20:00–22:00, na een gestructureerde dag',
    doelgroep: '28–42, stedelijk, hoger opgeleid, skeptisch t.a.v. reclame',
    methode: 'Long-form content, vertrouwensopbouw via feiten — geen emotionele triggers',
  },
  opvallendste_observatie:
    'Je aarzelt precies lang genoeg om te verraden dat je twijfelt — maar kort genoeg zodat niemand het ziet.',
  gezicht_observatie:
    'Je neutrale uitdrukking was te neutraal — mensen die niets verraden, verbergen altijd iets.',
};

io.on('connection', (socket) => {
  console.log(`[+] Client verbonden: ${socket.id}`);

  socket.on('session:analyze', async (sessionData) => {
    console.log('[~] Sessie ontvangen, Claude wordt geraadpleegd...');

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analyseer deze bezoekersdata en genereer een profiel:\n\n${JSON.stringify(sessionData, null, 2)}`,
          },
        ],
      });

      const text = message.content[0].text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) throw new Error('Geen JSON gevonden in response');

      const profile = JSON.parse(jsonMatch[0]);
      console.log('[+] Profiel gegenereerd, verzenden naar clients...');
      io.emit('profile:ready', profile);
    } catch (err) {
      console.error('[!] Claude API fout:', err.message);
      console.log('[~] Fallback profiel wordt gebruikt...');
      io.emit('profile:ready', FALLBACK_PROFILE);
    }
  });

  socket.on('session:reset', () => {
    console.log('[~] Reset ontvangen, alle clients worden gereset...');
    io.emit('session:reset');
  });

  socket.on('disconnect', () => {
    console.log(`[-] Client verbroken: ${socket.id}`);
  });
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n[De Spiegel] Server actief op poort ${PORT}`);
  console.log(`  Scherm app: http://localhost:5173`);
  console.log(`  Tablet app: http://localhost:5174\n`);
});
