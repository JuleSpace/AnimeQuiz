import React, { useEffect, useRef, useState } from 'react';
import Icon from './ArcadeIcon';

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

function playOpeningScore() {
  const bus = voiceBus();
  if (!bus) return;
  const { ctx, master, now } = bus;
  const splitAt = 2.4;
  const pullAt = 3.12;
  const osc = ctx.createOscillator();
  const lp = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(42, now);
  osc.frequency.exponentialRampToValueAtTime(168, now + splitAt);
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(90, now);
  lp.frequency.exponentialRampToValueAtTime(720, now + splitAt);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.26, now + splitAt - 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + splitAt + 0.08);
  osc.connect(lp);
  lp.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + splitAt + 0.12);
  burst(ctx, master, now + 0.4, splitAt - 0.45, 260, 0.4, 0.07, 1900);
  const boom = now + splitAt;
  burst(ctx, master, boom, 0.24, 130, 0.32, 0.58, 55);
  burst(ctx, master, boom, 0.1, 3400, 0.7, 0.2, 480);
  burst(ctx, master, boom + 0.03, 0.42, 640, 0.38, 0.15, 120);
  metal(ctx, master, boom + 0.07, 740, 0.48, 0.05);
  const rise = now + pullAt;
  glide(ctx, master, rise, 480, 1680, 0.6, 0.055, 'triangle');
  metal(ctx, master, rise + 0.04, 1318, 0.32, 0.035);
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

const Mark = ({ cardId }) => {
  const src = CARD_ART[cardId];
  if (!src) return null;
  return <img className="tcg-photo tcg-photo-fit" src={src} alt="" />;
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
    const timer = setTimeout(() => setDropping(false), slam ? 1700 : 1200);
    return () => clearTimeout(timer);
  }, [used, slam, cardId, size, card, quiet]);

  useEffect(() => {
    if (!reveal) return undefined;
    setImpact(true);
    const timer = setTimeout(() => setImpact(false), 1300);
    return () => clearTimeout(timer);
  }, [reveal]);

  if (!card) return null;

  const tilt = (event) => {
    const node = event.currentTarget;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    node.style.setProperty('--mx', `${px * 100}%`);
    node.style.setProperty('--my', `${py * 100}%`);
    node.style.setProperty('--ry', `${(px - 0.5) * 14}deg`);
    node.style.setProperty('--rx', `${(0.5 - py) * 12}deg`);
  };

  const untilt = (event) => {
    const node = event.currentTarget;
    node.style.removeProperty('--rx');
    node.style.removeProperty('--ry');
  };

  return (
    <article
      className={`tcg-card tcg-${size} ${used ? 'is-used' : ''} ${dropping && slam ? 'is-slam' : ''} ${dropping && !slam ? 'is-drop' : ''} ${impact ? 'is-reveal' : ''}`}
      data-card={cardId}
      style={{ '--tcg-accent': card.accent, '--tcg-mate': card.mate }}
      onMouseMove={tilt}
      onMouseLeave={untilt}
    >
      <div className="tcg-float">
        <div className="tcg-name"><i className="tcg-gem" /><span>{card.name}</span></div>
        <div className="tcg-art">
          <Mark cardId={cardId} />
          <span className="tcg-sheen" />
          <span className="tcg-sweep" />
          <span className={`tcg-fx tcg-fx-${cardId}`}>
            {cardId === 'gambling' && <><i>7</i><i>7</i><i>7</i></>}
          </span>
          {used && <div className="tcg-stamp">Jouée</div>}
        </div>
        {size === 'full' && (
          <p className="tcg-rule"><span>{card.rule}</span></p>
        )}
      </div>
      <span className="tcg-flash" />
      <span className="tcg-burst" />
      <span className="tcg-shock" />
    </article>
  );
};

export const TableDrop = ({ cardId, username = '', quiet = false }) => {
  const who = username.trim();
  let caption = who ? `${who} mélange les réponses` : 'Les réponses sont mélangées';
  if (cardId === 'pot') caption = who ? `${who} met les points au pot` : 'Les points partent au pot';
  if (cardId === 'renversement') caption = who ? `${who} renverse le classement` : 'Le classement se renverse';
  return (
    <div className="melange-burst" role="status">
      <div className="melange-burst-card">
        <JokerCard cardId={cardId} size="full" slam quiet={quiet} />
      </div>
      <p className="melange-burst-caption">{caption}</p>
    </div>
  );
};

const PACK_RAYS = Array.from({ length: 16 }, (_, i) => ({
  a: (360 / 16) * i - 6,
  w: 10 + (i % 4) * 8,
  h: 340 + (i % 5) * 56,
  delay: (i % 6) * 0.045
}));

const PACK_EMBERS = Array.from({ length: 24 }, (_, i) => ({
  x: -130 + ((i * 41) % 270),
  delay: (i * 0.07) % 0.85,
  dur: 0.72 + (i % 5) * 0.14,
  size: 3 + (i % 4) * 2
}));

const PACK_CONFETTI = Array.from({ length: 42 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 42;
  const dist = 160 + (i % 8) * 42;
  return {
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist * 0.72 - 90),
    rot: (i * 53) % 360,
    delay: (i % 9) * 0.028,
    w: 6 + (i % 3) * 5,
    h: i % 2 === 0 ? 16 : 8,
    color: ['#fff6d0', '#ffe14a', '#ff6ec7', '#7ec8ff', '#ffffff', '#ff2d55', '#9dff6a'][i % 7]
  };
});

const PACK_SPARKS = Array.from({ length: 26 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 26 + 0.18;
  const dist = 130 + (i % 6) * 48;
  return {
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist * 0.8 - 36),
    delay: (i % 8) * 0.03,
    size: i % 5 === 0 ? 12 : 6
  };
});

const PACK_SCRAPS = Array.from({ length: 20 }, (_, i) => {
  const side = i % 2 === 0 ? -1 : 1;
  return {
    dx: side * (80 + (i % 7) * 28),
    dy: -40 - (i % 8) * 32,
    rot: side * (40 + (i * 17) % 120),
    delay: (i % 6) * 0.03,
    w: 6 + (i % 4) * 3,
    h: i % 3 === 0 ? 8 : 18
  };
});

const PACK_STREAKS = Array.from({ length: 8 }, (_, i) => ({
  y: 8 + i * 11,
  delay: (i % 4) * 0.04,
  flip: i % 2 === 0
}));

const PACK_GLINTS = Array.from({ length: 12 }, (_, i) => ({
  a: (360 / 12) * i,
  delay: i * 0.045,
  r: 168 + (i % 3) * 22
}));

const CardBack = () => (
  <div className="card-back" aria-hidden="true">
    <span className="card-back-gem">J</span>
    <span className="card-back-word">Joker</span>
  </div>
);

export const BoosterOpening = ({ cardId }) => {
  const [stage, setStage] = useState('sealed');
  const timers = useRef([]);
  const armedSound = useRef(null);
  const prepared = useRef(Promise.resolve(null));

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
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

  useEffect(() => {
    if (stage !== 'flip') return undefined;
    let dead = false;
    let voiceTimer = 0;
    const run = (audio) => {
      if (dead) return;
      playCardCling();
      voiceTimer = window.setTimeout(() => {
        if (!dead) playDropSound(cardId, audio);
      }, 160);
    };
    if (armedSound.current) run(armedSound.current);
    else prepared.current.then(run);
    return () => {
      dead = true;
      window.clearTimeout(voiceTimer);
    };
  }, [stage, cardId]);

  const openPack = () => {
    if (stage !== 'sealed' || !cardId) return;
    unlockCling();
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      playCardCling();
      const playNow = (audio) => playDropSound(cardId, audio);
      if (armedSound.current) playNow(armedSound.current);
      else prepared.current.then(playNow);
      setStage('show');
      return;
    }
    if (armedSound.current) unlockAudio(armedSound.current);
    else prepared.current.then((audio) => unlockAudio(audio));
    playOpeningScore();
    const wait = (next, ms) => {
      timers.current.push(setTimeout(() => setStage(next), ms));
    };
    setStage('rumble');
    wait('charge', 900);
    wait('tear', 1900);
    wait('split', 2400);
    wait('pull', 3120);
    wait('flip', 4520);
    wait('show', 5340);
  };

  const card = JOKERS[cardId];
  let caption = 'Clique sur le booster pour le déchirer';
  if (!cardId) caption = 'Le booster arrive...';
  else if (stage === 'rumble') caption = "Le booster s'emballe...";
  else if (stage === 'charge') caption = 'La lumière crève le pack...';
  else if (stage === 'tear' || stage === 'split') caption = 'Ça lâche...';
  else if (stage === 'pull') caption = '';
  else if (stage === 'flip' || stage === 'show') caption = card ? `${card.name} — ${card.rule}` : '';

  const revealed = stage === 'flip' || stage === 'show';
  const hot = stage === 'rumble' || stage === 'charge' || stage === 'tear';
  const burst = stage === 'split' || stage === 'pull' || stage === 'flip' || stage === 'show';
  const risen = stage === 'pull' || stage === 'flip' || stage === 'show';

  return (
    <div className={`pack-scene is-${stage}${hot ? ' is-hot' : ''}${burst ? ' is-burst' : ''}${risen ? ' is-risen' : ''}`}>
      <div className="pack-stage">
        <span className="pack-veil" aria-hidden="true" />
        <span className="pack-rays" aria-hidden="true">
          {PACK_RAYS.map((ray) => (
            <i
              key={`ray-${ray.a}`}
              style={{
                '--a': `${ray.a}deg`,
                '--w': `${ray.w}px`,
                '--h': `${ray.h}px`,
                '--delay': `${ray.delay}s`
              }}
            />
          ))}
        </span>
        <span className="pack-leak" aria-hidden="true" />
        <span className="pack-embers" aria-hidden="true">
          {PACK_EMBERS.map((ember, index) => (
            <i
              key={`ember-${index}`}
              style={{
                '--x': `${ember.x}px`,
                '--delay': `${ember.delay}s`,
                '--dur': `${ember.dur}s`,
                '--size': `${ember.size}px`
              }}
            />
          ))}
        </span>
        <span className="pack-flash" aria-hidden="true" />
        <span className="pack-core" aria-hidden="true" />
        <span className="pack-crack" aria-hidden="true" />
        <span className="pack-rings" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
        <span className="pack-sparks" aria-hidden="true">
          {PACK_SPARKS.map((spark, index) => (
            <i
              key={`spark-${index}`}
              style={{
                '--dx': `${spark.dx}px`,
                '--dy': `${spark.dy}px`,
                '--delay': `${spark.delay}s`,
                '--size': `${spark.size}px`
              }}
            />
          ))}
        </span>
        <span className="pack-streaks" aria-hidden="true">
          {PACK_STREAKS.map((streak, index) => (
            <i
              key={`streak-${index}`}
              style={{
                '--y': `${streak.y}%`,
                '--delay': `${streak.delay}s`,
                '--flip': streak.flip ? '-1' : '1'
              }}
            />
          ))}
        </span>
        <span className="pack-shell pack-shell-left" aria-hidden="true" />
        <span className="pack-shell pack-shell-right" aria-hidden="true" />
        <div className="sleeve">
          <span className="pack-halo" aria-hidden="true" />
          <div className="rising-card">
            <div className="rising-inner">
              <CardBack />
              <div className="rising-front">
                {cardId && <JokerCard cardId={cardId} size="full" reveal={stage === 'show'} />}
              </div>
            </div>
          </div>
        </div>
        <span className="pack-glints" aria-hidden="true">
          {PACK_GLINTS.map((glint) => (
            <i
              key={`glint-${glint.a}`}
              style={{ '--a': `${glint.a}deg`, '--delay': `${glint.delay}s`, '--r': `${glint.r}px` }}
            />
          ))}
        </span>
        <span className="pack-confetti" aria-hidden="true">
          {PACK_CONFETTI.map((bit, index) => (
            <i
              key={`bit-${index}`}
              style={{
                '--dx': `${bit.dx}px`,
                '--dy': `${bit.dy}px`,
                '--rot': `${bit.rot}deg`,
                '--delay': `${bit.delay}s`,
                '--w': `${bit.w}px`,
                '--h': `${bit.h}px`,
                '--c': bit.color
              }}
            />
          ))}
        </span>
        <button type="button" className="pack" onClick={openPack} disabled={stage !== 'sealed'}>
          <span className="pack-top">
            <span className="pack-perf" />
          </span>
          <span className="pack-body">
            <span className="pack-crest" aria-hidden="true"><b>J</b></span>
            <span className="pack-label">
              <strong>JOKERS</strong>
              <em>1 carte</em>
            </span>
            <span className="pack-pips" aria-hidden="true"><i /><i /><i /></span>
          </span>
          <span className="pack-scraps" aria-hidden="true">
            {PACK_SCRAPS.map((scrap, index) => (
              <i
                key={`scrap-${index}`}
                style={{
                  '--dx': `${scrap.dx}px`,
                  '--dy': `${scrap.dy}px`,
                  '--rot': `${scrap.rot}deg`,
                  '--delay': `${scrap.delay}s`,
                  '--w': `${scrap.w}px`,
                  '--h': `${scrap.h}px`
                }}
              />
            ))}
          </span>
        </button>
      </div>
      <p className="booster-caption">
        {revealed && card ? (
          <>
            <strong>{card.name}</strong>
            <span>{card.rule}</span>
          </>
        ) : caption}
      </p>
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

export const HostJokerBoard = ({ players }) => {
  const rows = players || [];

  return (
    <div className="host-jokers">
      <div className="host-jokers-title">Mains des joueurs</div>
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
                <strong>{entry.username}</strong>
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
