import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ItemEditor, PlaceBoard } from './InteractQuestion';
import LyricsEditor, { HoleHint } from './LyricsEditor';
import LyricsPlayer from './LyricsPlayer';
import GapsBoard from './GapsBoard';
import Icon from './ArcadeIcon';
import { WHOS_TEMPLATE_URL } from '../utils/media';
import ConfirmPopup from './ConfirmPopup';

const TYPE_OPTIONS = [
  { id: 'qcm', label: 'Choix multiple' },
  { id: 'imageqcm', label: 'Choix d\'images' },
  { id: 'boolean', label: 'Vrai / Faux' },
  { id: 'text', label: 'Réponse libre' },
  { id: 'gaps', label: 'Texte à trous' },
  { id: 'music', label: 'Blind test' },
  { id: 'lyrics', label: 'Paroles' },
  { id: 'whos', label: "Who's that" },
  { id: 'order', label: 'Classer' },
  { id: 'layout', label: 'Frise / schéma' }
];

const emptyDraft = (category = '') => ({
  type: 'qcm',
  prompt: '',
  category,
  imageUrl: '',
  imageSize: 100,
  videoUrl: '',
  answerImageUrl: '',
  answerVideoUrl: '',
  musicUrl: '',
  options: ['', '', '', ''],
  correctIndexes: [0],
  multiple: false,
  choice: false,
  correctBoolean: true,
  acceptedText: '',
  points: 1,
  timeLimit: 20,
  stopOnFirstAnswer: false,
  items: [],
  layoutMode: 'timeline',
  layoutImageUrl: '',
  timelineStart: '',
  timelineEnd: '',
  clipMuteStart: 0,
  clipMuteEnd: 0,
  clipEndAt: 0,
  clipLine: '',
  clipMasks: []
});

const questionToApi = (draft) => ({
  type: draft.type,
  prompt: draft.prompt,
  category: draft.category || '',
  imageUrl: draft.imageUrl,
  imageSize: draft.imageSize,
  videoUrl: draft.type === 'music' || draft.type === 'lyrics' || draft.type === 'whos' || draft.type === 'gaps'
    ? ''
    : draft.videoUrl,
  answerImageUrl: draft.answerImageUrl,
  answerVideoUrl: draft.answerVideoUrl,
  musicUrl: draft.type === 'whos'
    ? WHOS_TEMPLATE_URL
    : (draft.type === 'music' || draft.type === 'lyrics' ? draft.musicUrl : ''),
  options: draft.options,
  correctIndexes: draft.multiple ? draft.correctIndexes : draft.correctIndexes.slice(0, 1),
  multiple: Boolean(draft.multiple),
  choice: (draft.type === 'music' || draft.type === 'lyrics' || draft.type === 'whos') && Boolean(draft.choice),
  correctBoolean: draft.correctBoolean,
  acceptedAnswers: draft.type === 'lyrics' || draft.type === 'gaps' || (draft.type === 'whos' && draft.choice)
    ? []
    : draft.acceptedText.split('\n').map((line) => line.trim()).filter(Boolean),
  blanks: (draft.type === 'lyrics' && !draft.choice) || draft.type === 'gaps'
    ? draft.acceptedText.split('\n').map((line) => line.trim()).filter(Boolean)
    : [],
  points: Number(draft.points) || 1,
  timeLimit: draft.timeLimit === '' ? 0 : Number(draft.timeLimit) || 0,
  stopOnFirstAnswer: Boolean(draft.stopOnFirstAnswer),
  items: draft.items || [],
  layoutMode: draft.layoutMode === 'schema' ? 'schema' : 'timeline',
  layoutImageUrl: draft.layoutImageUrl || '',
  timelineStart: draft.timelineStart || '',
  timelineEnd: draft.timelineEnd || '',
  clip: draft.type === 'lyrics' ? {
    muteStart: Number(draft.clipMuteStart) || 0,
    muteEnd: Number(draft.clipMuteEnd) || 0,
    endAt: Number(draft.clipEndAt) || 0,
    line: draft.clipLine || '',
    masks: draft.clipMasks || []
  } : draft.type === 'gaps' ? {
    muteStart: 0,
    muteEnd: 0,
    endAt: 0,
    line: draft.clipLine || '',
    masks: []
  } : draft.type === 'whos' ? {
    muteStart: 0,
    muteEnd: 0,
    endAt: 6,
    line: '',
    masks: []
  } : undefined
});

const questionFromApi = (question) => ({
  type: question.type,
  prompt: question.prompt || '',
  category: question.category || '',
  imageUrl: question.imageUrl || '',
  imageSize: question.imageSize || 100,
  videoUrl: question.videoUrl || '',
  answerImageUrl: question.answerImageUrl || '',
  answerVideoUrl: question.answerVideoUrl || '',
  musicUrl: question.musicUrl || '',
  options: question.options?.length ? [...question.options] : ['', ''],
  correctIndexes: question.correctIndexes?.length ? [...question.correctIndexes] : [0],
  multiple: (question.correctIndexes || []).length > 1,
  choice: Boolean(question.choice),
  correctBoolean: question.correctBoolean !== false,
  acceptedText: question.type === 'lyrics' || question.type === 'gaps'
    ? (question.blanks || []).join('\n')
    : (question.acceptedAnswers || []).join('\n'),
  points: question.points || 1,
  timeLimit: question.timeLimit ?? 0,
  stopOnFirstAnswer: Boolean(question.stopOnFirstAnswer),
  items: (question.items || []).map((item) => ({
    id: item.id,
    text: item.text || '',
    imageUrl: item.imageUrl || '',
    x: Number.isFinite(Number(item.x)) ? Number(item.x) : 50,
    y: Number.isFinite(Number(item.y)) ? Number(item.y) : 50
  })),
  layoutMode: question.layoutMode === 'schema' ? 'schema' : 'timeline',
  layoutImageUrl: question.layoutImageUrl || '',
  timelineStart: question.timelineStart || '',
  timelineEnd: question.timelineEnd || '',
  clipMuteStart: question.clip?.muteStart || 0,
  clipMuteEnd: question.clip?.muteEnd || 0,
  clipEndAt: question.clip?.endAt || 0,
  clipLine: question.clip?.line || '',
  clipMasks: (question.clip?.masks || []).map((mask) => ({
    x: Number(mask.x) || 0,
    y: Number(mask.y) || 0,
    w: Number(mask.w) || 0,
    h: Number(mask.h) || 0
  }))
});

const TYPE_COLOR = { qcm: '#1f6dff', imageqcm: '#7b5cff', boolean: '#18a957', text: '#ff8a1f', gaps: '#e0a800', music: '#e5306b', lyrics: '#c2185b', whos: '#5a3fd1', order: '#0aa5b8', layout: '#6d7a99' };
const TYPE_ICON = { qcm: '☰', imageqcm: '▦', boolean: '✓✗', text: 'Aa', gaps: '_ _', music: '♪', lyrics: '♫', whos: '?', order: '⇅', layout: '⟷' };
/** Aperçu court de la bonne réponse, pour la liste des questions. */
const answerPreview = (q) => {
  if (q.type === 'boolean') return q.correctBoolean === false ? 'Faux' : 'Vrai';
  if ((q.type === 'qcm' || q.choice) && q.options?.length) return (q.correctIndexes || []).map((i) => q.options[i]).filter(Boolean).join(' · ');
  if (q.type === 'imageqcm') return `${(q.correctIndexes || []).length} bonne(s) image(s) sur ${q.options?.length || 0}`;
  if (q.type === 'order' || q.type === 'layout') return (q.items || []).map((it) => it.label || it.text || it).filter((x) => typeof x === 'string').slice(0, 4).join(' → ');
  if (q.blanks?.length) return q.blanks.join(' · ');
  if (q.acceptedAnswers?.length) return q.acceptedAnswers.join(' · ');
  return '';
};
const typeLabel = (type) => TYPE_OPTIONS.find((option) => option.id === type)?.label || type;

const withoutBlanks = (quiz) => ({
  ...quiz,
  questions: (quiz.questions || []).filter((question) => question.type !== 'blank')
});

let questionKeySeq = 1;
const stampQuestions = (quiz) => {
  const cleaned = withoutBlanks(quiz);
  return {
    ...cleaned,
    questions: cleaned.questions.map((question) => (
      question.clientKey ? question : { ...question, clientKey: `q${questionKeySeq += 1}` }
    ))
  };
};

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

const CATEGORY_COLORS = ['#1f6dff', '#ff2347', '#3ddc84', '#ffb020', '#a855f7', '#14b8c4', '#ff6ad5', '#8a6a44'];
const newCategoryId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const SHUFFLE_MODES = [
  { id: 'none', label: 'Dans l’ordre', hint: 'Les questions passent dans l’ordre de la liste.' },
  { id: 'all', label: 'Tout mélanger', hint: 'Toutes les questions sont tirées au hasard.' },
  { id: 'categories', label: 'Par catégorie', hint: 'Une catégorie entière, puis une autre : l’ordre des catégories est tiré au hasard.' }
];
const quizShuffleMode = (quiz) => quiz.shuffleMode || (quiz.shuffle ? 'all' : 'none');

/** Gestion des catégories du quiz : nom, couleur, nombre de questions. */
const CategoryManager = ({ quiz, setQuiz }) => {
  const categories = quiz.categories || [];
  const count = (id) => (quiz.questions || []).filter((question) => question.category === id).length;
  const update = (id, patch) => setQuiz({ ...quiz, categories: categories.map((cat) => (cat.id === id ? { ...cat, ...patch } : cat)) });
  const remove = (id) => setQuiz({
    ...quiz,
    categories: categories.filter((cat) => cat.id !== id),
    questions: (quiz.questions || []).map((question) => (question.category === id ? { ...question, category: '' } : question))
  });
  const add = () => setQuiz({
    ...quiz,
    categories: [...categories, { id: newCategoryId(), name: `Catégorie ${categories.length + 1}`, color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length] }]
  });
  // Range la liste des questions catégorie par catégorie (dans l'ordre des catégories)
  const group = () => {
    const order = new Map(categories.map((cat, i) => [cat.id, i]));
    const rank = (question) => (order.has(question.category) ? order.get(question.category) : categories.length);
    const questions = (quiz.questions || []).map((question, i) => ({ question, i }))
      .sort((a, b) => rank(a.question) - rank(b.question) || a.i - b.i)
      .map(({ question }) => question);
    setQuiz({ ...quiz, questions });
  };
  return (
    <div className="adm-cats">
      <div className="adm-cats-head">
        <span>Catégories</span>
        <small>Range tes questions par thème, puis choisis « Par catégorie » pour jouer un thème entier avant de passer au suivant.</small>
      </div>
      {categories.map((cat) => (
        <div key={cat.id} className="adm-cat" style={{ '--c': cat.color }}>
          <input type="color" value={cat.color} aria-label={`Couleur de ${cat.name}`} onChange={(event) => update(cat.id, { color: event.target.value })} />
          <input className="input" value={cat.name} maxLength={40} aria-label="Nom de la catégorie" onChange={(event) => update(cat.id, { name: event.target.value })} />
          <small>{count(cat.id)} question{count(cat.id) > 1 ? 's' : ''}</small>
          <button type="button" className="btn btn-danger adm-mini adm-icon-only" aria-label={`Supprimer ${cat.name}`} onClick={() => remove(cat.id)}><Icon name="trash" bare /></button>
        </div>
      ))}
      <div className="adm-cats-actions">
        <button type="button" className="btn btn-quiet adm-mini" onClick={add}><Icon name="plus" />Ajouter une catégorie</button>
        {categories.length > 0 && <button type="button" className="btn btn-quiet adm-mini" onClick={group}>Regrouper la liste par catégorie</button>}
      </div>
    </div>
  );
};

const QuestionForm = ({ draft, setDraft, onSubmit, onCancel, submitLabel, busy, categories = [] }) => {
  const toggleCorrect = (index) => {
    setDraft((current) => {
      if (!current.multiple) return { ...current, correctIndexes: [index] };
      const has = current.correctIndexes.includes(index);
      const correctIndexes = has
        ? current.correctIndexes.filter((value) => value !== index)
        : [...current.correctIndexes, index];
      return { ...current, correctIndexes };
    });
  };

  return (
    <div className="adm-block adm-form">
      <h4 className="adm-block-title"><Icon name="pencil" bare />{submitLabel}</h4>
      {categories.length > 0 && (
        <div className="adm-cat-pick" role="radiogroup" aria-label="Catégorie">
          <span>Catégorie</span>
          {[{ id: '', name: 'Aucune', color: '#6b84c9' }, ...categories].map((cat) => (
            <button
              key={cat.id || 'none'}
              type="button"
              role="radio"
              aria-checked={(draft.category || '') === cat.id}
              className={`adm-cat-chip${(draft.category || '') === cat.id ? ' is-on' : ''}`}
              style={{ '--c': cat.color }}
              onClick={() => setDraft({ ...draft, category: cat.id })}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
      <div className="adm-types" role="radiogroup" aria-label="Type de question">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={draft.type === option.id}
            className={`adm-type${draft.type === option.id ? ' is-on' : ''}`}
            onClick={() => setDraft((current) => {
              if (current.type === option.id) return current;
              const next = {
                ...current,
                type: option.id,
                timeLimit: (option.id === 'music' || option.id === 'lyrics' || option.id === 'whos') && Number(current.timeLimit) === 20 ? 0 : current.timeLimit
              };
              if (option.id === 'imageqcm') {
                next.options = ['', ''];
                next.correctIndexes = [0];
                next.multiple = false;
              }
              if (option.id === 'whos') {
                next.choice = true;
                next.musicUrl = WHOS_TEMPLATE_URL;
                if ((current.options || []).filter((optionText) => String(optionText).trim()).length < 2) {
                  next.options = ['', '', '', ''];
                }
              }
              return next;
            })}
          >
            {option.label}
          </button>
        ))}
      </div>

      <textarea
        className="input"
        rows={3}
        placeholder={
          draft.type === 'music'
            ? 'Consigne (optionnel), ex. Quel est ce générique ?'
            : draft.type === 'lyrics'
              ? 'Consigne (optionnel), ex. Complète les paroles'
            : draft.type === 'gaps'
              ? 'Consigne (optionnel), ex. Complète la phrase'
            : draft.type === 'whos'
              ? 'Consigne (optionnel), ex. Qui est-ce ?'
            : draft.type === 'order'
              ? 'Consigne, ex. Classe ces images de ta préférée à la moins aimée'
              : draft.type === 'layout'
                ? 'Consigne, ex. Place ces événements sur la frise'
                : draft.type === 'imageqcm'
                  ? 'Consigne, ex. Laquelle de ces images est la bonne ?'
                : 'Énoncé de la question'
        }
        value={draft.prompt}
        onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
      />

      {draft.type === 'music' && (
        <>
          <input
            className="input"
            placeholder="Lien MP3, YouTube ou Spotify"
            value={draft.musicUrl}
            onChange={(event) => setDraft({ ...draft, musicUrl: event.target.value })}
          />
          <label className="adm-check">
            <input
              type="checkbox"
              checked={Boolean(draft.choice)}
              onChange={(event) => setDraft((current) => ({
                ...current,
                choice: event.target.checked,
                options: event.target.checked && (current.options || []).filter((option) => String(option).trim()).length < 2
                  ? ['', '', '', '']
                  : current.options
              }))}
            />
            Réponse en choix multiple
          </label>
        </>
      )}

      {draft.type === 'lyrics' && (
        <LyricsEditor draft={draft} setDraft={setDraft} />
      )}

      {draft.type === 'gaps' && (
        <>
          <p className="blind-hint">
            Un _ par caractère manquant. L&apos;écran reprend le look des paroles, sans vidéo.
          </p>
          <input
            className="input"
            placeholder="Image de fond (optionnel), elle sera floutée"
            value={draft.imageUrl}
            onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
          />
          <textarea
            className="input"
            rows={3}
            placeholder={'Texte à compléter : un _ par caractère\nJe suis ____ dans la ville'}
            value={draft.clipLine}
            onChange={(event) => setDraft({ ...draft, clipLine: event.target.value })}
          />
          <HoleHint line={draft.clipLine} answers={draft.acceptedText} />
          {draft.clipLine && (
            <GapsBoard line={draft.clipLine} imageUrl={draft.imageUrl} />
          )}
          <textarea
            className="input"
            rows={2}
            placeholder={'Une réponse par trou, une ligne par trou\nperdu\nville|la ville'}
            value={draft.acceptedText}
            onChange={(event) => setDraft({ ...draft, acceptedText: event.target.value })}
          />
          <p className="blind-hint">Le | sépare plusieurs orthographes acceptées pour le même trou.</p>
        </>
      )}

      {draft.type === 'whos' && (
        <>
          <p className="blind-hint">Template Who's that, coupé à 6 secondes. L'image se place sur l'ombre.</p>
          <input
            className="input"
            placeholder="Lien de l'image du personnage"
            value={draft.imageUrl}
            onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
          />
          <LyricsPlayer
            editing
            previewAt={3}
            url={WHOS_TEMPLATE_URL}
            clip={{ muteStart: 0, muteEnd: 0, endAt: 6, line: '', masks: [] }}
            portrait={draft.imageUrl}
          />
          <label className="adm-check">
            <input
              type="checkbox"
              checked={Boolean(draft.choice)}
              onChange={(event) => setDraft((current) => ({
                ...current,
                choice: event.target.checked,
                options: event.target.checked && (current.options || []).filter((option) => String(option).trim()).length < 2
                  ? ['', '', '', '']
                  : current.options
              }))}
            />
            Réponse en choix multiple
          </label>
          {!draft.choice && (
            <textarea
              className="input"
              rows={2}
              placeholder={'Réponse attendue, une par ligne\nTails'}
              value={draft.acceptedText}
              onChange={(event) => setDraft({ ...draft, acceptedText: event.target.value })}
            />
          )}
        </>
      )}

      { (draft.type === 'qcm' || ((draft.type === 'music' || draft.type === 'lyrics' || draft.type === 'whos') && draft.choice)) && (
        <div>
          <label className="adm-check">
            <input
              type="checkbox"
              checked={draft.multiple}
              onChange={(event) => setDraft((current) => ({
                ...current,
                multiple: event.target.checked,
                correctIndexes: event.target.checked ? current.correctIndexes : current.correctIndexes.slice(0, 1)
              }))}
            />
            Plusieurs bonnes réponses
          </label>
          {draft.options.map((option, index) => (
            <div key={index} className="adm-option">
              <button
                type="button"
                className={`adm-correct${draft.correctIndexes.includes(index) ? ' is-on' : ''}`}
                onClick={() => toggleCorrect(index)}
                aria-label={draft.correctIndexes.includes(index) ? 'Bonne réponse' : 'Marquer comme bonne réponse'}
              >
                {draft.correctIndexes.includes(index) ? <Icon name="check" bare /> : <Icon name="box" bare />}
              </button>
              <input
                className="input"
                placeholder={`Choix ${index + 1}`}
                value={option}
                onChange={(event) => {
                  const options = [...draft.options];
                  options[index] = event.target.value;
                  setDraft({ ...draft, options });
                }}
              />
              {draft.options.length > 2 && (
                <button
                  type="button"
                  className="btn btn-danger adm-mini adm-icon-only"
                  onClick={() => {
                    const options = draft.options.filter((_, optionIndex) => optionIndex !== index);
                    const correctIndexes = draft.correctIndexes
                      .filter((value) => value !== index)
                      .map((value) => (value > index ? value - 1 : value));
                    setDraft({
                      ...draft,
                      options,
                      correctIndexes: correctIndexes.length ? correctIndexes : [0]
                    });
                  }}
                >
                  <Icon name="cross" bare />
                </button>
              )}
            </div>
          ))}
          {draft.options.length < 6 && (
            <button
              type="button"
              className="btn btn-quiet adm-mini"
              onClick={() => setDraft({ ...draft, options: [...draft.options, ''] })}
            >
              <Icon name="plus" />Ajouter un choix
            </button>
          )}
        </div>
      )}

      {draft.type === 'imageqcm' && (
        <div>
          <p className="blind-hint">Une image par lien. Coche la bonne. Deux minimum, sans maximum.</p>
          {draft.options.map((option, index) => {
            const url = String(option || '').trim();
            const preview = /^https?:\/\//i.test(url);
            return (
              <div key={index} className="adm-option">
                <button
                  type="button"
                  className={`adm-correct${draft.correctIndexes.includes(index) ? ' is-on' : ''}`}
                  onClick={() => setDraft({ ...draft, correctIndexes: [index] })}
                  aria-label="Bonne image"
                >
                  {draft.correctIndexes.includes(index) ? <Icon name="check" bare /> : <Icon name="box" bare />}
                </button>
                {preview && <img src={url} alt="" className="answer-thumb" />}
                <input
                  className="input"
                  placeholder={`Lien de l'image ${index + 1}`}
                  value={option}
                  onChange={(event) => {
                    const options = [...draft.options];
                    options[index] = event.target.value;
                    setDraft({ ...draft, options });
                  }}
                />
                {draft.options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-danger adm-mini adm-icon-only"
                    onClick={() => {
                      const options = draft.options.filter((_, optionIndex) => optionIndex !== index);
                      const correctIndexes = draft.correctIndexes
                        .filter((value) => value !== index)
                        .map((value) => (value > index ? value - 1 : value));
                      setDraft({
                        ...draft,
                        options,
                        correctIndexes: correctIndexes.length ? correctIndexes : [0]
                      });
                    }}
                  >
                    <Icon name="cross" bare />
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="btn btn-quiet adm-mini"
            onClick={() => setDraft({ ...draft, options: [...draft.options, ''] })}
          >
            <Icon name="plus" />Ajouter une image
          </button>
        </div>
      )}

      {draft.type === 'boolean' && (
        <div className="adm-seg">
          <button
            type="button"
            className={`adm-type${draft.correctBoolean ? ' is-on' : ''}`}
            onClick={() => setDraft({ ...draft, correctBoolean: true })}
          >
            Vrai
          </button>
          <button
            type="button"
            className={`adm-type${draft.correctBoolean ? '' : ' is-on'}`}
            onClick={() => setDraft({ ...draft, correctBoolean: false })}
          >
            Faux
          </button>
        </div>
      )}

      {draft.type === 'text' && (
        <>
          <textarea
            className="input"
            rows={3}
            placeholder={'Réponses acceptées, facultatif, une par ligne\nNaruto\nNaruto Uzumaki'}
            value={draft.acceptedText}
            onChange={(event) => setDraft({ ...draft, acceptedText: event.target.value })}
          />
          <p className="blind-hint">Tu peux laisser vide. Le chef corrigera à la main.</p>
        </>
      )}

      {draft.type === 'order' && (
        <div>
          <p className="blind-hint">L'ordre des lignes est la bonne réponse. Les joueurs devront le retrouver.</p>
          <ItemEditor items={draft.items || []} onChange={(items) => setDraft({ ...draft, items })} />
        </div>
      )}

      {draft.type === 'layout' && (
        <div>
          <div className="adm-seg">
            <button
              type="button"
              className={`adm-type${draft.layoutMode !== 'schema' ? ' is-on' : ''}`}
              onClick={() => setDraft({ ...draft, layoutMode: 'timeline' })}
            >
              Frise chronologique
            </button>
            <button
              type="button"
              className={`adm-type${draft.layoutMode === 'schema' ? ' is-on' : ''}`}
              onClick={() => setDraft({ ...draft, layoutMode: 'schema' })}
            >
              Schéma
            </button>
          </div>
          {draft.layoutMode === 'schema' ? (
            <input
              className="input"
              placeholder="Image du schéma"
              value={draft.layoutImageUrl || ''}
              onChange={(event) => setDraft({ ...draft, layoutImageUrl: event.target.value })}
            />
          ) : (
            <div className="adm-fields">
              <input
                className="input"
                placeholder="Date de début, à gauche"
                value={draft.timelineStart || ''}
                onChange={(event) => setDraft({ ...draft, timelineStart: event.target.value })}
              />
              <input
                className="input"
                placeholder="Date de fin, à droite"
                value={draft.timelineEnd || ''}
                onChange={(event) => setDraft({ ...draft, timelineEnd: event.target.value })}
              />
            </div>
          )}
          <ItemEditor items={draft.items || []} onChange={(items) => setDraft({ ...draft, items })} />
          <p className="blind-hint">
            {draft.layoutMode === 'schema'
              ? 'Place les éléments : c\'est l\'emplacement attendu. Un seul suffit.'
              : 'Place les éléments : c\'est l\'emplacement attendu. Un seul suffit. Les dates aident les joueurs, elles restent facultatives.'}
          </p>
          <PlaceBoard
            mode={draft.layoutMode === 'schema' ? 'schema' : 'timeline'}
            imageUrl={draft.layoutImageUrl || ''}
            items={draft.items || []}
            timelineStart={draft.timelineStart || ''}
            timelineEnd={draft.timelineEnd || ''}
            places={(draft.items || []).map((item) => ({ id: item.id, x: item.x ?? 50, y: item.y ?? 50 }))}
            onChange={(places) => {
              const positions = new Map(places.map((place) => [place.id, place]));
              setDraft({
                ...draft,
                items: (draft.items || []).map((item) => (
                  positions.has(item.id)
                    ? { ...item, x: positions.get(item.id).x, y: positions.get(item.id).y }
                    : item
                ))
              });
            }}
          />
        </div>
      )}

      {draft.type === 'music' && (
        <>
          {!draft.choice && (
            <>
              <textarea
                className="input"
                rows={2}
                placeholder={'Réponse attendue, facultatif, une par ligne\nTank!\nCowboy Bebop'}
                value={draft.acceptedText}
                onChange={(event) => setDraft({ ...draft, acceptedText: event.target.value })}
              />
              <p className="blind-hint">Tu peux laisser vide. Le chef corrigera à la main.</p>
            </>
          )}
          <p className="blind-hint">
            L'extrait est masqué. Le chef attribue les points à la main, comme pour les autres questions.
            Mets 0 seconde pour laisser le chef décider du moment.
          </p>
        </>
      )}

      {draft.type !== 'music' && draft.type !== 'lyrics' && draft.type !== 'whos'
        && draft.type !== 'order' && draft.type !== 'layout' && draft.type !== 'gaps' && (
        <>
          <input
            className="input"
            placeholder="Lien d'image (optionnel)"
            value={draft.imageUrl}
            onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
          />
          <input
            className="input"
            placeholder="Lien vidéo YouTube ou fichier (optionnel)"
            value={draft.videoUrl}
            onChange={(event) => setDraft({ ...draft, videoUrl: event.target.value })}
          />
        </>
      )}

      {draft.type === 'music' && (
        <input
          className="input"
          placeholder="Image affichée pendant l'écoute (optionnel)"
          value={draft.imageUrl}
          onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
        />
      )}

      <input
        className="input"
        placeholder="Image de la réponse, visible seulement à la correction"
        value={draft.answerImageUrl}
        onChange={(event) => setDraft({ ...draft, answerImageUrl: event.target.value })}
      />
      <input
        className="input"
        placeholder="Vidéo de la réponse, visible seulement à la correction"
        value={draft.answerVideoUrl}
        onChange={(event) => setDraft({ ...draft, answerVideoUrl: event.target.value })}
      />

      <label className="image-size">
        Taille des images
        <input
          type="range"
          min="50"
          max="200"
          step="10"
          value={draft.imageSize || 100}
          aria-label="Taille des images"
          onChange={(event) => setDraft({ ...draft, imageSize: Number(event.target.value) })}
        />
        <span>{draft.imageSize || 100}%</span>
      </label>
      {draft.type === 'whos' && (
        <p className="blind-hint">Le portrait sur le template garde sa place.</p>
      )}
      {draft.type !== 'whos' && draft.type !== 'gaps'
        && /^https?:\/\//i.test(String(draft.imageUrl || '').trim()) && (
        <div className="quiz-media" style={{ '--image-scale': (draft.imageSize || 100) / 100 }}>
          <img src={draft.imageUrl} alt="" />
        </div>
      )}
      {draft.type === 'imageqcm' && (draft.options || []).some((url) => /^https?:\/\//i.test(String(url || '').trim())) && (
        <div className="image-choice-grid" style={{ '--image-scale': (draft.imageSize || 100) / 100 }}>
          {(draft.options || []).filter((url) => /^https?:\/\//i.test(String(url || '').trim())).map((url, index) => (
            <div key={`${url}-${index}`} className="image-choice" style={{ cursor: 'default' }}>
              <img src={url} alt="" />
              <span>Image {index + 1}</span>
            </div>
          ))}
        </div>
      )}

      <div className="adm-fields">
        <label className="adm-field">
          <span>Points</span>
          <input
            className="input"
            type="number"
            min="1"
            value={draft.points}
            onChange={(event) => setDraft({ ...draft, points: event.target.value })}
          />
        </label>
        <label className="adm-field">
          <span>Secondes (0 = illimité)</span>
          <input
            className="input"
            type="number"
            min="0"
            value={draft.timeLimit}
            onChange={(event) => setDraft({ ...draft, timeLimit: event.target.value })}
          />
        </label>
      </div>

      <label className="adm-check">
        <input
          type="checkbox"
          checked={Boolean(draft.stopOnFirstAnswer)}
          onChange={(event) => setDraft({ ...draft, stopOnFirstAnswer: event.target.checked })}
        />
        Fermer dès la première réponse (joueur ou équipe)
      </label>

      <div className="adm-actions">
        <button type="button" className="btn btn-success" onClick={onSubmit} disabled={busy}><Icon name="check" />{submitLabel}</button>
        {onCancel && (
          <button type="button" className="btn btn-quiet" onClick={onCancel}>Annuler</button>
        )}
      </div>
    </div>
  );
};

const QuizAdmin = ({ admin }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftIndex, setDraftIndex] = useState(null);
  const [newQuiz, setNewQuiz] = useState({ name: '', description: '', isPrivate: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const quizRef = useRef(null);
  const dragIndexRef = useRef(null);
  const dragSnapshotRef = useRef(null);
  quizRef.current = quiz;

  const shiftDraftIndex = (current, from, to) => {
    if (current == null) return current;
    if (current === from) return to;
    if (from < current && to >= current) return current - 1;
    if (from > current && to <= current) return current + 1;
    return current;
  };

  const applyQuestionMove = (from, to, save) => {
    const current = quizRef.current;
    if (!current || from === to || from < 0 || to < 0 || to >= current.questions.length) return;
    const questions = [...current.questions];
    const [item] = questions.splice(from, 1);
    questions.splice(to, 0, item);
    const next = { ...current, questions };
    quizRef.current = next;
    setQuiz(next);
    setDraftIndex((draftAt) => shiftDraftIndex(draftAt, from, to));
    if (save) persist(next);
  };

  const loadQuizzes = async () => {
    const response = await axios.get('/api/quizzes?edit=1');
    setQuizzes(response.data);
  };

  const loadAdmins = async () => {
    if (admin?.role !== 'super') return;
    const response = await axios.get('/api/admins');
    setAdmins(response.data);
  };

  useEffect(() => {
    loadQuizzes().catch(() => setError('Impossible de charger les quiz'));
    loadAdmins().catch(() => setError('Impossible de charger les admins'));
  }, []);

  const canEdit = (item) => (
    admin?.role === 'super'
    || (item?.owner && item.owner.toLowerCase() === String(admin?.username || '').toLowerCase())
  );

  const persist = async (next) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.put(`/api/quizzes/${next._id}`, {
        name: next.name,
        description: next.description,
        shuffle: quizShuffleMode(next) === 'all',
        shuffleMode: quizShuffleMode(next),
        shuffleInside: Boolean(next.shuffleInside),
        categories: next.categories || [],
        isPrivate: Boolean(next.isPrivate),
        questions: (next.questions || []).map(({ clientKey, ...question }) => question)
      });
      setQuiz(stampQuestions(response.data));
      setSuccess('Quiz enregistré');
      await loadQuizzes();
      return true;
    } catch (requestError) {
      setError(errorMessage(requestError, 'Enregistrement impossible'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    if (!newQuiz.name.trim()) {
      setError('Le nom du quiz est requis');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/quizzes', newQuiz);
      setNewQuiz({ name: '', description: '', isPrivate: false });
      setQuiz(stampQuestions(response.data));
      setDraft(emptyDraft());
      setDraftIndex(null);
      await loadQuizzes();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Création impossible'));
    } finally {
      setLoading(false);
    }
  };

  const assignOwner = async (quizId, owner) => {
    setError('');
    try {
      await axios.put(`/api/quizzes/${quizId}/owner`, { owner });
      await loadQuizzes();
      setSuccess(owner ? `Quiz donné à ${owner}` : 'Quiz retiré');
    } catch (requestError) {
      setError(errorMessage(requestError, 'Attribution impossible'));
    }
  };

  const removeQuiz = async (quizId) => {
    setLoading(true);
    try {
      await axios.delete(`/api/quizzes/${quizId}`);
      if (quiz?._id === quizId) setQuiz(null);
      await loadQuizzes();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Suppression impossible'));
    } finally {
      setLoading(false);
    }
  };

  const openQuiz = async (quizId) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/quizzes/${quizId}?edit=1`);
      setQuiz(stampQuestions(response.data));
      setDraft(null);
      setDraftIndex(null);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Ouverture impossible'));
    } finally {
      setLoading(false);
    }
  };

  const commitDraft = async () => {
    if (!quiz || !draft) return;
    const question = questionToApi(draft);
    const questions = [...(quiz.questions || [])];
    if (draftIndex == null) questions.push(question);
    else questions[draftIndex] = question;
    const saved = await persist({ ...quiz, questions });
    if (saved) {
      setDraft(null);
      setDraftIndex(null);
    }
  };

  const [qSearch, setQSearch] = useState('');
  const [qType, setQType] = useState('');
  const formRef = useRef(null);
  const editQuestion = (index) => { setDraft(questionFromApi(quiz.questions[index])); setDraftIndex(index); };
  const addQuestion = () => { setDraft(emptyDraft((quiz.questions || []).slice(-1)[0]?.category || '')); setDraftIndex(null); setQType(''); setQSearch(''); };
  const cancelDraft = () => { setDraft(null); setDraftIndex(null); };
  const duplicateQuestion = async (index) => {
    const questions = [...(quiz.questions || [])];
    const { clientKey, _id, ...copy } = questions[index];
    questions.splice(index + 1, 0, { ...copy, clientKey: `dup-${Date.now()}` });
    await persist({ ...quiz, questions });
  };
  // Le formulaire s'ouvre sous la question : on le fait défiler à l'écran.
  useEffect(() => {
    if (!draft) return undefined;
    const t = setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    return () => clearTimeout(t);
  }, [draftIndex, Boolean(draft)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!draft) return undefined;
    const k = (e) => {
      if (e.key === 'Escape' && !e.target.closest?.('.confirm-pop')) cancelDraft();
      else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commitDraft(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const moveQuestion = (index, direction) => {
    applyQuestionMove(index, index + direction, true);
  };

  const startQuestionDrag = (event, index) => {
    if (event.target.closest('button')) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    dragIndexRef.current = index;
    dragSnapshotRef.current = quizRef.current?.questions || null;
    setDragIndex(index);
  };

  const hoverQuestion = (event, index) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const from = dragIndexRef.current;
    if (from == null || from === index) return;
    applyQuestionMove(from, index, false);
    dragIndexRef.current = index;
    setDragIndex(index);
  };

  const finishQuestionDrag = () => {
    const started = dragSnapshotRef.current;
    const latest = quizRef.current;
    const moved = started && latest && latest.questions !== started;
    dragIndexRef.current = null;
    dragSnapshotRef.current = null;
    setDragIndex(null);
    if (moved) persist(latest);
  };

  const deleteQuestion = async (index) => {
    const questions = quiz.questions.filter((_, questionIndex) => questionIndex !== index);
    await persist({ ...quiz, questions });
    if (draftIndex === index) {
      setDraft(null);
      setDraftIndex(null);
    }
  };

  if (!quiz) {
    return (
      <div>
        <section className="adm-block is-new">
          <h3 className="adm-block-title"><Icon name="plus" bare />Nouveau quiz</h3>
          <div className="adm-fields">
            <label className="adm-field">
              <span>Nom</span>
              <input
                className="input"
                placeholder="Nom du quiz"
                value={newQuiz.name}
                onChange={(event) => setNewQuiz({ ...newQuiz, name: event.target.value })}
              />
            </label>
            <label className="adm-field">
              <span>Description</span>
              <input
                className="input"
                placeholder="Description"
                value={newQuiz.description}
                onChange={(event) => setNewQuiz({ ...newQuiz, description: event.target.value })}
              />
            </label>
          </div>
          <label className="adm-check">
            <input
              type="checkbox"
              checked={Boolean(newQuiz.isPrivate)}
              onChange={(event) => setNewQuiz({ ...newQuiz, isPrivate: event.target.checked })}
            />
            Privé — masqué dans le menu des quiz
          </label>
          <div className="adm-actions">
            <button type="button" className="btn btn-success" onClick={createQuiz} disabled={loading}>
              <Icon name="check" />Créer le quiz
            </button>
          </div>
          <p className="adm-note">
            {admin?.role === 'super'
              ? 'Un quiz créé t\'est attribué. Tu peux le donner à un admin : lui et toi seuls pourrez le modifier ou le supprimer.'
              : 'Un quiz que tu crées t\'est attribué. Tu modifies et tu supprimes seulement les tiens.'}
          </p>
        </section>

        <h3 className="adm-section-title"><Icon name="quiz" bare />Quiz <small>{quizzes.length}</small></h3>

        {quizzes.length === 0 ? (
          <div className="adm-empty">
            <Icon name="quiz" tone="hero" />
            <p>Aucun quiz pour l'instant.</p>
          </div>
        ) : (
          <div className="adm-grid">
            {quizzes.map((item) => {
              const editable = canEdit(item) && !item.locked;
              const count = item.questions ? item.questions.length : (item.questionCount || 0);
              return (
                <article key={item._id} className={`adm-tile${item.isPrivate ? ' is-private' : ''}`}>
                  <span className="adm-count"><Icon name="quiz" bare />{count}</span>
                  <h4 className="adm-tile-title">{item.name}</h4>
                  {item.isPrivate && <span className="adm-flag"><Icon name="lock" bare />Privé</span>}
                  <p className="adm-tile-desc">{item.description || 'Sans description'}</p>
                  <div className="adm-owner">
                    <Icon name="crown" bare />{item.owner ? item.owner : 'Non attribué'}
                  </div>
                  {admin?.role === 'super' && (
                    <select
                      className="input adm-select"
                      aria-label="Attribuer le quiz"
                      value={item.owner || ''}
                      onChange={(event) => assignOwner(item._id, event.target.value)}
                    >
                      <option value="">Personne</option>
                      {admins.map((account) => (
                        <option key={account.username} value={account.username}>{account.username}</option>
                      ))}
                    </select>
                  )}
                  {editable && (
                    <div className="adm-actions">
                      <button type="button" className="btn adm-mini" onClick={() => openQuiz(item._id)}><Icon name="pencil" />Modifier</button>
                      <button
                        type="button"
                        className="btn btn-danger adm-mini adm-icon-only"
                        aria-label="Supprimer le quiz"
                        onClick={() => setConfirm({
                          title: 'Supprimer ce quiz ?',
                          message: `« ${item.name} » disparaît pour de bon.`,
                          run: () => removeQuiz(item._id)
                        })}
                      >
                        <Icon name="trash" bare />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        {confirm && (
          <ConfirmPopup
            title={confirm.title}
            message={confirm.message}
            confirmLabel={confirm.confirmLabel}
            onCancel={() => setConfirm(null)}
            onConfirm={() => {
              const run = confirm.run;
              setConfirm(null);
              run();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="btn btn-quiet adm-mini" onClick={() => { setQuiz(null); setDraft(null); }}>
        <Icon name="back" />Tous les quiz
      </button>
      <section className="adm-block">
        <h3 className="adm-block-title"><Icon name="quiz" bare />{quiz.name || 'Quiz sans nom'}</h3>
        <div className="adm-fields">
          <label className="adm-field">
            <span>Nom</span>
            <input
              className="input"
              value={quiz.name}
              onChange={(event) => setQuiz({ ...quiz, name: event.target.value })}
            />
          </label>
          <label className="adm-field">
            <span>Description</span>
            <input
              className="input"
              placeholder="Description"
              value={quiz.description || ''}
              onChange={(event) => setQuiz({ ...quiz, description: event.target.value })}
            />
          </label>
        </div>
      <div className="adm-order">
        <span className="adm-order-label">Ordre des questions à chaque partie</span>
        <div className="adm-order-modes" role="radiogroup" aria-label="Ordre des questions">
          {SHUFFLE_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={quizShuffleMode(quiz) === mode.id}
              className={`adm-type${quizShuffleMode(quiz) === mode.id ? ' is-on' : ''}`}
              disabled={mode.id === 'categories' && !(quiz.categories || []).length}
              title={mode.id === 'categories' && !(quiz.categories || []).length ? 'Crée d’abord une catégorie' : mode.hint}
              onClick={() => setQuiz({ ...quiz, shuffleMode: mode.id, shuffle: mode.id === 'all' })}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <small className="adm-note">{SHUFFLE_MODES.find((mode) => mode.id === quizShuffleMode(quiz))?.hint}</small>
        {quizShuffleMode(quiz) === 'categories' && (
          <label className="adm-check">
            <input
              type="checkbox"
              checked={Boolean(quiz.shuffleInside)}
              onChange={(event) => setQuiz({ ...quiz, shuffleInside: event.target.checked })}
            />
            Mélanger aussi les questions à l’intérieur de chaque catégorie
          </label>
        )}
      </div>
      <CategoryManager quiz={quiz} setQuiz={setQuiz} />
      <label className="adm-check">
        <input
          type="checkbox"
          checked={Boolean(quiz.isPrivate)}
          onChange={(event) => setQuiz({ ...quiz, isPrivate: event.target.checked })}
        />
        Privé — masqué dans le menu des quiz
      </label>
        <div className="adm-actions">
          <button
            type="button"
            className="btn btn-success"
            disabled={loading}
            onClick={() => persist(quiz)}
          >
            <Icon name="save" />Enregistrer
          </button>
        </div>
      </section>

      <h3 className="adm-section-title"><Icon name="list" bare />Questions <small>{(quiz.questions || []).length}</small></h3>
      <div className="adm-qtools">
        <input className="input adm-qsearch" type="search" placeholder="Chercher une question ou une réponse…" value={qSearch} onChange={(e) => setQSearch(e.target.value)} aria-label="Chercher une question" />
        <div className="adm-qfilters">
          <button type="button" className={`adm-qf${!qType ? ' is-on' : ''}`} onClick={() => setQType('')}>Tous</button>
          {TYPE_OPTIONS.filter((t) => (quiz.questions || []).some((q) => q.type === t.id)).map((t) => (
            <button key={t.id} type="button" className={`adm-qf${qType === t.id ? ' is-on' : ''}`} style={{ '--c': TYPE_COLOR[t.id] }} onClick={() => setQType(qType === t.id ? '' : t.id)}>
              {t.label} <small>{(quiz.questions || []).filter((q) => q.type === t.id).length}</small>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-success adm-mini" onClick={addQuestion} disabled={draft && draftIndex == null}><Icon name="plus" />Nouvelle question</button>
      </div>
      <p className="adm-note">Glisse une question pour la déplacer, clique dessus pour la modifier. Dans le formulaire : Ctrl + Entrée enregistre, Échap annule.</p>
      {(quiz.questions || []).map((question, index) => {
        const filtered = qType || qSearch.trim();
        if (filtered && draftIndex !== index) {
          if (qType && question.type !== qType) return null;
          const hay = `${question.prompt || ''} ${answerPreview(question)} ${question.musicUrl || ''}`.toLowerCase();
          if (qSearch.trim() && !hay.includes(qSearch.trim().toLowerCase())) return null;
        }
        const cat = (quiz.categories || []).find((c) => c.id === question.category);
        const ans = answerPreview(question);
        const editingThis = draft && draftIndex === index;
        return (
          <React.Fragment key={question.clientKey || index}>
            <div
              className={`adm-qrow question-row${dragIndex === index ? ' is-dragging' : ''}${editingThis ? ' is-editing' : ''}`}
              style={{ '--tc': TYPE_COLOR[question.type] || '#1f6dff' }}
              draggable={!loading && !editingThis}
              onDragStart={(event) => startQuestionDrag(event, index)}
              onDragOver={(event) => hoverQuestion(event, index)}
              onDrop={(event) => event.preventDefault()}
              onDragEnd={finishQuestionDrag}
              onClick={(event) => { if (!event.target.closest('button') && !editingThis) editQuestion(index); }}
            >
              <div className="question-row-body">
                <span className="drag-handle" aria-hidden="true">⋮⋮</span>
                <span className="adm-qnum">{index + 1}</span>
                <span className="adm-qicon" aria-hidden="true">{TYPE_ICON[question.type] || '?'}</span>
                {question.imageUrl && <img className="adm-qthumb" src={question.imageUrl} alt="" loading="lazy" />}
                <div className="adm-qtext">
                  <span className="adm-qtags">
                    <span className="adm-qtype">{typeLabel(question.type)}</span>
                    {cat && <span className="adm-qcat" style={{ '--c': cat.color }}>{cat.name}</span>}
                  </span>
                  <div className="adm-qprompt">{question.prompt || question.musicUrl || 'Sans énoncé'}</div>
                  {ans && <div className="adm-qanswer">✔ {ans}</div>}
                  <div className="adm-qmeta">
                    {question.points || 1} pt · {question.timeLimit ? `${question.timeLimit}s` : 'temps libre'}
                    {question.stopOnFirstAnswer ? ' · 1ʳᵉ réponse' : ''}
                  </div>
                </div>
              </div>
              <div className="adm-qactions">
                <button type="button" className="btn btn-quiet adm-mini adm-icon-only" aria-label="Monter" title="Monter" onClick={() => moveQuestion(index, -1)} disabled={index === 0 || Boolean(draft)}>↑</button>
                <button type="button" className="btn btn-quiet adm-mini adm-icon-only" aria-label="Descendre" title="Descendre" onClick={() => moveQuestion(index, 1)} disabled={index === quiz.questions.length - 1 || Boolean(draft)}>↓</button>
                <button type="button" className="btn btn-quiet adm-mini adm-icon-only" aria-label="Dupliquer" title="Dupliquer juste en dessous" onClick={() => duplicateQuestion(index)} disabled={Boolean(draft) || loading}>⧉</button>
                {editingThis ? (
                  <button type="button" className="btn btn-quiet adm-mini" onClick={cancelDraft}>Fermer</button>
                ) : (
                  <button type="button" className="btn adm-mini" onClick={() => editQuestion(index)}><Icon name="pencil" />Modifier</button>
                )}
                <button
                  type="button"
                  aria-label="Supprimer la question"
                  className="btn btn-danger adm-mini adm-icon-only"
                  onClick={() => setConfirm({
                    title: 'Supprimer cette question ?',
                    message: `La question ${index + 1} sera retirée du quiz.`,
                    run: () => deleteQuestion(index)
                  })}
                >
                  <Icon name="trash" bare />
                </button>
              </div>
            </div>
            {editingThis && (
              <div className="adm-inline-form" ref={formRef}>
                <QuestionForm
                  draft={draft}
                  setDraft={setDraft}
                  submitLabel="Mettre à jour"
                  busy={loading}
                  categories={quiz.categories || []}
                  onCancel={cancelDraft}
                  onSubmit={commitDraft}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}

      {draft && draftIndex == null ? (
        <div className="adm-inline-form is-new" ref={formRef}>
          <QuestionForm
            draft={draft}
            setDraft={setDraft}
            submitLabel="Ajouter la question"
            busy={loading}
            categories={quiz.categories || []}
            onCancel={cancelDraft}
            onSubmit={commitDraft}
          />
        </div>
      ) : (
        <div className="adm-actions">
          <button type="button" className="btn btn-success" onClick={addQuestion}>
            <Icon name="plus" />Ajouter une question
          </button>
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      {confirm && (
        <ConfirmPopup
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const run = confirm.run;
            setConfirm(null);
            run();
          }}
        />
      )}
    </div>
  );
};

export default QuizAdmin;
