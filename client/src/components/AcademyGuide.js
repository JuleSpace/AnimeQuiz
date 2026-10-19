import React, { useEffect, useMemo, useRef, useState } from 'react';
import { drawPokemon, preloadSprites } from './swarmSprites';
import './AcademyGuide.css';

export const ACADEMY_HASH = '#academy';
const CHECK_KEY = 'academy-checklist';

/* ——— Contenu du guide (Cobblemon Academy 2.0, édition octobre 2026) ——— */
const CHAPTERS = [
  { id: 'bienvenue', n: '01', title: 'Bienvenue', sub: 'Le concept en deux minutes' },
  { id: 'premiers-jours', n: '02', title: 'Premiers jours', sub: 'Lettre, starter, bons réflexes' },
  { id: 'monde', n: '03', title: 'Monde', sub: 'Biomes, structures, commandes' },
  { id: 'combats', n: '04', title: 'Combats', sub: 'Arènes, raids, Méga, Z, Téra, Dynamax' },
  { id: 'elevage', n: '05', title: 'Élevage', sub: 'Œufs, pâturages, CT, cuisine' },
  { id: 'cartes', n: '06', title: 'Cartes', sub: 'Boosters, album, gradation' },
  { id: 'objets', n: '07', title: 'Objets Academy', sub: 'Fossiles, encens, lootbags' },
  { id: 'economie', n: '08', title: 'Économie & arcade', sub: 'CobbleDollars, jetons, gacha' },
  { id: 'boutique', n: '09', title: 'Boutique', sub: 'Ce qu’on achète, à quel prix' },
  { id: 'chasse', n: '10', title: 'Chasse aux légendaires', sub: 'Taux, conditions, conseils' }
];

const LOOP = [
  { t: 'Explore', d: 'Biomes et structures : capture, remplis ton Pokédex, loote les coffres.' },
  { t: 'Gagne', d: 'Des CobbleDollars en jouant, des jetons d’arcade dans les mini-jeux.' },
  { t: 'Équipe-toi', d: 'Poké Balls, objets de combat, boosters de cartes, fossiles Academy.' },
  { t: 'Progresse', d: 'Arènes, raids, et album de cartes : des bonus permanents.' },
  { t: 'Chasse', d: 'Le bon biome, la bonne météo, la bonne heure pour les rares.' }
];

const FIRST_DAYS = [
  { t: 'Ouvre ta lettre d’admission', d: 'Tu apparais avec une lettre de l’Academy en main : ouvre-la pour t’inscrire et lancer ton aventure.' },
  { t: 'Récupère des Poké Balls', d: 'Craft-les avec des Apricorns ou achète-les à la boutique (500 jetons la Poké Ball). Prends aussi quelques Potions.' },
  { t: 'Repère ce qui spawn autour de toi', d: 'Ton Pokénav et le Wiki Cobblemon intégré te disent quels Pokémon vivent dans ton biome, et à quel moment.' },
  { t: 'Active les Waystones que tu croises', d: 'Ce sont tes points de téléportation gratuits pour revenir plus tard.' },
  { t: 'Prends un sac à dos', d: 'Sophisticated Backpacks, avant de partir en exploration : les structures regorgent de loot.' },
  { t: 'Pose ta base et fais /sethome', d: 'Le téléphone (Arc Phone) te donne accès à ton PC Cobblemon où que tu sois.' }
];

const TOOLS = [
  ['JourneyMap', 'minimap et carte du monde, avec waypoints'],
  ['Pokénav', 'Pokémon du coin et suivi de chasse'],
  ['Wiki Cobblemon', 'fiches, évolutions, lieux d’apparition'],
  ['JEI / EMI', 'toutes les recettes et usages d’un objet'],
  ['Nature’s Compass', 'trouve un biome précis']
];
const REFLEXES = [
  'Les coffres de structures sont personnels : chaque joueur a son propre loot, inutile de se battre pour.',
  'Le chat vocal de proximité est actif (Simple Voice Chat).',
  'La roue de ping permet de montrer un endroit à tes potes.',
  'Garde de l’argent pour les boosters de cartes : leurs bonus sont permanents.'
];

const COMMANDS = [
  ['/sethome', 'Enregistrer ta base (puis /home pour t’y téléporter, recharge 10 s).'],
  ['/home', 'Te téléporter à ta base.'],
  ['/back', 'Revenir là où tu étais, ou à ton point de mort (recharge 30 s).'],
  ['/spawn', 'Retour au spawn du serveur.'],
  ['/tpa <joueur>', 'Demander à te téléporter vers un ami.'],
  ['/rtp', 'Téléportation aléatoire pour explorer une zone vierge (une fois toutes les 10 min).'],
  ['/enderchest', 'Ouvrir ton coffre de l’Ender n’importe où.'],
  ['/anvil', 'Enclume portable (aussi /smithing pour la table de forge et /stonecutter pour le tailleur de pierre).'],
  ['/trashcan', 'Poubelle pour vider ton inventaire.'],
  ['/hat', 'Porter l’objet en main sur la tête (parfait avec les casquettes des lootbags).'],
  ['/near', 'Voir les joueurs proches.'],
  ['/leaderboard', 'Les classements du serveur.']
];

const MECHANICS = [
  { t: 'Méga-Évolution', d: 'Une Méga-Gemme tenue par le bon Pokémon + l’objet clé : il méga-évolue en combat.', c: '#ff6ad5' },
  { t: 'Capacités Z', d: 'Un Cristal Z donne une attaque surpuissante, une fois par combat.', c: '#ffd23a' },
  { t: 'Téracristal', d: 'Change le type de ton Pokémon en plein combat grâce aux Téra-Éclats.', c: '#7fe0ff' },
  { t: 'Dynamax', d: 'Ton Pokémon devient géant pour trois tours, avec des attaques Max.', c: '#ff2347' }
];

const RARITIES = [
  ['Commune', 88, '#b8c2dc'], ['Peu commune', 123, '#5fd06a'], ['Rare', 97, '#4fa8ff'],
  ['Épique', 52, '#b06ad6'], ['Légendaire', 25, '#ffd23a'], ['Shiny', 151, '#ff9ad6']
];
const GRADE = [0.4, 0.7, 1, 1.1, 1.2, 1.3, 1.4, 2, 2.5, 3];
const CARD_BONUSES = [
  ['Joueur', 'vitesse, saut, armure, minage, nage, oxygène, portée'],
  ['Capture', 'chance de capture, amitié de départ'],
  ['Progression', 'XP gagnée par ton équipe à chaque capture'],
  ['EV', 'EV gagnés en plus pour une statistique'],
  ['Spawn', 'plus de Pokémon d’un type, ou plus de rares (cartes épiques)'],
  ['Shiny', 'chance de shiny augmentée']
];

const FOSSILS = [['Fossile HA', 'Talent caché'], ['Fossile Brillant', 'Pokémon shiny'], ['Fossile Max IV', 'Les 6 IVs à 31']];
const INCENSE = [['Encens shiny', 2, 20], ['Encens shiny fort', 3, 40], ['Encens shiny ultime', 4, 60]];
const LOOTBAGS = [
  ['Mythes & Légendes', 'Un objet d’invocation légendaire parmi plus de 60 : ailes, plumes, flûtes, orbes de Dialga/Palkia/Giratina, cube Zygarde, épée et bouclier rouillés…'],
  ['Méga-Gemme', 'Une Méga-Gemme parmi 46, toutes à chances égales.'],
  ['Clé d’arène', 'Une clé d’arène d’un des 18 types, à chances égales.'],
  ['Chapeaux', 'Une casquette cosmétique colorée (à porter avec /hat).'],
  ['Mélange de biomes', 'Graines d’Apricorn et objets utiles pour l’exploration.']
];

const ARCADE = [
  ['Flipper', '4 tables (Miaouss, Taupiqueur, Otaria, Ectoplasma), de 60 à 120 s.'],
  ['Snake & Flappy', 'Ton score est multiplié par 4 en jetons.'],
  ['Block Stacker', 'Rangée 6 : 800 · rangée 7 : 3 000 · rangée 8 : 10 000 jetons.'],
  ['Machine à sous', 'Le classique, un jeton la partie.'],
  ['Voltorbataille', 'Le jeu de cartes de HGSS, 10 jetons la partie.'],
  ['Roulette', 'Tables à 250, 1 000 et 2 500 jetons.'],
  ['Blackjack', 'Bats le croupier sans dépasser 21.'],
  ['Course (Derby)', 'Parie sur le bon coureur.'],
  ['Gacha', 'Mise des jetons, gagne un Pokémon.']
];
const GACHA = [
  { name: 'Basique', bet: '50 – 9 999', parts: [100] },
  { name: 'Super', bet: '250 – 9 999', parts: [70, 30] },
  { name: 'Hyper', bet: '1 000 – 9 999', parts: [45, 35, 20] },
  { name: 'Master', bet: '4 500 – 9 999', parts: [35, 30, 25, 10] }
];
const GACHA_TIERS = [['Commun', '#b8c2dc'], ['Peu commun', '#5fd06a'], ['Rare', '#4fa8ff'], ['Ultra-rare', '#ffd23a']];

const PREMIUM = [
  ['Fossile HA', 15000], ['Fossile Brillant', 16800], ['Fossile Max IV', 21000], ['Booster de cartes', 3000],
  ['Encens shiny', 4200], ['Encens shiny fort', 7000], ['Encens shiny ultime', 15000], ['Lootbag Chapeaux', 3750],
  ['Lootbag Mélange de biomes', 5250], ['Lootbag Clé d’arène', 6000], ['Lootbag Méga-Gemme', 10000],
  ['Lootbag Mythes & Légendes', 10800], ['Fragments météoriques ×4', 1500], ['Fragments rares ×2', 2520],
  ['Fragment fabuleux ×1', 4200], ['Aprijus (7 couleurs)', 5250]
];
const ADOPT = [
  ['Starters (27, toutes générations)', '19 600'], ['Basiques (Pikachu, Évoli, Magicarpe…)', '12 600 – 21 000'],
  ['Intermédiaires (Caninos, Abra, Machoc…)', '19 600'], ['Top (Dracaufeu, Ronflex, Lokhlass…)', '49 000'],
  ['As (Dracolosse, Carchacrok, Lucario…)', '77 000'], ['Ultra-Chimères (Vémini, Mandrillon)', '176 399'],
  ['Zarude', '184 800'], ['Mew', '1 000 000'], ['Poké Ball · Super Ball', '500 · 600'], ['Fossiles Cobblemon', '4 000 – 5 000']
];

const ODDS = [
  { rate: 8600, who: 'Les plus « faciles » : Koraidon, Miraidon, Zacian, Zamazenta, Darkrai, Celebi…' },
  { rate: 10000, who: 'La plupart des légendaires : Mew, Rayquaza, Lugia, Dialga, Palkia, Giratina…' },
  { rate: 20000, who: 'Arceus, volontairement le plus dur du serveur.' }
];
const WHERE = [
  ['⛈️', 'Orage', 'Électhor, Raikou, Fulguris, Regieleki (gros boost par temps d’orage)'],
  ['🌧️', 'Pluie', 'Suicune, Kyogre, Boréas…'],
  ['🌸', 'Biomes fleuris & jungles', 'Mew (bonus à midi), Xerneas, Zarude, Shaymin'],
  ['🕳️', 'Deep Dark', 'Cosmog, Darkrai, Marshadow, Regidrago'],
  ['☁️', 'Très haut dans le ciel, de jour', 'Rayquaza (beau temps et haute altitude)'],
  ['💎', 'Grottes & améthyste', 'Terapagos, Diancie (bonus près de l’améthyste)'],
  ['🌌', 'L’End', 'Giratina, Necrozma, Deoxys, Hoopa et les Ultra-Chimères']
];

const fmt = (n) => n.toLocaleString('fr-FR');

/* ——— Petits composants ——— */

/** Pokémon animé (planches Donjon Mystère du site). */
const Mon = ({ dex, anim = 'walk', dir = 6, size = 72, scale = 2, speed = 1 }) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    preloadSprites([dex]);
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr; c.height = size * dpr;
    const x = c.getContext('2d');
    let raf = 0;
    const t0 = performance.now() - Math.random() * 2000;
    const loop = (now) => {
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, size, size);
      drawPokemon(x, dex, anim, ((now - t0) / 1000) * speed, dir, size / 2, size * 0.86, scale);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dex, anim, dir, size, scale, speed]);
  return <canvas ref={ref} className="acad-mon" style={{ width: size, height: size }} aria-hidden="true" />;
};

/** Nombre qui défile jusqu'à sa valeur quand il apparaît. */
const CountUp = ({ to, prefix = '', suffix = '' }) => {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 1100);
        setV(Math.round(to * (1 - (1 - k) ** 3)));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{prefix}{fmt(v)}{suffix}</span>;
};

const Section = ({ ch, children, lead }) => (
  <section id={ch.id} className="acad-section" data-chapter={ch.id}>
    <header className="acad-section-head">
      <span className="acad-num" aria-hidden="true">{ch.n}</span>
      <div>
        <h2>{ch.title}</h2>
        {lead && <p className="acad-lead">{lead}</p>}
      </div>
    </header>
    {children}
  </section>
);

const Tip = ({ children }) => (
  <aside className="acad-tip"><b>Astuce</b><span>{children}</span></aside>
);

/* ——— Blocs interactifs ——— */

/** La boucle de jeu : un anneau qui s'allume étape par étape. */
const GameLoop = () => {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold) return undefined;
    const id = setInterval(() => setI((v) => (v + 1) % LOOP.length), 2600);
    return () => clearInterval(id);
  }, [hold]);
  return (
    <div className="acad-loop">
      <div className="acad-loop-ring" style={{ '--a': `${(i / LOOP.length) * 360}deg` }}>
        {LOOP.map((s, k) => {
          const a = (k / LOOP.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <button
              key={s.t}
              type="button"
              className={`acad-loop-node${k === i ? ' is-on' : ''}`}
              style={{ left: `${50 + Math.cos(a) * 40}%`, top: `${50 + Math.sin(a) * 40}%` }}
              onClick={() => { setI(k); setHold(true); }}
            >
              <b>{k + 1}</b>
            </button>
          );
        })}
        <div className="acad-loop-center">
          <span className="acad-loop-step">Étape {i + 1} / 5</span>
          <strong key={i}>{LOOP[i].t}</strong>
        </div>
      </div>
      <ol className="acad-loop-list">
        {LOOP.map((s, k) => (
          <li key={s.t} className={k === i ? 'is-on' : ''}>
            <button type="button" onClick={() => { setI(k); setHold(true); }}>
              <b>{s.t}</b><span>{s.d}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
};

/** Les premiers jours : liste à cocher (gardée dans le navigateur). */
const Checklist = () => {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHECK_KEY) || '[]'); } catch { return []; }
  });
  const toggle = (k) => setDone((prev) => {
    const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
    try { localStorage.setItem(CHECK_KEY, JSON.stringify(next)); } catch { /* stockage indisponible */ }
    return next;
  });
  const pct = Math.round((done.length / FIRST_DAYS.length) * 100);
  return (
    <div className="acad-check">
      <div className="acad-check-bar"><b style={{ width: `${pct}%` }} /><span>{done.length} / {FIRST_DAYS.length} fait{done.length > 1 ? 's' : ''}</span></div>
      <ol>
        {FIRST_DAYS.map((s, k) => (
          <li key={s.t} className={done.includes(k) ? 'is-done' : ''}>
            <button type="button" onClick={() => toggle(k)} aria-pressed={done.includes(k)}>
              <i aria-hidden="true">{done.includes(k) ? '✓' : k + 1}</i>
              <span><b>{s.t}</b><small>{s.d}</small></span>
            </button>
          </li>
        ))}
      </ol>
      {pct === 100 && <p className="acad-check-done">Prêt pour l’aventure. Direction les arènes !</p>}
    </div>
  );
};

/** Commandes, avec copie en un clic. */
const Commands = () => {
  const [copied, setCopied] = useState(null);
  const copy = (cmd) => {
    try { navigator.clipboard?.writeText(cmd.replace(/ <.*>$/, ' ')); } catch { /* presse-papiers indisponible */ }
    setCopied(cmd);
    setTimeout(() => setCopied((c) => (c === cmd ? null : c)), 1400);
  };
  return (
    <div className="acad-cmds">
      {COMMANDS.map(([cmd, what]) => (
        <button key={cmd} type="button" className={`acad-cmd${copied === cmd ? ' is-copied' : ''}`} onClick={() => copy(cmd)} title="Copier la commande">
          <code>{cmd}</code>
          <span>{what}</span>
          <em>{copied === cmd ? 'Copié !' : 'Copier'}</em>
        </button>
      ))}
    </div>
  );
};

/** Note de carte : le multiplicateur selon la note de Hatsune Miku. */
const Grader = () => {
  const [note, setNote] = useState(7);
  const m = GRADE[note - 1];
  return (
    <div className="acad-grader">
      <div className="acad-grader-card" data-note={note}>
        <span className="acad-grader-note">{note}</span>
        <small>/ 10</small>
      </div>
      <div className="acad-grader-side">
        <label htmlFor="acad-note">Note de la carte</label>
        <input id="acad-note" type="range" min="1" max="10" value={note} onChange={(e) => setNote(Number(e.target.value))} style={{ '--p': `${((note - 1) / 9) * 100}%` }} />
        <div className="acad-grader-out">
          <span>Bonus</span>
          <strong key={m}>×{String(m).replace('.', ',')}</strong>
        </div>
        <p>{note >= 8 ? 'Une note rare : le bonus de la carte grimpe fort.' : note >= 4 ? 'Les notes 4 à 7 sont les plus fréquentes.' : 'Une petite note réduit le bonus de la carte.'} Un 10 triple le bonus.</p>
      </div>
    </div>
  );
};

/** Chances de croiser au moins un rare après N rencontres. */
const OddsSim = () => {
  const [n, setN] = useState(10000);
  return (
    <div className="acad-odds">
      <div className="acad-odds-head">
        <label htmlFor="acad-enc">Rencontres de Pokémon sauvages</label>
        <strong>{fmt(n)}</strong>
      </div>
      <input id="acad-enc" type="range" min="1000" max="50000" step="1000" value={n} onChange={(e) => setN(Number(e.target.value))} style={{ '--p': `${((n - 1000) / 49000) * 100}%` }} />
      <div className="acad-odds-rows">
        {ODDS.map((o) => {
          const p = 1 - (1 - 1 / o.rate) ** n;
          return (
            <div key={o.rate} className="acad-odds-row">
              <span className="acad-odds-rate">≈ 1 / {fmt(o.rate)}</span>
              <div className="acad-odds-bar"><b style={{ width: `${p * 100}%` }} /><em>{Math.round(p * 100)} %</em></div>
              <small>{o.who}</small>
            </div>
          );
        })}
      </div>
      <p className="acad-odds-note">Chance d’en croiser au moins un. Même après 10 000 rencontres, un légendaire « classique » n’est sûr qu’à 63 % : des soirées sans rien, c’est normal.</p>
    </div>
  );
};

/** Combien de parties de Block Stacker (rangée 8) pour s'offrir un objet ? */
const StackerCalc = () => {
  const [item, setItem] = useState(2);
  const [name, price] = PREMIUM[item];
  const games = Math.ceil(price / 10000);
  return (
    <div className="acad-calc">
      <label htmlFor="acad-item">Je veux m’offrir</label>
      <select id="acad-item" value={item} onChange={(e) => setItem(Number(e.target.value))}>
        {PREMIUM.map(([nm, pr], k) => <option key={nm} value={k}>{nm} · {fmt(pr)} jetons</option>)}
      </select>
      <div className="acad-calc-out">
        <div className="acad-calc-stack" aria-hidden="true">
          {Array.from({ length: Math.min(games, 3) }, (_, k) => <i key={k} style={{ '--k': k }} />)}
        </div>
        <p><strong>{games}</strong> partie{games > 1 ? 's' : ''} de Block Stacker réussie{games > 1 ? 's' : ''} jusqu’à la rangée 8 suffi{games > 1 ? 'sent' : 't'} pour {name.toLowerCase()} ({fmt(price)} jetons).</p>
      </div>
    </div>
  );
};

/* ——— Page ——— */
const PARADE = [25, 1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 150, 249, 384, 483, 491];

const AcademyGuide = ({ onClose }) => {
  const [active, setActive] = useState(CHAPTERS[0].id);
  const [progress, setProgress] = useState(0);
  const rootRef = useRef(null);

  // Chapitre en cours (sommaire) + barre de lecture
  useEffect(() => {
    const sections = [...document.querySelectorAll('.acad-section')];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.dataset.chapter); });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach((s) => io.observe(s));
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); reveal.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.acad-reveal').forEach((el) => reveal.observe(el));
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? window.scrollY / h : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { io.disconnect(); reveal.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  const go = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: 'smooth' });
  };
  const activeIdx = useMemo(() => CHAPTERS.findIndex((c) => c.id === active), [active]);
  // Sur mobile, le sommaire défile tout seul jusqu'au chapitre en cours
  const navRef = useRef(null);
  useEffect(() => {
    const list = navRef.current?.querySelector('ol');
    const btn = list?.querySelector('.is-on');
    if (list && btn && list.scrollWidth > list.clientWidth) list.scrollTo({ left: btn.offsetLeft - list.clientWidth / 2 + btn.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  return (
    <div className="acad" ref={rootRef}>
      <div className="acad-progress" aria-hidden="true"><b style={{ transform: `scaleX(${progress})` }} /></div>

      {/* ——— Couverture ——— */}
      <header className="acad-hero">
        <div className="acad-hero-top">
          <span className="acad-kicker">Bully’s Lair · serveur Minecraft</span>
          <button type="button" className="acad-back" onClick={onClose}>Retour</button>
        </div>
        <div className="acad-hero-main">
          <p className="acad-hero-pre">Le guide du joueur</p>
          <h1 className="acad-title">
            <span>Cobblemon</span>
            <span>Academy <em>2.0</em></span>
          </h1>
          <p className="acad-hero-text">Tout ce qu’il faut savoir pour bien démarrer, progresser et chasser les légendaires sur le serveur : exploration, arènes, cartes à collectionner, objets Academy, économie, mini-jeux et boutique.</p>
          <ul className="acad-tags">
            <li>Minecraft 1.21.1</li>
            <li>Fabric · Cobblemon 1.8</li>
            <li>1000+ Pokémon</li>
            <li>Rares ≈ 1 / 10 000</li>
          </ul>
          <button type="button" className="acad-start" onClick={() => go('bienvenue')}>Commencer la lecture</button>
        </div>
        <div className="acad-parade" aria-hidden="true">
          <div className="acad-parade-track">
            {[...PARADE, ...PARADE].map((dex, k) => <Mon key={`${dex}-${k}`} dex={dex} size={k % PARADE.length >= 13 ? 96 : 72} scale={k % PARADE.length >= 13 ? 1.5 : 2} />)}
          </div>
        </div>
      </header>

      <div className="acad-body">
        {/* ——— Sommaire collant ——— */}
        <nav className="acad-nav" aria-label="Sommaire" ref={navRef}>
          <span className="acad-nav-title">Au programme</span>
          <ol>
            {CHAPTERS.map((c, k) => (
              <li key={c.id}>
                <button type="button" className={`${c.id === active ? 'is-on' : ''}${k < activeIdx ? ' is-read' : ''}`} onClick={() => go(c.id)}>
                  <b>{c.n}</b><span>{c.title}<small>{c.sub}</small></span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="acad-main">
          {/* 01 */}
          <Section ch={CHAPTERS[0]} lead="Cobblemon Academy 2.0 est un modpack construit autour de Cobblemon : tu captures, tu entraînes et tu combats des Pokémon dans un Minecraft entièrement retravaillé. Le but ? Remplir ton Pokédex, battre les arènes, monter ta collection de cartes… et mettre la main sur les légendaires.">
            <div className="acad-stats acad-reveal">
              <div><strong><CountUp to={1000} suffix="+" /></strong><span>Pokémon, formes régionales et Paradoxe inclus</span></div>
              <div><strong>1 – <CountUp to={100} /></strong><span>Niveau des Pokémon sauvages, partout dans le monde</span></div>
              <div><strong><CountUp to={536} /></strong><span>Cartes à collectionner (Kanto), dont 151 shiny</span></div>
              <div><strong>≈ 1 / <CountUp to={10000} /></strong><span>Chance de croiser un Pokémon rare ou légendaire</span></div>
            </div>
            <h3 className="acad-h3">La boucle de jeu</h3>
            <GameLoop />
            <Tip>Pas de légendaire au bout de 3 jours ? C’est normal, et c’est voulu. Les rares sont calibrés autour d’une rencontre sur 10 000. Une soirée sans en voir un, c’est le jeu.</Tip>
          </Section>

          {/* 02 */}
          <Section ch={CHAPTERS[1]} lead="Les trois premiers jours font toute la différence. Voilà l’ordre conseillé : coche au fur et à mesure.">
            <Checklist />
            <div className="acad-duo acad-reveal">
              <div className="acad-panel">
                <h3>Les outils du quotidien</h3>
                <dl className="acad-dl">{TOOLS.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
              </div>
              <div className="acad-panel is-gold">
                <h3>Les bons réflexes</h3>
                <ul className="acad-bullets">{REFLEXES.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            </div>
          </Section>

          {/* 03 */}
          <Section ch={CHAPTERS[2]} lead="Le monde est généré par trois gros packs de biomes (Oh The Biomes We’ve Gone, Regions Unexplored, William Wythers). Chaque biome a son propre lot de Pokémon : change de décor, change de chasse.">
            <div className="acad-trio acad-reveal">
              <div className="acad-panel"><span className="acad-ico">🌲</span><h3>Biomes</h3><p>Des dizaines de biomes inédits, avec leurs arbres, leurs plantes et leurs Pokémon. Le Pokénav te dit qui vit où.</p></div>
              <div className="acad-panel"><span className="acad-ico">🏛️</span><h3>Structures</h3><p>Villages revus, temples, ruines sous-marines, tours, donjons du Nether et de l’End : des centaines de bâtiments à piller.</p></div>
              <div className="acad-panel"><span className="acad-ico">✨</span><h3>Dimensions</h3><p>Monuments légendaires, repaires de raids et arènes ont leurs propres zones. L’End est entièrement refait.</p></div>
            </div>
            <h3 className="acad-h3">Commandes utiles <small>clique pour copier</small></h3>
            <Commands />
            <Tip>Waystones + /home : active chaque Waystone que tu croises, et garde /rtp pour ouvrir de nouvelles zones de chasse.</Tip>
          </Section>

          {/* 04 */}
          <Section ch={CHAPTERS[3]} lead="Les combats sont au tour par tour, comme dans les jeux. À partir du milieu de partie, les natures, les IVs et les objets tenus font vraiment la différence.">
            <div className="acad-panel is-wide acad-reveal">
              <div className="acad-arena">
                <div>
                  <h3>Les arènes</h3>
                  <p>Chaque arène se joue avec une clé d’arène. Combine une clé avec un Joyau de type à l’établi pour choisir le type de l’arène (Feu, Eau, Dragon…). Une fois la clé utilisée, tu es envoyé dans une arène dédiée avec ses dresseurs.</p>
                  <ul className="acad-bullets">
                    <li>Le niveau des dresseurs s’adapte à la moyenne de ton équipe (de 10 à 100).</li>
                    <li>Les dresseurs ont parfois des Pokémon shiny.</li>
                    <li>À la victoire : éclats et caches de récompenses (commune → épique). Du lapis glissé dans la cache améliore le butin.</li>
                    <li>Une Corde Sortie permet de quitter l’arène à tout moment.</li>
                  </ul>
                  <p className="acad-muted">Les clés s’obtiennent en exploration, à la boutique ou via la lootbag « Clé d’arène ».</p>
                </div>
                <div className="acad-key" aria-hidden="true">
                  <span className="acad-key-plus">Clé d’arène</span><span className="acad-key-op">+</span><span className="acad-key-plus is-gem">Joyau de type</span><span className="acad-key-op">=</span><span className="acad-key-plus is-gold">Arène du type choisi</span>
                </div>
              </div>
            </div>
            <div className="acad-duo acad-reveal">
              <div className="acad-panel"><span className="acad-ico">💥</span><h3>Raids</h3><p>Des repaires de raid apparaissent dans le monde. Affronte un Pokémon boss surpuissant, seul ou à plusieurs, pour tenter de le capturer et gagner des récompenses.</p></div>
              <div className="acad-panel"><span className="acad-ico">🏯</span><h3>Monuments légendaires</h3><p>Des monuments et sanctuaires cachés dans le monde servent à invoquer des légendaires avec le bon objet (orbes, plumes, flûtes…).</p></div>
            </div>
            <h3 className="acad-h3">Les mécaniques spéciales</h3>
            <div className="acad-mechs acad-reveal">
              {MECHANICS.map((m) => (
                <div key={m.t} className="acad-mech" style={{ '--c': m.c }} tabIndex={0}>
                  <div className="acad-mech-in">
                    <div className="acad-mech-front"><strong>{m.t}</strong><small>Survole ou touche</small></div>
                    <div className="acad-mech-back"><strong>{m.t}</strong><p>{m.d}</p></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="acad-muted">Gemmes, cristaux, éclats et objets de forme se trouvent dans la boutique Mega Showdown et dans la lootbag « Méga-Gemme ».</p>
          </Section>

          {/* 05 */}
          <Section ch={CHAPTERS[4]} lead="Tes Pokémon ne servent pas qu’à combattre : ils pondent, travaillent et cuisinent avec toi.">
            <div className="acad-panel is-wide acad-reveal">
              <div className="acad-egg-row">
                <div className="acad-egg" aria-hidden="true"><i /><span /></div>
                <div>
                  <h3>L’élevage</h3>
                  <p>Place deux Pokémon compatibles dans un Pâturage : avec le temps, des œufs apparaissent. Récupère-les, garde-les dans ton inventaire (ou un incubateur) et ils éclosent.</p>
                  <ul className="acad-bullets">
                    <li>Les talents cachés se transmettent aux bébés.</li>
                    <li>Méthode Masuda : parents de langues/origines différentes → chances de shiny ×4.</li>
                    <li>Les formes régionales et certaines variantes (couleurs, motifs…) se transmettent aussi.</li>
                    <li>Un pâturage stocke jusqu’à 5 œufs : passe les récolter régulièrement.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="acad-trio acad-reveal">
              <div className="acad-panel"><span className="acad-ico">⛏️</span><h3>Pokémon ouvriers</h3><p>Au pâturage, certains Pokémon récoltent, minent ou cultivent automatiquement selon leur type.</p></div>
              <div className="acad-panel"><span className="acad-ico">🍲</span><h3>Cuisine Pokémon</h3><p>Marmite, en-cas aux baies… Des plats qui soignent ou boostent tes Pokémon (Farmer’s Delight inclus).</p></div>
              <div className="acad-panel"><span className="acad-ico">💿</span><h3>CT</h3><p>Des disques CT pour apprendre de nouvelles attaques à tes Pokémon.</p></div>
              <div className="acad-panel"><span className="acad-ico">🐎</span><h3>Montures</h3><p>Certains Pokémon se chevauchent. Les Aprijus (5 250 jetons, 7 couleurs) améliorent leurs statistiques de monture.</p></div>
              <div className="acad-panel"><span className="acad-ico">🧰</span><h3>Rangement</h3><p>Sacs à dos améliorables, coffres et terminaux de stockage (Sophisticated Storage, Tom’s Storage) pour garder ta base propre.</p></div>
            </div>
            <Tip>Côté shiny, combine la méthode Masuda (×4) avec un Encens shiny (section 07) pour chasser les chromatiques plus vite.</Tip>
          </Section>

          {/* 06 */}
          <Section ch={CHAPTERS[5]} lead="Le système signature de l’Academy. Chaque carte rangée dans ton album te donne un bonus permanent, et les bonus se cumulent.">
            <div className="acad-steps acad-reveal">
              <div className="acad-step"><b>1</b><h3>Ouvre</h3><p>Les boosters se gagnent en réalisant des succès, ou s’achètent à la boutique (3 000 jetons). Chaque booster donne 3 cartes.</p></div>
              <div className="acad-step"><b>2</b><h3>Range</h3><p>Place tes cartes dans l’album (12 emplacements) et équipe-le dans son emplacement d’accessoire : les bonus de toutes ses cartes s’appliquent.</p></div>
              <div className="acad-step"><b>3</b><h3>Fais noter</h3><p>Le PNJ Hatsune Miku note ta carte de 1 à 10. Une bonne note multiplie son bonus.</p></div>
            </div>
            <div className="acad-duo acad-reveal">
              <div className="acad-panel">
                <h3>Les raretés</h3>
                <div className="acad-bars">
                  {RARITIES.map(([nm, n, c]) => (
                    <div key={nm} className="acad-bar" style={{ '--c': c, '--w': `${(n / 151) * 100}%` }}>
                      <span>{nm}</span><i><b /></i><em>{n}</em>
                    </div>
                  ))}
                </div>
              </div>
              <div className="acad-panel">
                <h3>Les types de bonus</h3>
                <dl className="acad-dl">{CARD_BONUSES.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
              </div>
            </div>
            <h3 className="acad-h3">Le multiplicateur de note</h3>
            <Grader />
            <Tip>La gradation est gratuite : fais un clic droit sur Hatsune Miku avec la carte en main. Elle la garde 6 minutes, puis reviens lui parler pour récupérer ta carte notée. Une carte à la fois par joueur, gardée même si le serveur redémarre.</Tip>
          </Section>

          {/* 07 */}
          <Section ch={CHAPTERS[6]}>
            <div className="acad-duo acad-reveal">
              <div className="acad-panel">
                <span className="acad-ico">🦴</span>
                <h3>Fossiles Academy</h3>
                <p>À ressusciter dans la machine à fossiles, comme un fossile classique. Ils donnent un Pokémon aléatoire avec un bonus garanti :</p>
                <dl className="acad-dl">{FOSSILS.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
              </div>
              <div className="acad-panel">
                <span className="acad-ico">🕯️</span>
                <h3>Encens shiny</h3>
                <p>Clic droit pour l’allumer : les chances de shiny augmentent pendant un temps limité.</p>
                <div className="acad-incense">
                  {INCENSE.map(([nm, x, min]) => (
                    <div key={nm} className="acad-incense-row">
                      <span>{nm}</span>
                      <strong>Shiny ×{x}</strong>
                      <i style={{ '--w': `${(min / 60) * 100}%` }}><b /></i>
                      <em>{min} min</em>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <h3 className="acad-h3">Lootbags <small>clic droit pour ouvrir : le sac est consommé et tu reçois aussitôt ton objet</small></h3>
            <div className="acad-bags acad-reveal">
              {LOOTBAGS.map(([nm, d], k) => (
                <details key={nm} className="acad-bag" open={k === 0}>
                  <summary><span className="acad-bag-ico" aria-hidden="true">🎁</span>{nm}</summary>
                  <p>{d}</p>
                </details>
              ))}
            </div>
            <div className="acad-panel is-meteor acad-reveal">
              <span className="acad-ico">☄️</span>
              <h3>Météorites</h3>
              <p>Les fragments météoriques existent en trois qualités : normaux, rares et fabuleux. Tu les trouves en boutique. Pour savoir à quoi ils servent, regarde leurs usages dans JEI/EMI.</p>
            </div>
          </Section>

          {/* 08 */}
          <Section ch={CHAPTERS[7]}>
            <div className="acad-duo acad-reveal">
              <div className="acad-panel is-coin"><span className="acad-coin" aria-hidden="true">$</span><h3>CobbleDollars</h3><p>La monnaie principale. Tu en gagnes en jouant (combats, captures, loot, quêtes) et tu la dépenses chez les marchands.</p></div>
              <div className="acad-panel is-coin"><span className="acad-coin is-token" aria-hidden="true">J</span><h3>Jetons d’arcade</h3><p>Gagnés sur les bornes de mini-jeux. Ils servent à acheter à la boutique Minigames (section 09). Une partie coûte à peine un jeton : tout l’intérêt, c’est le score.</p></div>
            </div>
            <h3 className="acad-h3">Les bornes d’arcade</h3>
            <div className="acad-arcade acad-reveal">
              {ARCADE.map(([nm, d]) => (
                <div key={nm} className="acad-cab"><div className="acad-cab-screen"><strong>{nm}</strong></div><p>{d}</p></div>
              ))}
            </div>
            <h3 className="acad-h3">Les machines gacha</h3>
            <div className="acad-panel is-wide acad-reveal">
              <div className="acad-gacha">
                {GACHA.map((gm) => (
                  <div key={gm.name} className="acad-gacha-row">
                    <div className="acad-gacha-name"><strong>{gm.name}</strong><small>Mise {gm.bet}</small></div>
                    <div className="acad-gacha-bar">
                      {gm.parts.map((pc, k) => <b key={GACHA_TIERS[k][0]} style={{ '--w': `${pc}%`, '--c': GACHA_TIERS[k][1] }} title={`${GACHA_TIERS[k][0]} ${pc} %`}><span>{pc} %</span></b>)}
                    </div>
                  </div>
                ))}
                <div className="acad-legend">{GACHA_TIERS.map(([nm, c]) => <span key={nm} style={{ '--c': c }}>{nm}</span>)}</div>
              </div>
              <p className="acad-muted">Toutes les machines : environ 0,012 % de shiny et 5 % de forme alternative. Seule la Master peut donner un ultra-rare (légendaires compris).</p>
            </div>
            <div className="acad-panel is-red acad-reveal">
              <span className="acad-ico">🃏</span>
              <h3>Le casino (CobbleGamble)</h3>
              <p>Roulette, blackjack, crash, plinko et keno contre la banque, plus pile ou face, course et poker entre joueurs. Mise maximale : 5 millions. Joue avec modération : la banque gagne à la longue !</p>
            </div>
          </Section>

          {/* 09 */}
          <Section ch={CHAPTERS[8]} lead="Elle se paie en jetons d’arcade. Huit rayons : Poké Balls, Soins, Évolution, Entraînement, Ressources, Baies, Pokémon et Academy Premium, plus un catalogue Mega Showdown.">
            <div className="acad-duo acad-reveal">
              <div className="acad-panel">
                <h3>Academy Premium</h3>
                <table className="acad-table"><tbody>{PREMIUM.map(([nm, pr]) => <tr key={nm}><td>{nm}</td><td>{fmt(pr)}</td></tr>)}</tbody></table>
              </div>
              <div className="acad-panel">
                <h3>Pokémon à adopter</h3>
                <table className="acad-table"><tbody>{ADOPT.map(([nm, pr]) => <tr key={nm} className={nm === 'Mew' ? 'is-mew' : ''}><td>{nm}</td><td>{pr}</td></tr>)}</tbody></table>
              </div>
            </div>
            <h3 className="acad-h3">Bon plan : le Block Stacker</h3>
            <StackerCalc />
            <div className="acad-panel acad-reveal">
              <h3>Les autres rayons</h3>
              <p>Évolution (pierres, objets d’échange, douceurs, fossiles, cannes anciennes) · Entraînement (objets tenus, Super Bonbons, vitamines, menthes de nature, PP Plus, capsules de talent) · Ressources (drops de mobs, minerais, lingots et blocs) · Baies (soin, EV, résistances, combat) · Mega Showdown (objets clés, Méga-Gemmes, Cristaux Z, Téra-Éclats, plaques, mémoires…).</p>
            </div>
          </Section>

          {/* 10 */}
          <Section ch={CHAPTERS[9]} lead="Les légendaires, fabuleux, Paradoxe et Ultra-Chimères apparaissent naturellement… mais rarement. Le secret, c’est de chasser au bon endroit, au bon moment, plutôt que de tourner au hasard.">
            <OddsSim />
            <h3 className="acad-h3">Où et quand chercher</h3>
            <div className="acad-where acad-reveal">
              {WHERE.map(([ico, cond, who]) => (
                <div key={cond} className="acad-where-row"><span className="acad-where-ico" aria-hidden="true">{ico}</span><strong>{cond}</strong><span>{who}</span></div>
              ))}
            </div>
            <div className="acad-duo acad-reveal">
              <div className="acad-panel">
                <h3>Mets toutes les chances de ton côté</h3>
                <ul className="acad-bullets">
                  <li>Équipe des cartes épiques qui boostent les spawns rares ou un type précis.</li>
                  <li>Regarde la météo et l’heure avant de partir.</li>
                  <li>Le Pokénav et le Wiki indiquent biome, hauteur et conditions de chaque Pokémon.</li>
                  <li>Pas de chance ? Les monuments et la lootbag Mythes &amp; Légendes permettent aussi d’invoquer des légendaires.</li>
                </ul>
              </div>
              <div className="acad-panel is-gold">
                <h3>Le mental du chasseur</h3>
                <p>À une chance sur 10 000, des sessions sans rien sont normales. Cible un Pokémon, réunis ses conditions, et laisse tourner les spawns. Les apparitions spéciales sont annoncées dans le chat : garde un œil dessus !</p>
              </div>
            </div>
          </Section>

          <footer className="acad-outro">
            <div className="acad-outro-mons" aria-hidden="true">
              <Mon dex={384} anim="idle" dir={0} size={120} scale={1.4} />
              <Mon dex={25} anim="idle" dir={0} size={96} scale={2.6} />
              <Mon dex={249} anim="idle" dir={0} size={120} scale={1.4} />
            </div>
            <h2 className="acad-outro-title">Bonne chasse, dresseur !</h2>
            <p>Une question, un bug, une idée ? Parles-en sur le serveur. Le guide évolue avec le modpack.</p>
            <ul className="acad-motto"><li>Explore</li><li>Capture</li><li>Collectionne</li><li>Deviens légende</li></ul>
            <button type="button" className="acad-back is-big" onClick={onClose}>Retour au site</button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AcademyGuide;
