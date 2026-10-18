import React, { useEffect, useRef, useState } from 'react';
import Icon from './ArcadeIcon';
import { Avatar } from './SonicRoster';
import './JokerChao.css';

export const JOKERS = {
  double: {
    name: 'Double mise',
    rule: 'Les points de l’orga sont doublés.',
    accent: '#ff2d55',
    mate: '#ffd166'
  },
  filet: {
    name: 'Filet',
    rule: 'La moyenne des autres, ou tes points s’ils sont plus hauts.',
    accent: '#14d6c8',
    mate: '#d9fff6'
  },
  seconde: {
    name: 'Seconde main',
    rule: 'Deux réponses. La plus haute est retenue.',
    accent: '#ff8a00',
    mate: '#ffe08a'
  },
  copie: {
    name: 'Copie',
    rule: 'Vois la réponse d\'un autre joueur.',
    accent: '#c084fc',
    mate: '#f3e8ff'
  },
  indice: {
    name: 'Indice gratuit',
    rule: 'Un indice de l’organisateur, sans perdre de point.',
    accent: '#f5c542',
    mate: '#ff9f1c'
  },
  silence: {
    name: 'Silence',
    rule: 'Un joueur ne peut plus répondre.',
    accent: '#9aa8b8',
    mate: '#e8eef4'
  },
  vol: {
    name: 'Vol',
    rule: 'Vois les réponses, puis prends les points d\'un joueur.',
    accent: '#ff3d8a',
    mate: '#ffd0e4'
  },
  melange: {
    name: 'Mélange',
    rule: 'Les réponses sont redistribuées au hasard.',
    accent: '#3ddc84',
    mate: '#d9ff6a'
  },
  pot: {
    name: 'Pot commun',
    rule: 'Les points de la question sont partagés.',
    accent: '#f0a202',
    mate: '#ff7a3c'
  },
  renversement: {
    name: 'Renversement',
    rule: 'Le classement des points se retourne.',
    accent: '#6366f1',
    mate: '#c7d2fe'
  },
  toutourien: {
    name: 'Tout ou rien',
    rule: 'Si tu marques, tu prends le plus haut score. Sinon, 0.',
    accent: '#ff2424',
    mate: '#ffd000'
  },
  gambling: {
    name: 'Gambling',
    rule: 'À la distribution, entre 0 et le plus haut donné par le chef.',
    accent: '#e8c547',
    mate: '#ff2a3c'
  },
  rumeur: {
    name: 'Rumeur',
    rule: 'Tu vois une réponse dès que deux joueurs l\'ont écrite.',
    accent: '#d946ef',
    mate: '#fae8ff'
  },
  bouclier: {
    name: 'Bouclier',
    rule: 'Protège de Vol. Annule un Silence.',
    accent: '#3b82f6',
    mate: '#dbeafe'
  }
};

const CARD_ART = {
  double: '/double.png',
  filet: '/filet.png?v=2',
  seconde: '/seconde.png',
  copie: '/copie.png',
  indice: '/indice.png',
  silence: '/silence-faker.png',
  vol: '/vol.png',
  melange: '/melange.gif',
  pot: '/pot.png?v=2',
  renversement: '/renversement.png',
  toutourien: '/toutourien.png',
  gambling: '/gambling.png',
  rumeur: '/rumeur.png',
  bouclier: '/bouclier.png'
};

export const TABLE_DROP = new Set(['melange', 'pot', 'renversement']);

// Un fichier par carte, ou `drop` pour le son commun.
// Ex. double: '/sounds/jokers/double.mp3'
const DROP_SOUNDS = {
  double: '/sounds/jokers/double.mp3',
  filet: '/sounds/jokers/filet.mp3',
  seconde: '/sounds/jokers/seconde.mp3',
  copie: '/sounds/jokers/copie.mp3',
  indice: '/sounds/jokers/indice.mp3',
  silence: '/sounds/jokers/silence.mp3',
  vol: '/sounds/jokers/vol.mp3',
  melange: '/sounds/jokers/melange.mp3',
  pot: '/sounds/jokers/pot.mp3?v=3',
  renversement: '/sounds/jokers/renversement.mp3',
  bouclier: '/sounds/jokers/bouclier.mp3',
  toutourien: '/sounds/jokers/toutourien.mp3',
  rumeur: '/sounds/jokers/rumeur.mp3',
  gambling: '/sounds/jokers/gambling.mp3'
};

function soundSrc(cardId) {
  return DROP_SOUNDS[cardId] || DROP_SOUNDS.drop || '';
}

const readySounds = new Map();

// Le lecteur média demande le mp3 par morceaux et peut rester bloqué longtemps.
// On télécharge le fichier entier, puis la lecture part tout de suite.
function prepareDropSound(cardId) {
  const src = soundSrc(cardId);
  if (!src) return Promise.resolve('');
  if (!readySounds.has(src)) {
    readySounds.set(src, fetch(src).then((response) => {
      if (!response.ok) throw new Error('sound');
      return response.arrayBuffer();
    }).then((buffer) => URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }))).catch(() => src));
  }
  return readySounds.get(src);
}

function audioFromUrl(url) {
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.volume = 0.85;
  return audio;
}

function rewind(audio) {
  try {
    audio.currentTime = 0;
  } catch {
    /* pas encore cherchable */
  }
}

// Le clic autorise le son. On le coupe tout de suite pour le relancer au retournement.
function unlockAudio(audio) {
  if (!audio || audio.dataset.live === '1') return;
  audio.volume = 0;
  const pending = audio.play();
  if (pending && pending.then) {
    pending.then(() => {
      if (audio.dataset.live === '1') return;
      audio.pause();
      rewind(audio);
    }).catch(() => {});
  }
}

export function playDropSound(cardId, armed) {
  const start = (audio) => {
    if (!audio) return;
    audio.dataset.live = '1';
    audio.volume = 0.85;
    rewind(audio);
    const pending = audio.play();
    if (pending && pending.catch) pending.catch(() => {});
  };
  if (armed) {
    start(armed);
    return;
  }
  if (!soundSrc(cardId)) {
    playCardVoice(cardId);
    return;
  }
  prepareDropSound(cardId).then((url) => {
    if (url) start(audioFromUrl(url));
    else playCardVoice(cardId);
  });
}

Object.keys(DROP_SOUNDS).forEach(prepareDropSound);

let clingCtx = null;

function clingContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!clingCtx) clingCtx = new AudioCtx();
  return clingCtx;
}

export function unlockCling() {
  const ctx = clingContext();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function voiceBus() {
  const ctx = clingContext();
  if (!ctx) return null;
  if (ctx.state === 'suspended') ctx.resume();
  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);
  return { ctx, master, now: ctx.currentTime };
}

function tone(ctx, dest, when, freq, dur, peak, type = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(freq, 1), when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.03);
}

function glide(ctx, dest, when, from, to, dur, peak, type = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(from, 1), when);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), when + dur);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.03);
}

function metal(ctx, dest, when, freq, dur, peak) {
  [1, 2, 2.76, 4.07, 5.4].forEach((ratio, index) => {
    tone(ctx, dest, when, freq * ratio, dur * (1 - index * 0.1), peak * [1, 0.48, 0.28, 0.14, 0.07][index]);
  });
}

function burst(ctx, dest, when, dur, freq, q, peak, freqTo) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq, when);
  if (freqTo) filter.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 1), when + dur);
  filter.Q.value = q;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  src.buffer = buffer;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(when);
  src.stop(when + dur + 0.02);
}

export function playCardCling() {
  const bus = voiceBus();
  if (!bus) return;
  const { ctx, master, now } = bus;
  burst(ctx, master, now, 0.05, 6800, 8, 0.7);
  burst(ctx, master, now, 0.08, 2100, 1.4, 0.35);
  metal(ctx, master, now, 620, 0.62, 0.16);
  metal(ctx, master, now + 0.06, 980, 0.5, 0.12);
  metal(ctx, master, now + 0.11, 1480, 0.42, 0.1);
  [1865, 2349, 2960, 3729, 4699].forEach((freq, index) => {
    metal(ctx, master, now + 0.15 + index * 0.04, freq, 0.2, 0.035);
  });
}

/* ——— Sons de l'éclosion, façon Sonic et Jardin des Chao ———
 * Par défaut ils sont synthétisés. Pour mettre les vrais sons du jeu, déposer les fichiers dans
 * client/public/sounds/booster/ et les déclarer dans index.json (voir le README du dossier) :
 * chaque son déclaré remplace sa version synthétisée, les autres restent synthétisés.
 */
const SAMPLE_DIR = `${process.env.PUBLIC_URL || ''}/sounds/booster`;
const sampleBuffers = {};
const sampleElements = {};
let samplesLoad = null;

const sampleUrl = (file) => (/^https?:\/\//i.test(file) ? file : `${SAMPLE_DIR}/${encodeURIComponent(file)}`);

// Si le site du son refuse la lecture directe (CORS), on passe par une balise audio classique.
const elementFallback = (key, url) => new Promise((resolve) => {
  try {
    const audio = new window.Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.addEventListener('canplaythrough', () => {
      sampleElements[key] = audio;
      resolve();
    }, { once: true });
    audio.addEventListener('error', () => resolve(), { once: true });
    audio.load();
  } catch (error) {
    resolve();
  }
});

export function loadBoosterSamples() {
  if (samplesLoad) return samplesLoad;
  const ctx = clingContext();
  if (!ctx || typeof fetch !== 'function') {
    samplesLoad = Promise.resolve();
    return samplesLoad;
  }
  const decode = (data) => new Promise((resolve) => {
    ctx.decodeAudioData(data, resolve, () => resolve(null));
  });
  samplesLoad = fetch(`${SAMPLE_DIR}/index.json`, { cache: 'no-cache' })
    .then((response) => (response.ok ? response.json() : {}))
    .then((list) => Promise.all(Object.entries(list || {})
      .filter(([, file]) => typeof file === 'string' && file.trim())
      .map(([key, file]) => {
        const url = sampleUrl(file.trim());
        return fetch(url)
          .then((response) => (response.ok ? response.arrayBuffer() : null))
          .then((data) => (data ? decode(data) : null))
          .then((buffer) => {
            if (buffer) sampleBuffers[key] = buffer;
            else if (/^https?:\/\//i.test(file)) return elementFallback(key, url);
            return null;
          })
          .catch(() => (/^https?:\/\//i.test(file) ? elementFallback(key, url) : null));
      })))
    .catch(() => null);
  return samplesLoad;
}

// Joue un vrai son s'il a été déposé ; renvoie false sinon (on garde alors la version synthétisée).
function sample(key, ctx, dest, when, { gain = 1, rate = 1, pan = 0 } = {}) {
  const buffer = sampleBuffers[key];
  if (!buffer) {
    const element = sampleElements[key];
    if (!element) return false;
    const delay = Math.max(0, (when - ctx.currentTime) * 1000);
    window.setTimeout(() => {
      const copy = element.cloneNode();
      copy.volume = Math.min(1, gain);
      copy.playbackRate = rate;
      copy.preservesPitch = false;
      copy.play().catch(() => {});
    }, delay);
    return true;
  }
  const src = ctx.createBufferSource();
  const level = ctx.createGain();
  src.buffer = buffer;
  src.playbackRate.value = rate;
  level.gain.value = gain;
  src.connect(level);
  if (pan && ctx.createStereoPanner) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    level.connect(panner);
    panner.connect(dest);
  } else {
    level.connect(dest);
  }
  src.start(when);
  return true;
}

// Petit cri de Chao : glissando aigu avec un vibrato rapide, comme un « tchiou ! ».
function chaoChirp(ctx, dest, when, from, to, dur, peak) {
  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, when);
  osc.frequency.exponentialRampToValueAtTime(to, when + dur * 0.6);
  osc.frequency.exponentialRampToValueAtTime(to * 0.92, when + dur);
  lfo.frequency.value = 26;
  depth.gain.value = from * 0.05;
  lfo.connect(depth);
  depth.connect(osc.frequency);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(when);
  lfo.start(when);
  osc.stop(when + dur + 0.03);
  lfo.stop(when + dur + 0.03);
}

// Chaque coup sur l'œuf : coquille qui craque + petit cri de Chao, un peu plus aigu à chaque fois.
function playEggKnock(step) {
  const bus = voiceBus();
  if (!bus) return;
  const { ctx, master, now } = bus;
  if (!sample('crack', ctx, master, now, { rate: 1 + step * 0.06 })) {
    burst(ctx, master, now, 0.05, 3200 + step * 400, 2.5, 0.38, 1800);
    burst(ctx, master, now + 0.01, 0.09, 900, 1.2, 0.18, 400);
  }
  // Un seul cri de Chao, sur le dernier coup.
  if (step < EGG_TAPS) return;
  if (!sample('chirp', ctx, master, now + 0.05, { gain: 0.6 })) {
    chaoChirp(ctx, master, now + 0.05, 1180, 1900, 0.16, 0.08);
  }
}

// L'éclosion : l'œuf se charge comme un Spin Dash, éclate en pluie d'anneaux,
// puis le Chao pousse un cri joyeux sur un petit carillon.
function playOpeningScore() {
  const bus = voiceBus();
  if (!bus) return;
  const { ctx, master, now } = bus;
  const splitAt = 2.4;
  const pullAt = 3.12;

  // Charge façon Spin Dash : des « vroum » de plus en plus aigus et rapprochés.
  const revs = [0, 0.62, 1.1, 1.48, 1.78, 2.02, 2.2];
  revs.forEach((at, index) => {
    const when = now + at;
    // Le vrai Spin Dash monte d'un cran à chaque relance, comme dans le jeu.
    if (sample('rev', ctx, master, when, { rate: 1 + index * 0.09, gain: 0.8 })) return;
    const base = 160 + index * 70;
    glide(ctx, master, when, base, base * 3.2, 0.32, 0.07 + index * 0.012, 'square');
    burst(ctx, master, when, 0.3, 900 + index * 300, 1.4, 0.05 + index * 0.01, 3200 + index * 500);
  });

  // Éclatement : coquille, souffle et pluie d'anneaux de part et d'autre.
  const boom = now + splitAt;
  if (!sample('hatch', ctx, master, boom)) {
    burst(ctx, master, boom, 0.22, 140, 0.4, 0.5, 60);
    burst(ctx, master, boom, 0.12, 4200, 0.9, 0.24, 900);
    burst(ctx, master, boom + 0.02, 0.5, 1200, 0.5, 0.12, 200);
  }
  sample('rings', ctx, master, boom + 0.04);

  // Le Chao sort : trois petits cris qui montent, puis un carillon majeur.
  const rise = now + pullAt;
  if (!sample('happy', ctx, master, rise, { gain: 0.55 })) {
    chaoChirp(ctx, master, rise, 820, 1320, 0.14, 0.12);
    chaoChirp(ctx, master, rise + 0.16, 900, 1480, 0.14, 0.12);
    chaoChirp(ctx, master, rise + 0.32, 1040, 1860, 0.24, 0.14);
  }
}

// La carte apparaît : seulement si un vrai son « ring » est déclaré dans index.json.
function playHatchReveal() {
  const bus = voiceBus();
  if (!bus) return;
  const { ctx, master, now } = bus;
  sample('ring', ctx, master, now);
}

function playCardVoice(cardId) {
  const bus = voiceBus();
  if (!bus) return;
  const { ctx, master, now } = bus;
  if (cardId === 'double') {
    metal(ctx, master, now, 880, 0.26, 0.14);
    metal(ctx, master, now + 0.11, 1320, 0.3, 0.16);
  } else if (cardId === 'filet') {
    burst(ctx, master, now, 0.34, 2200, 1.1, 0.42, 380);
    tone(ctx, master, now + 0.08, 520, 0.18, 0.1, 'triangle');
  } else if (cardId === 'seconde') {
    burst(ctx, master, now, 0.05, 1400, 2, 0.4);
    tone(ctx, master, now + 0.04, 660, 0.16, 0.14);
    tone(ctx, master, now + 0.2, 660, 0.22, 0.07);
  } else if (cardId === 'copie') {
    tone(ctx, master, now, 880, 0.08, 0.12, 'square');
    tone(ctx, master, now + 0.12, 660, 0.1, 0.1, 'square');
    tone(ctx, master, now + 0.26, 880, 0.08, 0.08, 'square');
  } else if (cardId === 'indice') {
    metal(ctx, master, now, 1568, 0.42, 0.11);
    metal(ctx, master, now + 0.08, 2093, 0.38, 0.09);
    metal(ctx, master, now + 0.18, 2637, 0.26, 0.05);
    tone(ctx, master, now + 0.04, 784, 0.32, 0.04, 'triangle');
  } else if (cardId === 'silence') {
    burst(ctx, master, now, 0.28, 3400, 0.65, 0.34, 700);
    burst(ctx, master, now + 0.2, 0.03, 4600, 7, 0.42);
    tone(ctx, master, now + 0.2, 86, 0.4, 0.09, 'sine');
  } else if (cardId === 'vol') {
    burst(ctx, master, now, 0.28, 420, 0.8, 0.5, 3600);
    burst(ctx, master, now + 0.16, 0.04, 2400, 4, 0.35);
  } else if (cardId === 'melange') {
    [0, 0.05, 0.1, 0.15, 0.21].forEach((delay, index) => {
      burst(ctx, master, now + delay, 0.04, 900 + index * 280, 3, 0.32);
    });
  } else if (cardId === 'pot') {
    metal(ctx, master, now, 980, 0.18, 0.1);
    metal(ctx, master, now + 0.12, 740, 0.2, 0.1);
    metal(ctx, master, now + 0.24, 520, 0.26, 0.12);
    tone(ctx, master, now + 0.26, 140, 0.2, 0.12, 'sine');
  } else if (cardId === 'renversement') {
    tone(ctx, master, now, 1480, 0.07, 0.12, 'sine');
    tone(ctx, master, now + 0.08, 1860, 0.07, 0.1, 'sine');
    tone(ctx, master, now + 0.16, 980, 0.08, 0.1, 'triangle');
    glide(ctx, master, now + 0.22, 1400, 180, 0.38, 0.13, 'triangle');
    burst(ctx, master, now + 0.22, 0.32, 1800, 0.6, 0.22, 220);
  } else if (cardId === 'toutourien') {
    glide(ctx, master, now, 160, 820, 0.32, 0.12, 'sawtooth');
    metal(ctx, master, now + 0.3, 196, 0.4, 0.18);
    burst(ctx, master, now + 0.3, 0.08, 900, 2, 0.4);
  } else if (cardId === 'gambling') {
    [0, 0.09, 0.18].forEach((delay) => burst(ctx, master, now + delay, 0.035, 1800, 5, 0.34));
    metal(ctx, master, now + 0.32, 1046, 0.28, 0.12);
  } else if (cardId === 'rumeur') {
    burst(ctx, master, now, 0.62, 640, 0.55, 0.2, 280);
    tone(ctx, master, now + 0.02, 196, 0.5, 0.04, 'triangle');
    tone(ctx, master, now + 0.06, 247, 0.46, 0.032, 'triangle');
    tone(ctx, master, now + 0.1, 294, 0.42, 0.028, 'triangle');
    burst(ctx, master, now + 0.44, 0.04, 2400, 4, 0.28);
  } else if (cardId === 'bouclier') {
    burst(ctx, master, now, 0.06, 1700, 1.6, 0.55);
    burst(ctx, master, now, 0.04, 4400, 3.2, 0.26);
    metal(ctx, master, now, 112, 0.9, 0.22);
    metal(ctx, master, now + 0.02, 740, 0.55, 0.1);
    metal(ctx, master, now + 0.04, 1560, 0.38, 0.06);
  }
}

/* ——————————————————————— Cartes « Jardin des Chao » ——————————————————————— */

// Rôle (bulle d’émotion), couleurs lisibles sur fond clair, rareté (fruits) et aura des cartes rares.
const CHAO = {
  double: { mood: '!', accent: '#ff2d55', pastel: '#ffe1e7', fruits: ['round', 'tri', 'heart'], aura: true },
  filet: { mood: 'heart', accent: '#14a89c', pastel: '#d6fff6', fruits: ['round'] },
  seconde: { mood: '?', accent: '#ff8a00', pastel: '#ffe9c7', fruits: ['round', 'tri'] },
  copie: { mood: '?', accent: '#a26be8', pastel: '#efe3ff', fruits: ['round', 'tri'] },
  indice: { mood: '?', accent: '#e0a400', pastel: '#fff3c4', fruits: ['round'] },
  silence: { mood: '!', accent: '#6f7d93', pastel: '#e8eef4', fruits: ['round', 'tri'] },
  vol: { mood: '!', accent: '#ff3d8a', pastel: '#ffe0ee', fruits: ['round', 'tri', 'heart'] },
  melange: { mood: '!', accent: '#2fb86b', pastel: '#ddffe9', fruits: ['round', 'tri'] },
  pot: { mood: '?', accent: '#e08a00', pastel: '#ffeccc', fruits: ['round', 'tri'] },
  renversement: { mood: '!', accent: '#6366f1', pastel: '#e3e6ff', fruits: ['round', 'tri', 'heart'] },
  toutourien: { mood: '!', accent: '#ff2424', pastel: '#ffe0dc', fruits: ['round', 'tri', 'heart'], aura: true },
  gambling: { mood: '!', accent: '#d9a400', pastel: '#fff3c4', fruits: ['round', 'tri', 'heart'], aura: true },
  rumeur: { mood: '?', accent: '#c13fd8', pastel: '#fae3ff', fruits: ['round'] },
  bouclier: { mood: 'heart', accent: '#3b82f6', pastel: '#dbeafe', fruits: ['round', 'heart'] }
};
const MOOD_BALL = { '!': '#ffd23a', '?': '#8fd8ff', heart: '#ff9ac0' };

const chaoOf = (cardId) => CHAO[cardId] || { mood: '?', accent: JOKERS[cardId]?.accent || '#3b82f6', pastel: '#eef3ff', fruits: ['round'] };

/** Rareté d’une carte (1 à 3) : nombre de fruits. Sert aussi à la couleur de l’œuf. */
export const jokerRarity = (cardId) => chaoOf(cardId).fruits.length;

const chaoStyle = (cardId) => {
  const c = chaoOf(cardId);
  return { '--a': c.accent, '--p': c.pastel, '--b': MOOD_BALL[c.mood] };
};

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.2 5 6.6 5c2 0 3.5 1.1 4.4 2.6l1 1.5 1-1.5C13.9 6.1 15.4 5 17.4 5c3.4 0 5.4 3.6 4.1 6.8C19.5 16.4 12 21 12 21z" fill="#0a1f6b" />
  </svg>
);

const VOL_RINGS = [[-90, -60], [-60, -90], [-20, -110], [20, -105], [60, -88], [92, -55], [-110, -20], [110, -18]]
  .map(([x, y], i) => ({ x: `${x / 16}em`, y: `${y / 16}em`, d: `${i * 0.03}s` }));
const POT_RINGS = [-60, -36, -12, 12, 36, 60, -84, 84]
  .map((x, i) => ({ s: `${((i % 2 ? 1 : -1) * 40) / 16}em`, x: `${(x * 1.4) / 16}em`, d: `${i * 0.06}s` }));

/** Effet signature de chaque carte, rejoué quand on l’obtient ou qu’on la joue. */
const CardFx = ({ cardId }) => {
  switch (cardId) {
    case 'double':
      return <><i className="jcx-ring l" /><i className="jcx-ring r" /><b className="jcx-x2">×2</b></>;
    case 'filet':
      return (
        <>
          <i className="jcx-net" />
          <i className="jcx-spark" style={{ left: '30%', top: '40%' }} />
          <i className="jcx-spark" style={{ left: '60%', top: '30%' }} />
          <i className="jcx-spark" style={{ left: '48%', top: '60%' }} />
        </>
      );
    case 'copie':
      return <><i className="jcx-ghost" /><i className="jcx-ghost" style={{ '--d': '0.12s' }} /><i className="jcx-ghost" style={{ '--d': '0.24s' }} /></>;
    case 'silence':
      return (
        <svg className="jcx-mute" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#fff" stroke="#0a1f6b" strokeWidth="1.6" />
          <path d="M5 10h3l4-3.5v11L8 14H5z" fill="#0a1f6b" />
          <path d="M15 9.5l4.5 5M19.5 9.5l-4.5 5" stroke="#ff2347" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'vol':
      return <>{VOL_RINGS.map((r) => <i key={`${r.x}${r.y}`} className="jcx-r" style={{ '--x': r.x, '--y': r.y, '--d': r.d }} />)}</>;
    case 'gambling':
      return (
        <span className="jcx-slots">
          {['0s', '0.25s', '0.5s'].map((d) => (
            <span key={d} className="jcx-reel">
              <span className="jcx-strip" style={{ '--d': d }}><i className="o" /><i className="t" /><i className="o" /><i className="t" /><i className="o" /><i className="h" /></span>
            </span>
          ))}
        </span>
      );
    case 'bouclier':
      return <i className="jcx-shield" />;
    case 'indice':
      return <span className="jcx-tip">Psst ! Un indice !</span>;
    case 'seconde':
      return <><span className="jcx-ans a1"><b>1</b></span><span className="jcx-ans a2"><b>2</b></span></>;
    case 'melange':
      return <><i className="jcx-mini m1" style={{ '--c': '#ff7aa8' }} /><i className="jcx-mini m2" style={{ '--c': '#8fd8ff' }} /><i className="jcx-mini m3" style={{ '--c': '#ffd23a' }} /></>;
    case 'pot':
      return <>{POT_RINGS.map((r) => <i key={r.x} className="jcx-pot" style={{ '--s': r.s, '--x': r.x, '--d': r.d }} />)}</>;
    case 'renversement':
      return (
        <svg className="jcx-arrows" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#fff" stroke="#0a1f6b" strokeWidth="1.6" />
          <path d="M8.5 6v12M8.5 6 6 8.5M8.5 6 11 8.5M15.5 18V6M15.5 18 13 15.5M15.5 18l2.5-2.5" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case 'toutourien':
      return <><b className="jcx-allin t">TOUT !</b><b className="jcx-allin r">RIEN</b></>;
    case 'rumeur':
      return (
        <>
          <span className="jcx-whisper w1" style={{ '--d': '0s' }}>…</span>
          <span className="jcx-whisper w2" style={{ '--d': '0.25s' }}>psst</span>
          <span className="jcx-whisper w3" style={{ '--d': '0.5s' }}>…</span>
        </>
      );
    default:
      return null;
  }
};

export const JokerCard = ({ cardId, used = false, size = 'full', slam = false, reveal = false, quiet = false }) => {
  const card = JOKERS[cardId];
  const played = useRef(used);
  const [dropping, setDropping] = useState(false);
  const [impact, setImpact] = useState(false);

  useEffect(() => {
    if (!card) return undefined;
    const justPlayed = used && !played.current;
    played.current = used;
    if (!slam && !justPlayed) return undefined;
    setDropping(true);
    const onTable = slam || size !== 'hand' || TABLE_DROP.has(cardId);
    if (!quiet && (slam || (size === 'hand' && !onTable))) playDropSound(cardId);
    const timer = setTimeout(() => setDropping(false), 2400);
    return () => clearTimeout(timer);
  }, [used, slam, cardId, size, card, quiet]);

  useEffect(() => {
    if (!reveal) return undefined;
    setImpact(true);
    const timer = setTimeout(() => setImpact(false), 2400);
    return () => clearTimeout(timer);
  }, [reveal]);

  if (!card) return null;
  const chao = chaoOf(cardId);
  const art = CARD_ART[cardId];

  const tilt = (event) => {
    const node = event.currentTarget;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    node.style.setProperty('--ry', `${(px - 0.5) * 12}deg`);
    node.style.setProperty('--rx', `${(0.5 - py) * 10}deg`);
  };
  const untilt = (event) => {
    const node = event.currentTarget;
    node.style.removeProperty('--rx');
    node.style.removeProperty('--ry');
  };

  const playing = dropping || impact;
  const classes = [
    'jc',
    `jc-${size}`,
    used ? 'is-used' : '',
    dropping && slam ? 'is-slam' : '',
    dropping && !slam ? 'is-drop' : '',
    impact ? 'is-reveal' : '',
    playing ? 'is-play' : '',
    chao.aura ? 'has-aura' : ''
  ].filter(Boolean).join(' ');

  return (
    <article className={classes} data-card={cardId} style={chaoStyle(cardId)} onMouseMove={tilt} onMouseLeave={untilt}>
      {size !== 'mini' && (
        <span className="jc-ball" aria-hidden="true">{chao.mood === 'heart' ? <HeartIcon /> : <b>{chao.mood}</b>}</span>
      )}
      <div className="jc-card">
        <div className="jc-in">
          <i className="jc-shell" aria-hidden="true" />
          <div className="jc-name"><span>{card.name}</span></div>
          <div className="jc-art">
            <div className="jc-bubble">{art && <img src={art} alt="" draggable={false} />}</div>
          </div>
          {size === 'full' ? (
            <div className="jc-ground">
              <span className="jc-fruits" aria-label={`Rareté ${chao.fruits.length} sur 3`}>
                {chao.fruits.map((f, i) => <i key={`${f}-${i}`} className={f} />)}
              </span>
              <p className="jc-rule">{card.rule}</p>
            </div>
          ) : <div className="jc-grass" />}
          {used && <div className="jc-stamp">Jouée</div>}
        </div>
      </div>
      {playing && <span className="jc-fx" aria-hidden="true"><CardFx cardId={cardId} /></span>}
    </article>
  );
};

const TABLE_TEXT = {
  melange: { banner: 'Mélange !', who: (n) => `${n} mélange les réponses`, none: 'Les réponses sont mélangées' },
  pot: { banner: 'Pot commun !', who: (n) => `${n} met les points au pot`, none: 'Les points partent au pot' },
  renversement: { banner: 'Renversement !', who: (n) => `${n} renverse le classement`, none: 'Le classement se renverse' }
};
const TABLE_CHIPS = ['?', '?', '?', '?', '?', '?'].map((text, i) => ({ text, a: `${i * 60}deg` }));
const TABLE_RINGS = Array.from({ length: 14 }, (_, i) => ({ a: `${i * (360 / 14)}deg`, d: `${i * 0.05}s` }));

/** Carte de table jouée : elle traverse l’écran, s’écrase au centre et agit sur toute la partie. */
export const TableDrop = ({ cardId, username = '', quiet = false }) => {
  const who = username.trim();
  const text = TABLE_TEXT[cardId] || { banner: `${JOKERS[cardId]?.name || 'Joker'} !`, who: (n) => `${n} joue une carte`, none: 'Une carte est jouée' };
  const caption = who ? text.who(who) : text.none;
  return (
    <div className={`jt jt-${cardId}`} role="status">
      <i className="jt-dim" aria-hidden="true" />
      <i className="jt-lines" aria-hidden="true" />
      <i className="jt-wave" aria-hidden="true" />
      <i className="jt-wave w2" aria-hidden="true" />
      {cardId === 'renversement' && (
        <svg className="jt-arrows" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2.5" strokeDasharray="7 6" />
          <path d="M50 0 l13 12 h-26z M50 100 l-13 -12 h26z" fill="#ffd23a" stroke="#08164d" strokeWidth="1.6" />
        </svg>
      )}
      {cardId === 'melange' && (
        <div className="jt-orbit" aria-hidden="true">
          {TABLE_CHIPS.map((c) => <span key={c.a} className="jt-chip" style={{ '--a': c.a }}>{c.text}</span>)}
        </div>
      )}
      {cardId === 'pot' && TABLE_RINGS.map((r) => <i key={r.a} className="jt-ring" style={{ '--a': r.a, '--d': r.d }} aria-hidden="true" />)}
      <div className="jt-banner" aria-hidden="true"><span>{text.banner}</span></div>
      <div className="jt-card">
        <JokerCard cardId={cardId} size="full" slam quiet={quiet} />
      </div>
      <i className="jt-flash" aria-hidden="true" />
      <p className="jt-cap">{caption}</p>
    </div>
  );
};

/* ——————————————————————— Booster : œuf de Chao ——————————————————————— */

const EGG_RINGS = Array.from({ length: 10 }, (_, i) => {
  const a = ((-160 + i * 15.5) * Math.PI) / 180;
  return { x: `${Math.round(Math.cos(a) * 240)}px`, y: `${Math.round(Math.sin(a) * 210 - 40)}px`, d: `${(i % 3) * 0.05}s` };
});
const EGG_FRUITS = Array.from({ length: 14 }, (_, i) => ({
  k: ['o', 'h', 't'][i % 3],
  x: `${5 + ((i * 37) % 90)}%`,
  d: `${(i % 5) * 0.18}s`,
  r: `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`
}));
const EGG_PATH = 'M95 4C150 4 186 90 186 150C186 206 146 236 95 236C44 236 4 206 4 150C4 90 40 4 95 4Z';
// Toutes les cartes ont la même chance de sortir : chaque éclosion a donc le même spectacle arc-en-ciel.
const EGG_HATCH = { label: 'Œuf du Chaos !!', tone: 'r3' };
const EGG_TAPS = 3;
const EGG_CHIPS = Array.from({ length: 6 }, (_, i) => {
  const a = ((-150 + i * 24) * Math.PI) / 180;
  return { x: `${Math.round(Math.cos(a) * 120)}px`, y: `${Math.round(Math.sin(a) * 110)}px`, r: `${(i % 2 ? 1 : -1) * (90 + i * 40)}deg` };
});
const EGG_SPARKS = Array.from({ length: 16 }, (_, i) => ({
  x: `${4 + ((i * 41) % 92)}%`,
  y: `${8 + ((i * 29) % 70)}%`,
  d: `${(i % 6) * 0.22}s`
}));

let eggSerial = 0;

const ChaoEgg = ({ kind }) => {
  const [uid] = useState(() => {
    eggSerial += 1;
    return `egg${eggSerial}`;
  });
  return (
    <svg viewBox="-8 -8 206 256" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-normal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".38" stopColor="#ffffff" /><stop offset=".38" stopColor="#cfe8ff" /><stop offset=".46" stopColor="#cfe8ff" />
          <stop offset=".46" stopColor="#ffffff" /><stop offset=".64" stopColor="#ffffff" /><stop offset=".64" stopColor="#9fd0ff" /><stop offset="1" stopColor="#7fbcff" />
        </linearGradient>
        <linearGradient id={`${uid}-shiny`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6c0" /><stop offset=".38" stopColor="#fff1a6" /><stop offset=".38" stopColor="#ffd23a" /><stop offset=".46" stopColor="#ffd23a" />
          <stop offset=".46" stopColor="#fff1a6" /><stop offset=".64" stopColor="#ffe27a" /><stop offset=".64" stopColor="#ffb800" /><stop offset="1" stopColor="#e59400" />
        </linearGradient>
        <linearGradient id={`${uid}-chaos`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7a7a" /><stop offset=".2" stopColor="#ffd36b" /><stop offset=".4" stopColor="#7dffb0" />
          <stop offset=".6" stopColor="#6bc8ff" /><stop offset=".8" stopColor="#c58bff" /><stop offset="1" stopColor="#ff8fd1" />
        </linearGradient>
        <clipPath id={`${uid}-top`}><polygon points="-10,-10 200,-10 200,120 167,106 144,130 120,108 95,132 70,108 46,130 23,106 -10,120" /></clipPath>
        <clipPath id={`${uid}-bottom`}><polygon points="-10,120 23,106 46,130 70,108 95,132 120,108 144,130 167,106 200,120 200,250 -10,250" /></clipPath>
      </defs>
      <g className="egg-bottom">
        <path className="egg-fill" clipPath={`url(#${uid}-bottom)`} d={EGG_PATH} fill={`url(#${uid}-${kind})`} />
        <path clipPath={`url(#${uid}-bottom)`} d={EGG_PATH} fill="none" stroke="#0a1f6b" strokeWidth="6" />
        <path clipPath={`url(#${uid}-bottom)`} d="M4 150C4 206 44 236 95 236C146 236 186 206 186 150" fill="none" stroke="rgba(10,31,107,.14)" strokeWidth="20" transform="translate(-6,-8)" />
      </g>
      <g className="egg-top">
        <path className="egg-fill" clipPath={`url(#${uid}-top)`} d={EGG_PATH} fill={`url(#${uid}-${kind})`} />
        <path clipPath={`url(#${uid}-top)`} d={EGG_PATH} fill="none" stroke="#0a1f6b" strokeWidth="6" />
        <ellipse cx="62" cy="54" rx="20" ry="12" fill="#fff" opacity=".8" transform="rotate(-30 62 54)" />
      </g>
      <path className="egg-crack" d="M4 120 L23 106 L46 130 L70 108 L95 132 L120 108 L144 130 L167 106 L186 120 M70 108 L78 86 M120 108 L114 84" fill="none" stroke="#0a1f6b" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export const BoosterOpening = ({ cardId }) => {
  // sealed → tap (1 à 3 coups) → charge (la lumière de la rareté filtre par les fêlures) → burst → rise → show
  const [stage, setStage] = useState('sealed');
  const [taps, setTaps] = useState(0);
  const timers = useRef([]);
  const idle = useRef(0);
  const armedSound = useRef(null);
  const prepared = useRef(Promise.resolve(null));

  useEffect(() => {
    loadBoosterSamples();
    return () => {
      timers.current.forEach(clearTimeout);
      window.clearTimeout(idle.current);
    };
  }, []);

  useEffect(() => {
    let dead = false;
    prepared.current = prepareDropSound(cardId).then((url) => {
      if (dead || !url) return null;
      const audio = audioFromUrl(url);
      armedSound.current = audio;
      return audio;
    });
    return () => {
      dead = true;
      armedSound.current?.pause();
    };
  }, [cardId]);

  // Son au moment où la carte finit de se retourner.
  useEffect(() => {
    if (stage !== 'show') return undefined;
    let dead = false;
    let voiceTimer = 0;
    const run = (audio) => {
      if (dead) return;
      playHatchReveal();
      voiceTimer = window.setTimeout(() => {
        if (!dead) playDropSound(cardId, audio);
      }, 520);
    };
    if (armedSound.current) run(armedSound.current);
    else prepared.current.then(run);
    return () => {
      dead = true;
      window.clearTimeout(voiceTimer);
    };
  }, [stage, cardId]);

  const hatch = () => {
    playOpeningScore();
    const wait = (next, ms) => {
      timers.current.push(setTimeout(() => setStage(next), ms));
    };
    setStage('charge');
    wait('burst', 2400);
    wait('rise', 2750);
    wait('show', 3900);
  };

  const knock = (count) => {
    window.clearTimeout(idle.current);
    setTaps(count);
    playEggKnock(count);
    if (count >= EGG_TAPS) {
      hatch();
      return;
    }
    setStage('tap');
    // Si le joueur ne tape plus, l'œuf continue tout seul.
    idle.current = window.setTimeout(() => knock(count + 1), 2600);
  };

  const tapEgg = () => {
    if (!cardId || (stage !== 'sealed' && stage !== 'tap')) return;
    if (stage === 'sealed') {
      unlockCling();
      if (armedSound.current) unlockAudio(armedSound.current);
      else prepared.current.then((audio) => unlockAudio(audio));
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        setStage('show');
        return;
      }
    }
    knock(taps + 1);
  };

  const card = JOKERS[cardId];
  const rank = EGG_HATCH;
  const hatched = stage === 'charge' || stage === 'burst' || stage === 'rise' || stage === 'show';
  let caption = 'Un œuf de Chao…';
  let sub = 'Tape l’œuf pour le faire éclore';
  if (!cardId) {
    caption = 'L’œuf arrive…';
    sub = '';
  } else if (stage === 'tap') {
    caption = taps === 1 ? 'Il bouge !' : 'Encore !';
    sub = '';
  } else if (stage === 'charge') {
    caption = 'Ça brille…';
    sub = '';
  } else if (stage === 'burst' || stage === 'rise') {
    caption = '';
    sub = '';
  } else if (stage === 'show' && card) {
    caption = card.name;
    sub = card.rule;
  }

  return (
    <div
      className={`egg-scene is-${stage} egg-normal${hatched ? ` egg-${rank.tone}` : ''}`}
      style={{ '--crack': Math.max(0, 1 - (hatched ? EGG_TAPS : taps) / EGG_TAPS) }}
    >
      <i className="egg-rays" aria-hidden="true" />
      <div className="egg-grass" aria-hidden="true" />
      {(stage === 'sealed' || stage === 'tap') && cardId && (
        <span className="egg-pips" aria-hidden="true">
          {Array.from({ length: EGG_TAPS }, (_, i) => <i key={i} className={i < taps ? 'is-on' : ''} />)}
        </span>
      )}
      <i className="egg-glow" aria-hidden="true" />
      <button
        type="button"
        className="egg-btn"
        onClick={tapEgg}
        disabled={(stage !== 'sealed' && stage !== 'tap') || !cardId}
        aria-label="Taper sur l’œuf"
      >
        <span className="egg-hit" key={`hit-${taps}`}>
          <ChaoEgg kind="normal" />
        </span>
      </button>
      {taps > 0 && (
        <span className="egg-chips" key={`chips-${taps}`} aria-hidden="true">
          {EGG_CHIPS.map((c) => <i key={c.x + c.y} style={{ '--x': c.x, '--y': c.y, '--r': c.r }} />)}
        </span>
      )}
      {EGG_RINGS.map((r) => <i key={`${r.x}${r.y}`} className="egg-ring" style={{ '--x': r.x, '--y': r.y, '--d': r.d }} aria-hidden="true" />)}
      {EGG_FRUITS.map((f, i) => (
        <i key={`fruit-${i}`} className={`egg-fruit ${f.k}`} style={{ left: f.x, '--d': f.d, '--r': f.r }} aria-hidden="true" />
      ))}
      {EGG_SPARKS.map((p, i) => (
        <i key={`spark-${i}`} className="egg-spark" style={{ left: p.x, top: p.y, '--d': p.d }} aria-hidden="true" />
      ))}
      <i className="egg-dim" aria-hidden="true" />
      <div className="egg-card">
        <div className="egg-flip">
          <div className="egg-front">
            {cardId && <JokerCard cardId={cardId} size="full" reveal={stage === 'show'} quiet />}
          </div>
          <div className="egg-back"><div className="jc"><div className="jc-back"><b>BL</b></div></div></div>
        </div>
      </div>
      {(stage === 'rise' || stage === 'show') && (
        <span className={`egg-rank ${rank.tone}`} aria-hidden="true">{rank.label}</span>
      )}
      <i className="egg-veil" aria-hidden="true" />
      {caption && (
        <p className="egg-cap" aria-live="polite">
          {caption}
          {sub && <small>{sub}</small>}
        </p>
      )}
    </div>
  );
};

const JOKER_DRAW = Object.keys(JOKERS);

export const BoosterPlayground = () => {
  const [pack, setPack] = useState(() => ({
    id: 1,
    card: JOKER_DRAW[Math.floor(Math.random() * JOKER_DRAW.length)]
  }));

  const again = () => {
    setPack((current) => ({
      id: current.id + 1,
      card: JOKER_DRAW[Math.floor(Math.random() * JOKER_DRAW.length)]
    }));
  };

  return (
    <div className="booster-play">
      <div style={{ textAlign: 'center' }}>
        <button type="button" className="btn" onClick={again}><Icon name="booster" />Encore un booster</button>
      </div>
      <BoosterOpening key={pack.id} cardId={pack.card} />
    </div>
  );
};

export const HostJokerBoard = ({ players, avatars = {} }) => {
  const rows = players || [];

  return (
    <div className="host-jokers">
      <div className="host-jokers-title"><Icon name="booster" bare /> Mains des joueurs</div>
      {rows.length === 0 && <p className="host-jokers-empty">Aucune carte pour l'instant.</p>}
      <div className="host-jokers-row">
        {rows.map((entry) => {
          const joker = entry.joker;
          return (
            <div key={entry.id} className="host-joker-slot">
              {joker ? (
                <JokerCard cardId={joker.card} used={joker.used} size="mini" />
              ) : (
                <div className="tcg-empty">Sans carte</div>
              )}
              <div className="host-joker-meta">
                <strong>
                  <Avatar id={avatars[entry.username]} fallbackName={entry.username} size={22} />
                  {entry.username}
                </strong>
                <span>{joker ? (joker.used ? 'Jouée' : 'En main') : '—'}</span>
                {joker?.note && joker.note !== 'En main' && <span>{joker.note}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const needsTarget = (cardId) => cardId === 'copie' || cardId === 'silence' || cardId === 'vol';

export const PlayerJokerBar = ({
  joker,
  phase,
  questionIndex,
  locked,
  players,
  selfId,
  silenced,
  canRedo,
  onPlay,
  onRedo
}) => {
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    setPicking(false);
  }, [questionIndex, phase, joker?.used]);

  if (!joker?.card || !JOKERS[joker.card]) return null;

  const card = JOKERS[joker.card];
  const targets = (players || []).filter((entry) => entry.id !== selfId);
  const onThisQuestion = joker.used && joker.usedOn === questionIndex;
  const holdCard = joker.card === 'vol' || joker.card === 'melange' || joker.card === 'pot' || joker.card === 'renversement';
  const canPlay = !joker.used && (
    holdCard
      ? phase === 'hold'
      : joker.card === 'bouclier'
        ? phase === 'answering'
        : joker.card === 'seconde'
          ? phase === 'answering' && !silenced
          : phase === 'answering' && !locked && !silenced
  );

  const play = (targetId) => {
    unlockCling();
    onPlay({ card: joker.card, targetId });
    setPicking(false);
  };

  let hint = card.rule;
  if (joker.card === 'seconde' && phase === 'answering' && joker.used && !joker.redoSpent) {
    hint = 'Entre ta deuxième réponse.';
  } else if (joker.used) hint = joker.note || 'Jouée';
  else if (joker.card === 'bouclier' && phase === 'answering' && silenced) hint = 'Joue-la pour annuler le silence.';
  else if (joker.card === 'bouclier' && phase !== 'answering') hint = 'Trop tard pour cette question.';
  else if (silenced && !holdCard) hint = 'Tu es réduit au silence.';
  else if (joker.card === 'vol' && phase === 'answering') hint = 'Après les réponses, tu verras les copies.';
  else if (joker.card === 'vol' && phase !== 'hold') hint = 'Trop tard pour cette question.';
  else if (joker.card === 'melange' && phase === 'answering') hint = 'Après les réponses, juste avant les points.';
  else if (joker.card === 'melange' && phase !== 'hold') hint = 'Trop tard pour cette question.';
  else if (joker.card === 'pot' && phase === 'answering') hint = 'Après les réponses, juste avant les points.';
  else if (joker.card === 'pot' && phase !== 'hold') hint = 'Trop tard pour cette question.';
  else if (joker.card === 'renversement' && phase === 'answering') hint = 'Après les réponses, juste avant les points.';
  else if (joker.card === 'renversement' && phase !== 'hold') hint = 'Trop tard pour cette question.';
  else if (joker.card === 'seconde' && phase === 'answering') hint = 'Joue-la avant ou après ta réponse, tant que la question est ouverte.';
  else if (!holdCard && phase === 'answering' && locked) hint = 'Il fallait la jouer avant de répondre.';
  else if (!holdCard && phase !== 'answering') hint = 'Trop tard pour cette question.';

  return (
    <div className="player-joker">
      <JokerCard cardId={joker.card} used={joker.used} size="hand" />
      <div className="player-joker-body">
        {hint !== card.rule && <p>{hint}</p>}
        {canPlay && !needsTarget(joker.card) && (
          <button type="button" className="joker-chip" onClick={() => play(null)}>
            <Icon name="play" />Jouer
          </button>
        )}
        {canPlay && needsTarget(joker.card) && (
          <button
            type="button"
            className="joker-chip"
            disabled={targets.length === 0}
            onClick={() => setPicking((open) => !open)}
          >
            {targets.length === 0 ? 'Personne à viser' : (picking ? <><Icon name="cross" />Annuler</> : <><Icon name="search" />Choisir</>)}
          </button>
        )}
        {canRedo && (
          <button type="button" className="joker-chip joker-chip-alt" onClick={onRedo}>
            <Icon name="pencil" />2e réponse
          </button>
        )}
        {onThisQuestion && joker.targetName && (
          <div className="player-joker-target">Cible : {joker.targetName}</div>
        )}
        {picking && (
          <div className="joker-targets">
            {targets.map((entry) => (
              <button key={entry.id} type="button" className="joker-chip joker-chip-alt" onClick={() => play(entry.id)}>
                {entry.username}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
