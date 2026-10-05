import React, { useEffect, useRef, useState } from 'react';
import { JokerCard } from './JokerCards';
import Icon from './ArcadeIcon';

const SLIDES = [
  {
    kicker: 'Quiz classique',
    title: 'La partie',
    points: [
      'L’organisateur ne joue pas (pas illogique).',
      'Le plus haut score gagne. Un F5 garde la place deux minutes.',
      'On peut rejoindre en cours de route, avec un booster tout de suite.'
    ]
  },
  {
    kicker: 'Une question',
    title: 'Le tour',
    points: [
      'Dès 20 questions, un booster tous les 20 %. De 10 à 19, un tous les 50 %. En dessous, un seul.',
      'Temps illimité, ou l’orga clos les réponses.',
      'Attente, puis l’orga donne les points et valide. La salle voit alors la réponse.',
    ]
  },
  {
    kicker: 'Les questions',
    title: 'Les formes',
    points: [
      'Choix multiple, choix d\'images, vrai/faux, texte libre, blind test masqué.',
      'Un blind test peut se répondre en choix multiple.',
      'Classement, ou placement sur une frise et un schéma. Un seul élément à placer suffit.',
      'La frise peut afficher une date de début et une date de fin.',
      'L’image et la vidéo de la réponse n’apparaissent qu’avec les points.',
      'Rien n’est noté tout seul : l’orga décide.'
    ]
  },
  {
    kicker: 'Les points',
    title: 'Notes et indices',
    points: [
      'De 0 à 99. « Valider » propose les points de la question.',
      'Un indice coûte 1 point.',
      'L’organisateur écrit l’indice, et peut envoyer plusieurs messages.'
    ]
  },
  {
    card: 'double',
    kicker: 'Avant de répondre',
    title: 'Double mise',
    points: [
      'Les points de l’orga sur cette question sont multipliés par deux.',
      'S’il met 0, ça reste 0 et oui coup dur.'
    ]
  },
  {
    card: 'filet',
    kicker: 'Avant de répondre',
    title: 'Filet',
    points: [
      'Tu prends la moyenne des autres. Tes points ne comptent pas dedans.',
      'Si tes points sont plus hauts, tu gardes les tiens.',
      'La moyenne est arrondie. (Spoiler : y a un monde où elle foire mais normalement pas)'
    ]
  },
  {
    card: 'seconde',
    kicker: 'Question ouverte',
    title: 'Seconde main',
    points: [
      'Tu peux la jouer avant ta réponse, ou après, tant que la question est ouverte.',
      'La première reste. Tu en envoies une deuxième, quel que soit le type de question.',
      'L’organisateur note les deux. La plus haute est retenue.'
    ]
  },
  {
    card: 'copie',
    kicker: 'Avant de répondre',
    title: 'Copie',
    points: [
      'Tu choisis un joueur et tu vois sa réponse dès qu’il l’envoie.',
      'Tu ne sais pas si elle est juste.'
    ]
  },
  {
    card: 'indice',
    kicker: 'Avant de répondre',
    title: 'Indice gratuit',
    points: [
      'L’orga écrit l’indice. La carte annule le −1.',
      'Si l’indice est déjà demandé, la carte reste en main.'
    ]
  },
  {
    card: 'silence',
    kicker: 'Avant de répondre',
    title: 'Silence',
    points: [
      'Le joueur visé ne peut plus répondre. Sa réponse déjà envoyée est effacée.',
      'Il ne sait pas qui l’a visé.'
    ]
  },
  {
    card: 'vol',
    kicker: 'Avant les points',
    title: 'Vol',
    points: [
      'Quand les réponses sont closes, avant « Distribuer les points ».',
      'Tu vois les réponses des autres, pas la bonne. Tu choisis qui voler.',
      'Tu prends ses points de la question. Lui tombe à 0.'
    ]
  },
  {
    card: 'melange',
    kicker: 'Avant les points',
    title: 'Mélange',
    points: [
      'Même moment que Vol : réponses closes, avant les points.',
      'Toutes les réponses sont redistribuées au hasard.',
    ]
  },
  {
    card: 'pot',
    kicker: 'Avant les points',
    title: 'Pot commun',
    points: [
      'Même moment que Mélange : réponses closes, avant les points.',
      'Le chef note d’abord. Tous les points de la question vont dans une cagnotte.',
      'Chaque joueur qui a répondu reçoit une part égale. Le reste va à celui qui a joué la carte.'
    ]
  },
  {
    card: 'renversement',
    kicker: 'Avant les points',
    title: 'Renversement',
    points: [
      'Même moment que Mélange : réponses closes, avant les points.',
      'Le chef note normalement, puis le classement se retourne.',
      'Le plus gros score va à celui qui en avait le moins.',
      'En cas d\'égalité, celui qui a joué la carte passe devant, puis celui qui a le moins de points avant la question.'
    ]
  },
  {
    card: 'toutourien',
    kicker: 'Avant de répondre',
    title: 'Tout ou rien',
    points: [
      'Tu la joues avant d\'envoyer ta réponse.',
      'Si le chef te donne au moins 1 point, tu prends le plus haut score de la question.',
      'S\'il te met 0, tu restes à 0.'
    ]
  },
  {
    card: 'gambling',
    kicker: 'Avant de répondre',
    title: 'Gambling',
    points: [
      'Tu la joues avant d\'envoyer ta réponse.',
      'Le hasard tombe quand le chef distribue les points, entre 0 et le plus haut qu\'il a donné.',
      'Même notée 3, la carte peut finir à 0. Le résultat apparaît avec les scores de tout le monde.'
    ]
  },
  {
    card: 'rumeur',
    kicker: 'Avant de répondre',
    title: 'Rumeur',
    points: [
      'Tu la joues avant d\'envoyer ta réponse.',
      'Dès que deux joueurs ont écrit la même réponse, tu la vois.',
      'Sans les noms. Tu peux t\'en servir pour la tienne.'
    ]
  },
  {
    card: 'bouclier',
    kicker: 'Question ouverte',
    title: 'Bouclier',
    points: [
      'Vol ne peut pas prendre tes points.',
      'Silence ne peut pas t\'empêcher de répondre.',
      'Si tu es déjà réduit au silence, joue-la : tu peux répondre à nouveau.'
    ]
  }
];

const QuizRules = () => {
  const stageRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const slide = SLIDES[index];

  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleFullscreen = () => {
    const node = stageRef.current;
    if (!node) return;
    if (document.fullscreenElement === node) {
      document.exitFullscreen();
      return;
    }
    node.requestFullscreen().catch(() => {});
  };

  return (
    <div className="rules-stage" ref={stageRef} role="region" aria-label="Règles du quiz classique">
      <div className="rules-top">
        <div className="rules-kicker">{slide.kicker}</div>
        <div className="rules-tools">
          <button type="button" className="btn" onClick={toggleFullscreen}>
            <Icon name={full ? 'shrink' : 'expand'} />
            {full ? 'Réduire' : 'Plein écran'}
          </button>
          <div className="rules-count">{index + 1} / {SLIDES.length}</div>
        </div>
      </div>
      <div className="rules-stage-body">
        {slide.card && <JokerCard cardId={slide.card} size="full" />}
        <div className="rules-copy">
          <h2>{slide.title}</h2>
          <ul>
            {slide.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </div>
      </div>
      <div className="rules-dots">
        {SLIDES.map((entry, dot) => (
          <button
            key={entry.title}
            type="button"
            className={dot === index ? 'is-on' : ''}
            aria-label={`Slide ${dot + 1} : ${entry.title}`}
            onClick={() => setIndex(dot)}
          />
        ))}
      </div>
      <div className="rules-nav">
        <button type="button" className="btn" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
          <Icon name="back" />Précédent
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setIndex((value) => Math.min(SLIDES.length - 1, value + 1))}
          disabled={index === SLIDES.length - 1}
        >
          <Icon name="go" />Suivant
        </button>
      </div>
    </div>
  );
};

export default QuizRules;
