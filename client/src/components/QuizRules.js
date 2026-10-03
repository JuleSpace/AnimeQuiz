import React, { useState } from 'react';
import { JokerCard } from './JokerCards';
import Icon from './ArcadeIcon';

const SLIDES = [
  {
    kicker: 'Quiz classique',
    title: 'La partie',
    points: [
      'Le chef ne joue pas. Il faut au moins un joueur en plus.',
      'Il choisit le nombre de questions. « Mélanger » change l’ordre.',
      'Le plus haut score gagne. Un F5 garde la place deux minutes.'
    ]
  },
  {
    kicker: 'Une question',
    title: 'Le tour',
    points: [
      'Booster aux questions 1, 16, 31, puis la question.',
      'Temps limité, ou le chef ferme avec « Clore les réponses ».',
      'Attente, puis le chef donne les points et valide. La salle voit alors la réponse.',
    ]
  },
  {
    kicker: 'Les questions',
    title: 'Six formes',
    points: [
      'Choix multiple, vrai/faux, texte libre, blind test masqué.',
      'Classement, ou placement sur une frise et un schéma.',
      'L’image et la vidéo de la réponse n’apparaissent qu’avec les points.',
      'Rien n’est noté tout seul : le chef décide.'
    ]
  },
  {
    kicker: 'Les points',
    title: 'Notes et indices',
    points: [
      'De 0 à 99. « Valider » propose les points de la question.',
      'Un indice coûte 1 point.',
      'Le chef écrit l’indice, et peut envoyer plusieurs messages.'
    ]
  },
  {
    card: 'double',
    kicker: 'Avant de répondre',
    title: 'Double mise',
    points: [
      'Les points du chef sur cette question sont multipliés par deux.',
      'S’il met 0, ça reste 0.'
    ]
  },
  {
    card: 'filet',
    kicker: 'Avant de répondre',
    title: 'Filet',
    points: [
      'Si le chef met 0, le joueur prend la moitié des points de la question.',
      'S’il a déjà des points, le filet ne change rien.'
    ]
  },
  {
    card: 'seconde',
    kicker: 'Question ouverte',
    title: 'Seconde main',
    points: [
      'Après une réponse, ou avant, tant que la question est ouverte.',
      'Une seule modification.'
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
      'Le chef écrit l’indice. La carte annule le −1.',
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
  }
];

const QuizRules = () => {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  return (
    <div className="rules-stage" role="region" aria-label="Règles du quiz classique">
      <div className="rules-top">
        <div className="rules-kicker">{slide.kicker}</div>
        <div className="rules-count">{index + 1} / {SLIDES.length}</div>
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
          className="btn btn-success"
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
