import React, { useEffect, useState } from 'react';
import {
  JOKERS,
  JokerCard,
  BoosterOpening,
  TABLE_DROP,
  TableDrop,
  playCardCling,
  playDropSound,
  unlockCling
} from './JokerCards';

export const RELIC_HASH = '#reliques';

const IDS = Object.keys(JOKERS);

const VaultCard = ({ cardId, onPack, onTable }) => {
  const card = JOKERS[cardId];
  const [generation, setGeneration] = useState(0);
  const [queued, setQueued] = useState(null);
  const [used, setUsed] = useState(false);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (!queued) return undefined;
    const kind = queued;
    setQueued(null);
    if (kind === 'reveal') setReveal(true);
    else if (kind === 'drop') setUsed(true);
    else if (kind === 'stamp') setUsed(true);
    return undefined;
  }, [queued, generation]);

  const launch = (kind) => {
    unlockCling();
    if (kind === 'cling') {
      playCardCling();
      return;
    }
    if (kind === 'voice') {
      playDropSound(cardId);
      return;
    }
    if (kind === 'obtain') {
      playCardCling();
      playDropSound(cardId);
    } else if (kind === 'drop') {
      playDropSound(cardId);
    }
    setUsed(kind === 'stamp');
    setReveal(false);
    setGeneration((value) => value + 1);
    setQueued(kind === 'obtain' ? 'reveal' : kind === 'stamp' ? null : kind);
  };

  return (
    <article className="vault-card">
      <div className="vault-faces">
        <figure className="vault-face">
          <figcaption>Grande</figcaption>
          <JokerCard
            key={`${cardId}-${generation}-full`}
            cardId={cardId}
            size="full"
            used={used}
            reveal={reveal}
            quiet
          />
        </figure>
        <figure className="vault-face">
          <figcaption>En main</figcaption>
          <JokerCard
            key={`${cardId}-${generation}-hand`}
            cardId={cardId}
            size="hand"
            used={used}
            reveal={reveal}
            quiet
          />
        </figure>
      </div>
      <div className="vault-actions">
        <h2>{card.name}</h2>
        <p>{card.rule}</p>
        <div className="vault-buttons">
          <button type="button" className="joker-chip" onClick={() => launch('obtain')}>Obtenir</button>
          <button type="button" className="joker-chip" onClick={() => launch('drop')}>Jouer</button>
          {TABLE_DROP.has(cardId) && (
            <button type="button" className="joker-chip" onClick={() => onTable(cardId)}>Table</button>
          )}
          <button type="button" className="joker-chip joker-chip-alt" onClick={() => launch('cling')}>Cling</button>
          <button type="button" className="joker-chip joker-chip-alt" onClick={() => launch('voice')}>Son</button>
          <button type="button" className="joker-chip joker-chip-alt" onClick={() => launch('stamp')}>Jouée</button>
          <button type="button" className="joker-chip joker-chip-alt" onClick={onPack}>Booster</button>
        </div>
      </div>
    </article>
  );
};

const CardVault = ({ onClose }) => {
  const [packId, setPackId] = useState(IDS[0]);
  const [packKey, setPackKey] = useState(0);
  const [packOpen, setPackOpen] = useState(false);
  const [tableDrop, setTableDrop] = useState(null);

  useEffect(() => {
    if (!tableDrop) return undefined;
    const timer = setTimeout(() => setTableDrop(null), 4200);
    return () => clearTimeout(timer);
  }, [tableDrop]);

  const showTable = (cardId) => {
    unlockCling();
    playDropSound(cardId);
    setTableDrop({ cardId, key: Date.now() });
  };

  const openPack = (cardId) => {
    unlockCling();
    setPackId(cardId);
    setPackKey((value) => value + 1);
    setPackOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById('vault-pack')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="vault">
      <header className="vault-top">
        <div>
          <p className="vault-kicker">Page secrète</p>
          <h1>Atelier des cartes</h1>
        </div>
        <button type="button" className="btn btn-danger" onClick={onClose}>Retour</button>
      </header>
      <p className="vault-lead">
        Le repos tourne tout seul. Obtenir rejoue le flash et les deux sons. Jouer fait tomber la carte. Table, pour Mélange, Pot commun et Renversement, la plaque au centre. Booster relance l’ouverture complète.
      </p>
      <section id="vault-pack" className="vault-pack">
        <div className="vault-pack-picks">
          {IDS.map((cardId) => (
            <button
              key={cardId}
              type="button"
              className={`joker-chip joker-chip-alt ${packId === cardId ? 'is-on' : ''}`}
              onClick={() => openPack(cardId)}
            >
              {JOKERS[cardId].name}
            </button>
          ))}
        </div>
        {packOpen && <BoosterOpening key={`${packId}-${packKey}`} cardId={packId} />}
      </section>
      <div className="vault-grid">
        {IDS.map((cardId) => (
          <VaultCard key={cardId} cardId={cardId} onPack={() => openPack(cardId)} onTable={showTable} />
        ))}
      </div>
      {tableDrop && <TableDrop key={tableDrop.key} cardId={tableDrop.cardId} quiet />}
    </div>
  );
};

export default CardVault;
