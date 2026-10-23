import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountChip, useCloudSync } from './account';
import { PmdSprite } from './PokeSwarm';
import SWARM_SHEETS from './swarmSheets';
import { PR_DEX, PR_TYPES } from './prairieDex';
import {
  BALLS, ITEMS, RARITY, WILD_CAP, ballSprite, buy, dailyGift, dexName, duplicates, exportSave, importSave,
  letGo, loadLocal, mergeSaves, nextSpawnIn, progressScore, rarityOf, saveLocal, spriteOf, throwBall, tick, transfer, transferValue
} from './prairieGame';
import './PokePrairie.css';

export const PRAIRIE_HASH = '#prairie';

/** Pont avec l'appli de bureau (Electron) : présent seulement dans l'appli. */
const desk = typeof window !== 'undefined' ? window.prairieDesktop : null;
const GEN_NAMES = ['', 'Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unys', 'Kalos', 'Alola', 'Galar', 'Paldea'];
const fr = (n) => Math.round(n).toLocaleString('fr-FR');
const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i += 1) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296; };

const Mon = ({ dex, shiny, className = '', size }) => {
  const [broken, setBroken] = useState(false);
  if (broken) return <span className={`pr-mon is-fb ${className}`} style={size ? { width: size, height: size } : undefined}>?</span>;
  return <img className={`pr-mon ${className}`} src={spriteOf(dex, shiny)} alt={dexName(dex)} draggable={false} loading="lazy" style={size ? { width: size, height: size } : undefined} onError={() => setBroken(true)} />;
};
const Ball = ({ id, size = 22 }) => <img className="pr-ball" src={ballSprite(BALLS[id].slug)} alt="" width={size} height={size} draggable={false} />;
const Stars = ({ r }) => <span className="pr-stars" style={{ '--rc': RARITY[r].color }}>{'★'.repeat(RARITY[r].stars)}</span>;

/** Le partenaire qui se promène (sprite animé Donjon Mystère quand il existe). */
const Partner = ({ dex, shiny, small = false }) => {
  const [dir, setDir] = useState(2);
  useEffect(() => { const id = setInterval(() => setDir((d) => (d === 2 ? 6 : 2)), 11000); return () => clearInterval(id); }, []);
  if (!dex) return null;
  return (
    <div className={`pr-partner${small ? ' is-small' : ''}`} style={{ '--flip': dir === 2 ? 1 : -1 }}>
      {SWARM_SHEETS[dex] && !shiny
        ? <PmdSprite dex={dex} anim="walk" dir={dir} size={small ? 56 : 84} scale={small ? 1.6 : 2.4} foot={0.92} />
        : <span className="pr-partner-static" style={{ transform: `scaleX(${dir === 2 ? -1 : 1})` }}><Mon dex={dex} shiny={shiny} /></span>}
    </div>
  );
};

/* ——— Rencontre (une seule, ou une suite pendant le Rush) ——— */
const Encounter = ({ save, setSave, queue, onClose, rush }) => {
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState(null); // { ball, shakes, result }
  const [log, setLog] = useState({ caught: 0, coins: 0, fled: 0, shinies: 0 });
  const ids = useRef(queue);
  const live = save.wild.find((w) => w.id === ids.current[idx]);
  const lastCur = useRef(null);
  if (live) lastCur.current = live;
  const cur = live || (anim ? lastCur.current : null);
  const next = useCallback(() => {
    setAnim(null);
    let i = idx + 1;
    while (i < ids.current.length && !save.wild.find((w) => w.id === ids.current[i])) i += 1;
    if (i >= ids.current.length) setIdx(-1); else setIdx(i);
  }, [idx, save.wild]);
  const throwIt = (ballId) => {
    if (!live || anim) return;
    const res = throwBall(save, cur.id, ballId);
    if (res.result === 'noball') { setAnim({ msg: `Plus de ${BALLS[ballId].name} !`, result: 'noball' }); setTimeout(() => setAnim(null), 900); return; }
    setAnim({ ball: ballId, shakes: res.shakes, result: 'throw' });
    const total = 500 + res.shakes * 450;
    setTimeout(() => {
      setSave(res.save);
      setAnim({ ball: ballId, result: res.result, coins: res.coins, isNew: res.isNew });
      if (res.result === 'caught') setLog((l) => ({ ...l, caught: l.caught + 1, coins: l.coins + res.coins, shinies: l.shinies + (cur.shiny ? 1 : 0) }));
      if (res.result === 'fled') setLog((l) => ({ ...l, fled: l.fled + 1 }));
      if (res.result !== 'broke') setTimeout(next, rush ? 850 : 1300);
      else setTimeout(() => setAnim(null), 700);
    }, total);
  };
  const skip = () => { if (!live || anim) return; setSave(letGo(save, cur.id)); next(); };
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose(log);
      else if (e.key === ' ') { e.preventDefault(); throwIt('poke'); }
      else if (['1', '2', '3', '4'].includes(e.key)) throwIt(Object.keys(BALLS)[Number(e.key) - 1]);
      else if (e.key.toLowerCase() === 'x') skip();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  useEffect(() => { if (idx === -1 && !rush) onClose(log); }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps
  if (idx === -1 || (!cur && !anim)) {
    return (
      <div className="pr-enc-wrap" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(log); }}>
        <div className="pr-enc is-done">
          <h2>{rush ? 'Rush terminé !' : 'Il est parti…'}</h2>
          {rush && (
            <div className="pr-recap">
              <span><b>{log.caught}</b> capturés</span>
              <span><b>{fr(log.coins)}</b> pièces</span>
              <span><b>{log.fled}</b> enfuis</span>
              {log.shinies > 0 && <span className="is-shiny"><b>{log.shinies}</b> chromatique{log.shinies > 1 ? 's' : ''} ✨</span>}
            </div>
          )}
          <button type="button" className="pr-btn is-main" onClick={() => onClose(log)}>Retour à la prairie</button>
        </div>
      </div>
    );
  }
  const r = rarityOf(cur.dex);
  const left = ids.current.slice(idx).filter((id) => save.wild.some((w) => w.id === id)).length;
  return (
    <div className="pr-enc-wrap">
      <div className={`pr-enc rar-${r}${cur.shiny ? ' is-shiny' : ''}`} style={{ '--rc': RARITY[r].color }}>
        <header>
          {rush ? <span className="pr-enc-count">Rush · encore {left}</span> : <span className="pr-enc-count">Rencontre</span>}
          <button type="button" className="pr-x" onClick={() => onClose(log)} aria-label="Fermer">✕</button>
        </header>
        <div className="pr-enc-stage">
          <span className="pr-enc-ring" />
          {(!anim || anim.result === 'broke' || anim.result === 'noball') && <Mon dex={cur.dex} shiny={cur.shiny} className="pr-enc-mon" />}
          {anim?.result === 'fled' && <Mon dex={cur.dex} shiny={cur.shiny} className="pr-enc-mon is-fleeing" />}
          {anim?.ball && anim.result !== 'fled' && anim.result !== 'broke' && (
            <span className={`pr-thrown is-${anim.result}`} style={{ '--shakes': anim.shakes || 0 }}><Ball id={anim.ball} size={48} /></span>
          )}
          {cur.shiny && <span className="pr-sparkles" aria-hidden="true">✨</span>}
        </div>
        <div className="pr-enc-info">
          <h2>{dexName(cur.dex)}{cur.shiny && <em> chromatique</em>}</h2>
          <p><Stars r={r} /> {RARITY[r].label} · niv. {cur.lvl} · {PR_TYPES[PR_DEX[cur.dex][4]]} · #{cur.dex}{!save.dex[cur.dex]?.[1] && <b className="pr-new"> Nouveau !</b>}</p>
        </div>
        <div className="pr-enc-msg" aria-live="polite">
          {anim?.result === 'caught' && <span className="is-good">Attrapé ! +{anim.coins} pièces{anim.isNew ? ' · nouvelle espèce' : ''}</span>}
          {anim?.result === 'broke' && <span className="is-warn">Oh non ! Il s’est libéré !</span>}
          {anim?.result === 'fled' && <span className="is-bad">Il s’est enfui…</span>}
          {anim?.result === 'noball' && <span className="is-warn">{anim.msg}</span>}
          {anim?.result === 'throw' && <span>…</span>}
        </div>
        <div className="pr-enc-balls">
          {Object.keys(BALLS).map((id) => (
            <button key={id} type="button" className="pr-ballbtn" disabled={Boolean(anim) || !(save.balls[id] > 0)} onClick={() => throwIt(id)} title={`${BALLS[id].name} (touche ${BALLS[id].key})`}>
              <Ball id={id} size={30} />
              <span>{BALLS[id].name}</span>
              <b>×{save.balls[id] || 0}</b>
            </button>
          ))}
          <button type="button" className="pr-ballbtn is-skip" disabled={Boolean(anim)} onClick={skip} title="Laisser partir (touche X)">
            <span className="pr-skip-ic">↷</span><span>Laisser partir</span><b>X</b>
          </button>
        </div>
        <p className="pr-keys">Espace : Poké Ball · 1-4 : choisir la Ball · X : laisser partir · Échap : quitter</p>
      </div>
    </div>
  );
};

/* ——— Pokédex ——— */
const Dex = ({ save }) => {
  const [gen, setGen] = useState(1);
  const [show, setShow] = useState(null);
  const counts = useMemo(() => {
    const c = Array.from({ length: 10 }, () => [0, 0]);
    for (let d = 1; d < PR_DEX.length; d += 1) { const g = PR_DEX[d][3]; c[g][1] += 1; c[0][1] += 1; if (save.dex[d]?.[1]) { c[g][0] += 1; c[0][0] += 1; } }
    return c;
  }, [save.dex]);
  const list = [];
  for (let d = 1; d < PR_DEX.length; d += 1) if (!gen || PR_DEX[d][3] === gen) list.push(d);
  return (
    <div className="pr-dex">
      <div className="pr-tabs is-sub">
        {GEN_NAMES.map((n, g) => (
          <button key={g} type="button" className={gen === g ? 'is-on' : ''} onClick={() => setGen(g)}>
            {g ? n : 'Tous'} <small>{counts[g][0]}/{counts[g][1]}</small>
          </button>
        ))}
      </div>
      <div className="pr-dex-grid">
        {list.map((d) => {
          const st = save.dex[d];
          return (
            <button key={d} type="button" className={`pr-dex-cell${st?.[1] ? ' is-caught' : st?.[0] ? ' is-seen' : ''}${st?.[2] ? ' is-shiny' : ''}`} onClick={() => st?.[0] && setShow(d)} title={st?.[0] ? dexName(d) : `#${d}`}>
              {st?.[0] ? <Mon dex={d} /> : <span className="pr-dex-q">?</span>}
              <small>#{d}</small>
            </button>
          );
        })}
      </div>
      {show && (
        <div className="pr-enc-wrap" onPointerDown={(e) => { if (e.target === e.currentTarget) setShow(null); }}>
          <div className="pr-enc is-card" style={{ '--rc': RARITY[rarityOf(show)].color }}>
            <header><span className="pr-enc-count">#{show} · {GEN_NAMES[PR_DEX[show][3]]}</span><button type="button" className="pr-x" onClick={() => setShow(null)}>✕</button></header>
            <div className="pr-card-mons"><Mon dex={show} className="pr-enc-mon" />{save.dex[show]?.[2] ? <Mon dex={show} shiny className="pr-enc-mon" /> : null}</div>
            <div className="pr-enc-info">
              <h2>{dexName(show)}</h2>
              <p><Stars r={rarityOf(show)} /> {RARITY[rarityOf(show)].label} · {PR_TYPES[PR_DEX[show][4]]} · {save.dex[show]?.[1] ? `${save.box.filter((b) => b[1] === show).length} dans ta boîte` : 'Vu, pas encore attrapé'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ——— Boîte ——— */
const Box = ({ save, setSave, toast }) => {
  const [q, setQ] = useState('');
  const [onlyShiny, setOnlyShiny] = useState(false);
  const [sort, setSort] = useState('recent');
  const dups = useMemo(() => duplicates(save), [save]);
  const dupValue = useMemo(() => { const s = new Set(dups); return save.box.filter((b) => s.has(b[0])).reduce((n, b) => n + transferValue(b), 0); }, [dups, save.box]);
  const [confirm, setConfirm] = useState(false);
  let list = save.box.filter((b) => (!onlyShiny || b[2]) && (!q.trim() || dexName(b[1]).toLowerCase().includes(q.trim().toLowerCase())));
  if (sort === 'recent') list = [...list].reverse();
  else if (sort === 'dex') list = [...list].sort((a, b) => a[1] - b[1] || b[3] - a[3]);
  else if (sort === 'rare') list = [...list].sort((a, b) => RARITY[rarityOf(b[1])].stars - RARITY[rarityOf(a[1])].stars || b[2] - a[2]);
  const shown = list.slice(0, 400);
  return (
    <div className="pr-box">
      <div className="pr-box-tools">
        <input className="pr-input" type="search" placeholder="Chercher un Pokémon…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="pr-input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier">
          <option value="recent">Les plus récents</option>
          <option value="dex">Numéro du Pokédex</option>
          <option value="rare">Les plus rares</option>
        </select>
        <label className="pr-check"><input type="checkbox" checked={onlyShiny} onChange={(e) => setOnlyShiny(e.target.checked)} /> Chromatiques</label>
        <button type="button" className="pr-btn" disabled={!dups.length} onClick={() => setConfirm(true)}>Transférer les doublons ({dups.length}) · +{fr(dupValue)} pièces</button>
      </div>
      <p className="pr-note">{save.box.length} Pokémon. Clique sur un Pokémon pour en faire ton partenaire : il se promène dans la prairie et aide à capturer ceux de son type.</p>
      <div className="pr-box-grid">
        {shown.map((b) => (
          <button key={b[0]} type="button" className={`pr-box-cell${save.partner === b[0] ? ' is-partner' : ''}${b[2] ? ' is-shiny' : ''}`} onClick={() => setSave({ ...save, partner: b[0], updatedAt: Date.now() })} title={`${dexName(b[1])} · niv. ${b[3]}`}>
            <Mon dex={b[1]} shiny={Boolean(b[2])} />
            <b>{dexName(b[1])}</b>
            <small>niv. {b[3]}{b[2] ? ' ✨' : ''}</small>
            {save.partner === b[0] && <em>Partenaire</em>}
          </button>
        ))}
        {!save.box.length && <p className="pr-note">Ta boîte est vide : lance un Rush pour attraper tes premiers Pokémon !</p>}
      </div>
      {list.length > shown.length && <p className="pr-note">… et {list.length - shown.length} autres (affine la recherche).</p>}
      {confirm && (
        <div className="pr-enc-wrap" onPointerDown={(e) => { if (e.target === e.currentTarget) setConfirm(false); }}>
          <div className="pr-enc is-done">
            <h2>Transférer {dups.length} doublons ?</h2>
            <p>On garde le meilleur exemplaire de chaque espèce, tous les chromatiques et ton partenaire. Le Professeur te donne <b>{fr(dupValue)} pièces</b>.</p>
            <div className="pr-row">
              <button type="button" className="pr-btn" onClick={() => setConfirm(false)}>Annuler</button>
              <button type="button" className="pr-btn is-main" onClick={() => { const r = transfer(save, dups); setSave(r.save); setConfirm(false); toast(`${r.count} Pokémon transférés · +${fr(r.coins)} pièces`); }}>Transférer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ——— Boutique ——— */
const Shop = ({ save, setSave, toast }) => {
  const now = Date.now();
  const doBuy = (kind, id, qty) => {
    const next = buy(save, kind, id, qty);
    if (!next) { toast('Pas assez de pièces.'); return; }
    setSave(next);
    toast(kind === 'ball' ? `+${qty} ${BALLS[id].name}` : `${ITEMS[id].name} activé !`);
  };
  return (
    <div className="pr-shop">
      {Object.entries(BALLS).map(([id, b]) => (
        <div key={id} className="pr-shop-item">
          <Ball id={id} size={40} />
          <div><b>{b.name}</b><small>{id === 'master' ? 'Capture à coup sûr.' : `Chances de capture ×${b.mult}.`} Tu en as {save.balls[id] || 0}.</small></div>
          <div className="pr-row">
            <button type="button" className="pr-btn" disabled={save.coins < b.price} onClick={() => doBuy('ball', id, 1)}>{fr(b.price)} ◎</button>
            {id !== 'master' && <button type="button" className="pr-btn" disabled={save.coins < b.price * 10} onClick={() => doBuy('ball', id, 10)}>×10 · {fr(b.price * 10)} ◎</button>}
          </div>
        </div>
      ))}
      {Object.entries(ITEMS).map(([id, it]) => {
        const active = id === 'charm' ? save.charm : (save.boosts[id] || 0) > now;
        return (
          <div key={id} className={`pr-shop-item${active ? ' is-active' : ''}`}>
            <img className="pr-ball" src={ballSprite(it.slug)} alt="" width={40} height={40} />
            <div><b>{it.name}</b><small>{it.desc}{active && id !== 'charm' ? ` Actif encore ${mmss(save.boosts[id] - now)}.` : ''}{id === 'charm' && save.charm ? ' Déjà obtenu.' : ''}</small></div>
            <button type="button" className="pr-btn" disabled={save.coins < it.price || (id === 'charm' && save.charm)} onClick={() => doBuy('item', id)}>{fr(it.price)} ◎</button>
          </div>
        );
      })}
    </div>
  );
};

/* ——— Réglages ——— */
const Settings = ({ save, setSave, toast, user }) => {
  const fileRef = useRef(null);
  const download = () => {
    const blob = new Blob([exportSave(save)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `poke-prairie-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const load = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => { setSave({ ...importSave(t), updatedAt: Date.now() }); toast('Sauvegarde importée.'); }).catch((err) => toast(err.message || 'Fichier illisible.'));
    e.target.value = '';
  };
  return (
    <div className="pr-settings">
      <section>
        <h3>Sauvegarde</h3>
        <p>Ta progression est gardée sur cet appareil{user ? ' et synchronisée avec ton compte Bully’s Lair : tu la retrouves sur le site comme dans l’appli de bureau.' : '. Connecte-toi pour la retrouver sur tous tes appareils.'} Le jeu marche aussi hors ligne : la synchro reprend au retour du réseau.</p>
        <div className="pr-row">
          <button type="button" className="pr-btn" onClick={download}>Exporter un fichier</button>
          <button type="button" className="pr-btn" onClick={() => fileRef.current?.click()}>Importer un fichier</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={load} />
        </div>
      </section>
      <section>
        <h3>Appli de bureau</h3>
        <p>{desk ? 'Tu joues dans l’appli de bureau : la prairie reste en bandeau au-dessus de ta barre des tâches.' : 'L’appli de bureau garde la prairie en petit bandeau au-dessus de ta barre des tâches, avec la même sauvegarde que le site.'}</p>
        {!desk && (
          <div className="pr-row">
            <a className="pr-btn is-main pr-link" href="https://github.com/JuleSpace/AnimeQuiz/releases/download/prairie-latest/Poke-Prairie-Setup.exe">Télécharger pour Windows</a>
            <a className="pr-btn pr-link" href="https://github.com/JuleSpace/AnimeQuiz/releases/download/prairie-latest/Poke-Prairie-portable.exe">Version sans installation</a>
          </div>
        )}
        {desk && (
          <div className="pr-row">
            <AccountChip returnHash={PRAIRIE_HASH} />
            <label className="pr-check"><input type="checkbox" checked={desk.getTop?.() !== false} onChange={(e) => desk.setTop?.(e.target.checked)} /> Toujours au premier plan</label>
            <label className="pr-check"><input type="checkbox" checked={Boolean(desk.getAutostart?.())} onChange={(e) => desk.setAutostart?.(e.target.checked)} /> Lancer au démarrage de Windows</label>
          </div>
        )}
      </section>
      <section>
        <h3>Statistiques</h3>
        <div className="pr-recap">
          <span><b>{fr(save.stats.caught)}</b> capturés</span>
          <span><b>{Object.values(save.dex).filter((v) => v[1]).length}</b> espèces</span>
          <span><b>{save.stats.shinies}</b> chromatiques</span>
          <span><b>{save.stats.rushes}</b> Rush</span>
          <span><b>{fr(save.stats.coinsEarned)}</b> pièces gagnées</span>
        </div>
      </section>
    </div>
  );
};

/* ——— Écran principal ——— */
const PokePrairie = ({ onClose }) => {
  const [save, setSaveRaw] = useState(() => {
    let s = tick(loadLocal()).save;
    s = dailyGift(s).save;
    return s;
  });
  const [away] = useState(() => { const s = loadLocal(); return Math.max(0, tick(s).added); });
  const [gift] = useState(() => dailyGift(loadLocal()).gift);
  const [tab, setTab] = useState('prairie');
  const [enc, setEnc] = useState(null); // { queue, rush }
  const [panel, setPanel] = useState(!desk); // appli de bureau : bandeau replié au départ
  const [msg, setMsg] = useState(null);
  const [now, setNow] = useState(Date.now());
  const setSave = useCallback((s) => setSaveRaw(typeof s === 'function' ? s : () => s), []);
  const toast = useCallback((m) => { setMsg(m); setTimeout(() => setMsg((x) => (x === m ? null : x)), 2600); }, []);

  useEffect(() => { saveLocal(save); }, [save]);
  // Hors ligne : le service worker garde le site et les sprites en cache
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  const user = useCloudSync('prairie', save, (remote) => setSaveRaw((local) => tick(mergeSaves(local, remote)).save), progressScore);
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setSaveRaw((s) => { const r = tick(s); return r.added ? r.save : s; });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (away > 0) toast(`${away} Pokémon sont apparus pendant ton absence !`);
    else if (gift) toast(`Cadeau du jour : ${gift.poke} Poké Balls et ${gift.super} Super Balls`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Appli de bureau : fond transparent, et la fenêtre suit le bandeau ou le panneau
  useEffect(() => {
    if (!desk) return undefined;
    document.documentElement.classList.add('pr-desktop');
    return () => document.documentElement.classList.remove('pr-desktop');
  }, []);
  useEffect(() => { desk?.setMode?.(panel || enc ? 'panel' : 'strip'); }, [panel, enc]);
  // Notification quand la prairie se remplit et que le jeu est en arrière-plan
  const notified = useRef(0);
  useEffect(() => {
    const n = save.wild.length;
    if (n >= 15 && notified.current < 15 && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification('Poké Prairie', { body: `${n} Pokémon sauvages t’attendent : c’est l’heure d’un Rush !` }); } catch { /* notifications indisponibles */ }
    }
    notified.current = n;
  }, [save.wild.length]);

  const partner = save.box.find((b) => b[0] === save.partner);
  const startRush = () => {
    if (!save.wild.length) { toast('Aucun Pokémon sauvage pour l’instant. Reviens un peu plus tard !'); return; }
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    setSave({ ...save, stats: { ...save.stats, rushes: save.stats.rushes + 1 } });
    setEnc({ queue: [...save.wild].sort((a, b) => a.t - b.t).map((w) => w.id), rush: true });
  };
  const closeEnc = () => setEnc(null);
  const lure = (save.boosts.lure || 0) > now;
  const incense = (save.boosts.incense || 0) > now;
  const caughtSpecies = Object.values(save.dex).filter((v) => v[1]).length;

  const strip = (
    <div className="pr-strip">
      <div className="pr-strip-grass">
        {partner && <Partner dex={partner[1]} shiny={Boolean(partner[2])} small />}
        {save.wild.slice(-6).map((w) => (
          <button key={w.id} type="button" className="pr-strip-wild" style={{ left: `${18 + hash(w.id) * 64}%` }} onClick={() => setEnc({ queue: [w.id], rush: false })} title={dexName(w.dex)}>
            <span className="pr-rustle" />
          </button>
        ))}
      </div>
      <div className="pr-strip-info">
        <b>{save.wild.length}</b><span>sauvage{save.wild.length > 1 ? 's' : ''}</span>
        <small>prochain dans {mmss(nextSpawnIn(save, now))}</small>
      </div>
      <button type="button" className="pr-rush is-small" onClick={startRush} disabled={!save.wild.length}>RUSH</button>
      <button type="button" className="pr-strip-btn" onClick={() => setPanel((p) => !p)} title={panel ? 'Replier' : 'Ouvrir la prairie'}>{panel ? '▾' : '▴'}</button>
      {desk && <button type="button" className="pr-strip-btn" onClick={() => desk.hide?.()} title="Masquer (l’icône reste près de l’horloge)">–</button>}
    </div>
  );

  return (
    <div className={`pr-root${desk ? ' is-desktop' : ''}${desk && !panel && !enc ? ' is-collapsed' : ''}`}>
      {(panel || !desk) && (
        <div className="pr-panel">
          <header className="pr-head">
            {!desk && <button type="button" className="pr-btn is-ghost" onClick={onClose}>← Bully’s Lair</button>}
            <div className="pr-logo"><span>POKÉ</span><b>PRAIRIE</b></div>
            <div className="pr-head-stats">
              <span className="pr-chip is-gold" title="Pièces">◎ {fr(save.coins)}</span>
              {Object.keys(BALLS).filter((id) => save.balls[id] > 0 || id === 'poke').map((id) => <span key={id} className="pr-chip" title={BALLS[id].name}><Ball id={id} size={18} />{save.balls[id]}</span>)}
              <span className="pr-chip" title="Espèces attrapées">Pokédex {caughtSpecies}/1025</span>
              {!desk && <AccountChip returnHash={PRAIRIE_HASH} />}
            </div>
          </header>
          <nav className="pr-tabs">
            {[['prairie', 'Prairie'], ['dex', 'Pokédex'], ['box', `Boîte (${save.box.length})`], ['shop', 'Boutique'], ['settings', 'Réglages']].map(([id, label]) => (
              <button key={id} type="button" className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}</button>
            ))}
          </nav>
          <main className="pr-main">
            {tab === 'prairie' && (
              <div className="pr-meadow-wrap">
                <div className={`pr-meadow${lure ? ' has-lure' : ''}${incense ? ' has-incense' : ''}`}>
                  <span className="pr-sun" />
                  <span className="pr-hill is-1" /><span className="pr-hill is-2" />
                  {save.wild.slice(-18).map((w) => {
                    const x = 6 + hash(w.id) * 86;
                    const y = 42 + hash(`${w.id}y`) * 44;
                    return (
                      <button key={w.id} type="button" className={`pr-wild${w.shiny ? ' is-shiny' : ''}`} style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y), '--d': `${hash(`${w.id}d`) * 3}s` }} onClick={() => setEnc({ queue: [w.id], rush: false })} title={`${dexName(w.dex)} · niv. ${w.lvl}`}>
                        <Mon dex={w.dex} shiny={w.shiny} />
                        <span className="pr-wild-grass" />
                      </button>
                    );
                  })}
                  <div className="pr-meadow-partner">{partner && <Partner dex={partner[1]} shiny={Boolean(partner[2])} />}</div>
                  {!save.wild.length && <p className="pr-meadow-empty">Les hautes herbes sont calmes… Un Pokémon apparaît toutes les 3 minutes, même quand le jeu est fermé.</p>}
                </div>
                <div className="pr-meadow-bar">
                  <div>
                    <b>{save.wild.length}</b> / {WILD_CAP} Pokémon sauvages · prochain dans {mmss(nextSpawnIn(save, now))}
                    {lure && <span className="pr-chip is-boost">Leurre {mmss(save.boosts.lure - now)}</span>}
                    {incense && <span className="pr-chip is-boost">Encens {mmss(save.boosts.incense - now)}</span>}
                  </div>
                  <button type="button" className="pr-rush" onClick={startRush} disabled={!save.wild.length}>RUSH !</button>
                </div>
                {save.wild.length >= WILD_CAP - 5 && <p className="pr-note is-warn">La prairie est presque pleine : au-delà de {WILD_CAP}, les plus anciens repartent.</p>}
              </div>
            )}
            {tab === 'dex' && <Dex save={save} />}
            {tab === 'box' && <Box save={save} setSave={setSave} toast={toast} />}
            {tab === 'shop' && <Shop save={save} setSave={setSave} toast={toast} />}
            {tab === 'settings' && <Settings save={save} setSave={setSave} toast={toast} user={user} />}
          </main>
          {!desk && <footer className="pr-foot">Fan-game non officiel, gratuit et sans but lucratif. Pokémon © Nintendo / Game Freak / The Pokémon Company. Sprites : PokéAPI, PMDCollab SpriteCollab (CC BY-NC 4.0).</footer>}
        </div>
      )}
      {desk && strip}
      {enc && <Encounter save={save} setSave={setSave} queue={enc.queue} rush={enc.rush} onClose={closeEnc} />}
      {msg && <div className="pr-toast" role="status">{msg}</div>}
    </div>
  );
};

export default PokePrairie;
