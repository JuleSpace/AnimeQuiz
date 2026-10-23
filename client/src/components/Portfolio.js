import React, { useEffect, useRef } from 'react';
import { PROJECTS, SKILLS, STATS } from './showcase';
import './Portfolio.css';

export const PORTFOLIO_HASH = '#portfolio';

/** Révèle les blocs au défilement (une seule fois). */
const useReveal = () => {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const els = root.querySelectorAll('.pf-reveal');
    if (typeof IntersectionObserver === 'undefined') { els.forEach((e) => e.classList.add('is-in')); return undefined; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return ref;
};

const Portfolio = ({ onClose, onGames, onOpen }) => {
  const ref = useReveal();
  useEffect(() => { document.title = 'Portfolio · Bully’s Lair'; return () => { document.title = 'Bully’s Lair'; }; }, []);
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <div className="pf-root" ref={ref}>
      <nav className="pf-nav">
        <button type="button" className="pf-brand" onClick={onClose}>Bully’s Lair</button>
        <div className="pf-nav-links">
          <button type="button" onClick={() => go('pf-projets')}>Projets</button>
          <button type="button" onClick={() => go('pf-competences')}>Compétences</button>
          <button type="button" className="pf-nav-cta" onClick={onGames}>Jouer aux jeux</button>
        </div>
      </nav>

      <header className="pf-hero">
        <div className="pf-hero-text">
          <span className="pf-kicker">Portfolio · développement web</span>
          <h1>Des jeux et des outils web, du quiz en temps réel à la 3D dans le navigateur.</h1>
          <p>Sept projets conçus, développés et mis en ligne sur Bully’s Lair : un quiz multijoueur synchronisé en temps réel, des jeux d’action en 2D et en 3D, un auto-battler et des pages éditoriales animées. Tout est jouable directement depuis cette page.</p>
          <div className="pf-hero-cta">
            <button type="button" className="pf-btn is-main" onClick={() => go('pf-projets')}>Voir les projets</button>
            <button type="button" className="pf-btn" onClick={onGames}>Jouer aux jeux</button>
          </div>
        </div>
        <div className="pf-hero-art" aria-hidden="true">
          {PROJECTS.slice(0, 4).map((p, i) => <img key={p.id} src={p.img} alt="" style={{ '--i': i }} />)}
        </div>
      </header>

      <section className="pf-stats pf-reveal" aria-label="En chiffres">
        {STATS.map(([v, l]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}
      </section>

      <section id="pf-projets" className="pf-projects">
        <h2 className="pf-h2 pf-reveal">Projets</h2>
        {PROJECTS.map((p, i) => (
          <article key={p.id} className={`pf-project pf-reveal${i % 2 ? ' is-flip' : ''}`} style={{ '--c': p.color }}>
            <button type="button" className="pf-shot" onClick={() => onOpen(p)} aria-label={`Ouvrir ${p.title}`}>
              <img src={p.img} alt={`Capture d’écran de ${p.title}`} loading="lazy" />
              <span className="pf-shot-cta">{p.hash ? 'Ouvrir' : 'Rejoindre une partie'} →</span>
            </button>
            <div className="pf-project-text">
              <span className="pf-no">{String(p.no).padStart(2, '0')}</span>
              <h3>{p.title}</h3>
              <span className="pf-sub">{p.subtitle} · {p.genre}</span>
              <p>{p.pitch}</p>
              <ul>{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
              <div className="pf-tech">{p.tech.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
          </article>
        ))}
      </section>

      <section id="pf-competences" className="pf-skills">
        <h2 className="pf-h2 pf-reveal">Compétences</h2>
        <div className="pf-skill-grid">
          {SKILLS.map((s) => (
            <div key={s.group} className="pf-skill pf-reveal">
              <h3>{s.group}</h3>
              <ul>{s.items.map((it) => <li key={it}>{it}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="pf-foot pf-reveal">
        <p>Tous les projets sont en ligne et jouables.</p>
        <div className="pf-hero-cta">
          <button type="button" className="pf-btn is-main" onClick={onGames}>Ouvrir la ludothèque</button>
          <button type="button" className="pf-btn" onClick={onClose}>Accueil du site</button>
        </div>
        <small>bullys-lair.dev/portfolio</small>
      </footer>
    </div>
  );
};

export default Portfolio;
