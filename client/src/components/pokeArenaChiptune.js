/**
 * Mini-synthé « chiptune » (Web Audio) : compose des boucles ORIGINALES à la volée
 * (mélodie, basse, arpèges, batterie) selon une ambiance et une graine.
 * Sert de musique par défaut quand le fichier d’OST correspondant n’est pas fourni.
 */

const mulberry = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const hashString = (s = '') => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harm: [0, 2, 3, 5, 7, 8, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  phryg: [0, 1, 3, 5, 7, 8, 10],
  mixo: [0, 2, 4, 5, 7, 9, 10]
};

const DRUMS = {
  none: { k: '', s: '', h: '' },
  light: { k: 'x.......x.......', s: '', h: '..x...x...x...x.' },
  walk: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  march: { k: 'x.......x.......', s: '....x.x.....x.xx', h: 'x.x.x.x.x.x.x.x.' },
  drive: { k: 'x.x.x.x.x.x.x.x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
  battle: { k: 'x..x..x.x..x..x.', s: '....x.......x...', h: 'x.xxx.xxx.xxx.xx' },
  tribal: { k: 'x..x..x...x..x..', s: '......x.......x.', h: 'x.x.x.x.x.x.x.x.' }
};

/** Ambiances : gamme, tempo, progressions (degrés), instruments, densité de la mélodie. */
const MOODS = {
  town: { scale: 'major', bpm: [100, 112], progs: [[0, 4, 5, 3], [0, 3, 4, 0], [3, 4, 2, 5]], drums: 'light', bass: 'walk', lead: 0.25, arp: 8, density: 0.42, root: [60, 62, 65] },
  route: { scale: 'major', bpm: [112, 128], progs: [[0, 4, 5, 3], [3, 4, 0, 5], [0, 3, 1, 4]], drums: 'walk', bass: 'walk', lead: 0.5, arp: 16, density: 0.55, root: [60, 62, 64, 65, 67] },
  cave: { scale: 'minor', bpm: [84, 96], progs: [[0, 5, 6, 0], [0, 3, 5, 4], [0, 6, 5, 4]], drums: 'none', bass: 'pedal', lead: 'tri', arp: 8, density: 0.32, root: [57, 59, 62], echo: true },
  snow: { scale: 'lydian', bpm: [92, 104], progs: [[0, 1, 0, 4], [0, 5, 1, 4], [3, 1, 0, 4]], drums: 'light', bass: 'pedal', lead: 'sine', arp: 16, density: 0.38, root: [62, 64, 65], echo: true },
  volcano: { scale: 'phryg', bpm: [126, 138], progs: [[0, 1, 0, 6], [0, 5, 6, 0]], drums: 'tribal', bass: 'drive', lead: 0.5, arp: 16, density: 0.55, root: [57, 59, 60] },
  league: { scale: 'major', bpm: [112, 122], progs: [[0, 3, 4, 0], [0, 5, 3, 4], [5, 3, 0, 4]], drums: 'march', bass: 'walk', lead: 0.25, arp: 16, density: 0.5, root: [62, 65, 67] },
  battle: { scale: 'minor', bpm: [160, 172], progs: [[0, 6, 5, 6], [0, 3, 6, 4], [0, 5, 3, 4]], drums: 'battle', bass: 'octave', lead: 0.5, arp: 16, density: 0.72, root: [57, 59, 60, 62] },
  gym: { scale: 'harm', bpm: [166, 176], progs: [[0, 5, 3, 4], [0, 6, 5, 4]], drums: 'battle', bass: 'octave', lead: 0.25, arp: 16, density: 0.75, root: [57, 60, 62] },
  e4: { scale: 'minor', bpm: [172, 180], progs: [[0, 5, 6, 4], [0, 3, 5, 4]], drums: 'battle', bass: 'octave', lead: 0.25, arp: 16, density: 0.78, root: [55, 57, 59] },
  champion: { scale: 'harm', bpm: [178, 188], progs: [[0, 5, 1, 4], [0, 6, 5, 4]], drums: 'battle', bass: 'octave', lead: 0.5, arp: 16, density: 0.8, root: [57, 58, 60] },
  villain: { scale: 'harm', bpm: [150, 162], progs: [[0, 1, 0, 6], [0, 5, 1, 4]], drums: 'drive', bass: 'ostinato', lead: 0.25, arp: 16, density: 0.66, root: [55, 57, 58] },
  grunt: { scale: 'phryg', bpm: [158, 166], progs: [[0, 1, 0, 1], [0, 6, 5, 1]], drums: 'battle', bass: 'drive', lead: 0.25, arp: 16, density: 0.62, root: [57, 60] },
  rival: { scale: 'dorian', bpm: [164, 174], progs: [[0, 3, 6, 4], [0, 6, 3, 4]], drums: 'battle', bass: 'octave', lead: 0.5, arp: 16, density: 0.74, root: [59, 60, 62] },
  victory: { scale: 'major', bpm: [128, 136], progs: [[0, 3, 4, 0], [0, 5, 3, 4]], drums: 'march', bass: 'walk', lead: 0.25, arp: 16, density: 0.52, root: [60, 62, 65] },
  fame: { scale: 'major', bpm: [96, 104], progs: [[0, 5, 3, 4], [0, 3, 4, 0]], drums: 'march', bass: 'walk', lead: 0.25, arp: 16, density: 0.42, root: [60, 63, 65] }
};

const RHYTHMS = {
  calm: ['x...', 'x.x.', 'x..x', 'x...', 'x.x.', '..x.'],
  busy: ['x.x.', 'xxx.', 'x.xx', 'x..x', 'xxxx', 'x...', 'x.x.']
};

/** Compose une boucle de 8 mesures (16 pas par mesure). */
export const composeSong = (mood = 'route', seed = 1) => {
  const M = MOODS[mood] || MOODS.route;
  const r = mulberry(seed);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const scale = SCALES[M.scale];
  const bpm = Math.round(M.bpm[0] + r() * (M.bpm[1] - M.bpm[0]));
  const root = pick(M.root);
  const prog = pick(M.progs);
  const chords = [...prog, ...(r() < 0.5 ? prog : pick(M.progs))];
  const degToMidi = (deg, base) => {
    const oct = Math.floor(deg / 7);
    const d = ((deg % 7) + 7) % 7;
    return base + scale[d] + oct * 12;
  };
  const chordTones = (c) => [c, c + 2, c + 4];
  const nearestChordTone = (deg, c) => {
    let best = deg;
    let bd = 99;
    for (let o = -14; o <= 14; o += 7) {
      chordTones(c).forEach((t) => {
        const cand = t + o;
        const dist = Math.abs(cand - deg);
        if (dist < bd) { bd = dist; best = cand; }
      });
    }
    return best;
  };

  // ——— Mélodie : motif de 2 mesures, repris et varié (A A' B A'') ———
  const rhythmBank = M.density > 0.6 ? RHYTHMS.busy : RHYTHMS.calm;
  const makeRhythm = () => {
    const out = [];
    for (let b = 0; b < 8; b += 1) {
      let pat = pick(rhythmBank);
      if (b === 0 && pat[0] !== 'x') pat = 'x' + pat.slice(1);
      if (b === 7) pat = r() < 0.6 ? 'x...' : 'x.x.';
      if (r() > M.density + 0.25 && b % 2 === 1 && b !== 7) pat = '....';
      out.push(...pat);
    }
    return out;
  };
  const makePhrase = (barChords, start) => {
    const rhythm = makeRhythm();
    const notes = [];
    let deg = start;
    for (let s = 0; s < 32; s += 1) {
      if (rhythm[s] !== 'x') continue;
      const c = barChords[Math.floor(s / 16)];
      if (s % 8 === 0) deg = nearestChordTone(deg + (r() < 0.5 ? 1 : -1), c);
      else {
        const roll = r();
        const step = roll < 0.55 ? 1 : roll < 0.85 ? 2 : 3;
        deg += r() < 0.5 ? step : -step;
      }
      deg = Math.max(-1, Math.min(11, deg));
      notes.push({ s, deg });
    }
    if (notes.length) notes[notes.length - 1].deg = nearestChordTone(notes[notes.length - 1].deg, barChords[1]);
    return notes;
  };
  const shift = (phrase, from, to) => phrase.map((n) => {
    const bar = Math.floor(n.s / 16);
    return { s: n.s, deg: n.deg + (to[bar] - from[bar]) };
  });
  const A = makePhrase([chords[0], chords[1]], 4);
  const A2 = shift(A, [chords[0], chords[1]], [chords[2], chords[3]]);
  const B = makePhrase([chords[4], chords[5]], 6);
  const A3 = shift(A, [chords[0], chords[1]], [chords[6], chords[7]]);
  if (A3.length) A3[A3.length - 1].deg = nearestChordTone(A3[A3.length - 1].deg, 0);
  const all = [...A, ...A2.map((n) => ({ ...n, s: n.s + 32 })), ...B.map((n) => ({ ...n, s: n.s + 64 })), ...A3.map((n) => ({ ...n, s: n.s + 96 }))];
  const leadBase = root + 12;
  const lead = all.map((n, i) => {
    const next = all[i + 1] ? all[i + 1].s : 128;
    return { s: n.s, len: Math.max(1, Math.min(8, next - n.s)), midi: degToMidi(n.deg, leadBase) };
  });

  // ——— Basse ———
  const bass = [];
  const bassBase = root - 24;
  chords.forEach((c, bar) => {
    const rootMidi = degToMidi(c, bassBase);
    const fifth = degToMidi(c + 4, bassBase);
    const o = bar * 16;
    if (M.bass === 'octave') for (let k = 0; k < 8; k += 1) bass.push({ s: o + k * 2, len: 2, midi: rootMidi + (k % 2 ? 12 : 0) });
    else if (M.bass === 'drive') for (let k = 0; k < 8; k += 1) bass.push({ s: o + k * 2, len: 2, midi: k === 7 ? fifth : rootMidi });
    else if (M.bass === 'ostinato') for (let k = 0; k < 16; k += 1) bass.push({ s: o + k, len: 1, midi: rootMidi + [0, 0, 12, 0, 1, 0, 12, 0][k % 8] });
    else if (M.bass === 'pedal') bass.push({ s: o, len: 12, midi: rootMidi }, { s: o + 12, len: 4, midi: fifth });
    else [0, 4, 8, 12].forEach((q, k) => bass.push({ s: o + q, len: 4, midi: [rootMidi, fifth, rootMidi + 12, fifth][k] }));
  });

  // ——— Arpèges ———
  const arp = [];
  const arpBase = root;
  const every = M.arp === 8 ? 2 : 1;
  chords.forEach((c, bar) => {
    const tones = [...chordTones(c), c + 7].map((d) => degToMidi(d, arpBase));
    const order = r() < 0.5 ? [0, 1, 2, 3, 2, 1] : [0, 2, 1, 3];
    for (let k = 0; k < 16; k += every) arp.push({ s: bar * 16 + k, len: every, midi: tones[order[(k / every) % order.length]] });
  });

  const kit = DRUMS[M.drums] || DRUMS.none;
  return { bpm, steps: 128, lead, bass, arp, kit, leadWave: M.lead, echo: !!M.echo, fill: M.drums === 'battle' };
};

/* ——————————————————————— Lecture ——————————————————————— */

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

const pulseCache = new Map();
const pulseWave = (ac, duty) => {
  const key = duty;
  if (pulseCache.has(key)) return pulseCache.get(key);
  const n = 40;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k += 1) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  const wave = ac.createPeriodicWave(real, imag);
  pulseCache.set(key, wave);
  return wave;
};

let noiseBuf = null;
const noise = (ac) => {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
};

/** Joue une boucle composée ; renvoie { stop(fadeSeconds) }. */
export const playSong = (ac, dest, song, offlineSteps = 0) => {
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, ac.currentTime);
  out.gain.exponentialRampToValueAtTime(1, ac.currentTime + 0.6);
  out.connect(dest);
  let leadBus = out;
  if (song.echo) {
    const delay = ac.createDelay(1);
    delay.delayTime.value = 0.32;
    const fb = ac.createGain();
    fb.gain.value = 0.32;
    const wet = ac.createGain();
    wet.gain.value = 0.35;
    leadBus = ac.createGain();
    leadBus.connect(out);
    leadBus.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(out);
  }
  const stepDur = 60 / song.bpm / 4;
  const byStep = (list) => {
    const m = new Map();
    list.forEach((n) => { if (!m.has(n.s)) m.set(n.s, []); m.get(n.s).push(n); });
    return m;
  };
  const L = byStep(song.lead);
  const B = byStep(song.bass);
  const A = byStep(song.arp);

  const tone = (bus, wave, midi, t, len, vol, opts = {}) => {
    const o = ac.createOscillator();
    if (typeof wave === 'number') o.setPeriodicWave(pulseWave(ac, wave));
    else o.type = wave === 'tri' ? 'triangle' : wave;
    o.frequency.setValueAtTime(mtof(midi), t);
    if (opts.vibrato && len > 0.25) {
      const lfo = ac.createOscillator();
      const lg = ac.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.value = mtof(midi) * 0.006;
      lfo.connect(lg);
      lg.connect(o.frequency);
      lfo.start(t + 0.15);
      lfo.stop(t + len + 0.05);
    }
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(vol * 0.62, t + 0.09);
    g.gain.setValueAtTime(vol * 0.62, t + Math.max(0.1, len - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.03);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + len + 0.05);
  };
  const kick = (t) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + 0.18);
  };
  const hiss = (t, dur, vol, freq, type) => {
    const src = ac.createBufferSource();
    src.buffer = noise(ac);
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  };

  let step = 0;
  let next = ac.currentTime + 0.08;
  let stopped = false;
  const scheduleStep = () => {
    const s = step % song.steps;
    (L.get(s) || []).forEach((n) => tone(leadBus, song.leadWave, n.midi, next, n.len * stepDur, 0.085, { vibrato: true }));
    (B.get(s) || []).forEach((n) => tone(out, 'tri', n.midi, next, n.len * stepDur * 0.92, 0.2));
    (A.get(s) || []).forEach((n) => tone(out, 0.125, n.midi, next, n.len * stepDur * 0.7, 0.028));
    const k = s % 16;
    if (song.kit.k[k] === 'x') kick(next);
    if (song.kit.s[k] === 'x' || (song.fill && s >= song.steps - 16 && k >= 12)) hiss(next, 0.12, 0.2, 1800, 'bandpass');
    if (song.kit.h[k] === 'x') hiss(next, 0.035, 0.05, 7000, 'highpass');
    step += 1;
    next += stepDur;
  };
  if (offlineSteps) {
    // Rendu hors-ligne (tests) : tout est programmé d’un coup.
    for (let i = 0; i < offlineSteps; i += 1) scheduleStep();
    return { stop: () => {} };
  }
  const tick = () => {
    if (stopped) return;
    while (next < ac.currentTime + 0.2) scheduleStep();
  };
  tick();
  const timer = setInterval(tick, 40);
  return {
    stop: (fade = 0.5) => {
      stopped = true;
      clearInterval(timer);
      const t = ac.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), t);
      out.gain.exponentialRampToValueAtTime(0.0001, t + fade);
      setTimeout(() => { try { out.disconnect(); } catch { /* déjà déconnecté */ } }, (fade + 0.4) * 1000);
    }
  };
};
