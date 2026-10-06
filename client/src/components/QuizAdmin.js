import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ItemEditor, PlaceBoard } from './InteractQuestion';
import LyricsEditor from './LyricsEditor';
import LyricsPlayer from './LyricsPlayer';
import Icon from './ArcadeIcon';
import { WHOS_TEMPLATE_URL } from '../utils/media';
import ConfirmPopup from './ConfirmPopup';

const TYPE_OPTIONS = [
  { id: 'qcm', label: 'Choix multiple' },
  { id: 'imageqcm', label: 'Choix d\'images' },
  { id: 'boolean', label: 'Vrai / Faux' },
  { id: 'text', label: 'Réponse libre' },
  { id: 'music', label: 'Blind test' },
  { id: 'lyrics', label: 'Paroles' },
  { id: 'whos', label: "Who's that" },
  { id: 'order', label: 'Classer' },
  { id: 'layout', label: 'Frise / schéma' }
];

const emptyDraft = () => ({
  type: 'qcm',
  prompt: '',
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
  imageUrl: draft.imageUrl,
  imageSize: draft.imageSize,
  videoUrl: draft.type === 'music' || draft.type === 'lyrics' || draft.type === 'whos' ? '' : draft.videoUrl,
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
  acceptedAnswers: draft.type === 'lyrics' || (draft.type === 'whos' && draft.choice)
    ? []
    : draft.acceptedText.split('\n').map((line) => line.trim()).filter(Boolean),
  blanks: draft.type === 'lyrics' && !draft.choice
    ? draft.acceptedText.split('\n').map((line) => line.trim()).filter(Boolean)
    : [],
  points: Number(draft.points) || 1,
  timeLimit: draft.timeLimit === '' ? 0 : Number(draft.timeLimit) || 0,
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
  acceptedText: question.type === 'lyrics'
    ? (question.blanks || []).join('\n')
    : (question.acceptedAnswers || []).join('\n'),
  points: question.points || 1,
  timeLimit: question.timeLimit ?? 0,
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

const QuestionForm = ({ draft, setDraft, onSubmit, onCancel, submitLabel, busy }) => {
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
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: '16px',
      padding: '18px',
      marginTop: '16px'
    }}>
      <div className="type-picker" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`btn${draft.type === option.id ? ' is-on' : ''}`}
            style={{ margin: 0 }}
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
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '8px 0' }}>
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
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '8px 0' }}>
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
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '8px 0' }}>
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
            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button type="button" className="btn" style={{ margin: 0, minWidth: 52 }} onClick={() => toggleCorrect(index)}>
                {draft.correctIndexes.includes(index) ? <Icon name="check" bare /> : <Icon name="box" bare />}
              </button>
              <input
                className="input"
                style={{ margin: '6px 0' }}
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
                  className="btn btn-danger"
                  style={{ margin: 0 }}
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
              className="btn"
              onClick={() => setDraft({ ...draft, options: [...draft.options, ''] })}
            >
              Ajouter un choix
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
              <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ margin: 0, minWidth: 52 }}
                  onClick={() => setDraft({ ...draft, correctIndexes: [index] })}
                >
                  {draft.correctIndexes.includes(index) ? <Icon name="check" bare /> : <Icon name="box" bare />}
                </button>
                {preview && <img src={url} alt="" className="answer-thumb" />}
                <input
                  className="input"
                  style={{ margin: '6px 0' }}
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
                    className="btn btn-danger"
                    style={{ margin: 0 }}
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
            className="btn"
            onClick={() => setDraft({ ...draft, options: [...draft.options, ''] })}
          >
            Ajouter une image
          </button>
        </div>
      )}

      {draft.type === 'boolean' && (
        <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
          <button
            type="button"
            className="btn btn-success"
            style={{ opacity: draft.correctBoolean ? 1 : 0.45 }}
            onClick={() => setDraft({ ...draft, correctBoolean: true })}
          >
            Vrai
          </button>
          <button
            type="button"
            className="btn btn-danger"
            style={{ opacity: draft.correctBoolean ? 0.45 : 1 }}
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
          <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
            <button
              type="button"
              className="btn"
              style={{ margin: 0, opacity: draft.layoutMode !== 'schema' ? 1 : 0.55 }}
              onClick={() => setDraft({ ...draft, layoutMode: 'timeline' })}
            >
              Frise chronologique
            </button>
            <button
              type="button"
              className="btn"
              style={{ margin: 0, opacity: draft.layoutMode === 'schema' ? 1 : 0.55 }}
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
            <div style={{ display: 'flex', gap: '8px' }}>
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
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
            L'extrait est masqué. Le chef attribue les points à la main, comme pour les autres questions.
            Mets 0 seconde pour laisser le chef décider du moment.
          </p>
        </>
      )}

      {draft.type !== 'music' && draft.type !== 'lyrics' && draft.type !== 'whos' && draft.type !== 'order' && draft.type !== 'layout' && (
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
      {draft.type !== 'whos' && /^https?:\/\//i.test(String(draft.imageUrl || '').trim()) && (
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

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <label style={{ flex: 1 }}>
          Points
          <input
            className="input"
            type="number"
            min="1"
            value={draft.points}
            onChange={(event) => setDraft({ ...draft, points: event.target.value })}
          />
        </label>
        <label style={{ flex: 1 }}>
          Secondes (0 = illimité)
          <input
            className="input"
            type="number"
            min="0"
            value={draft.timeLimit}
            onChange={(event) => setDraft({ ...draft, timeLimit: event.target.value })}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" className="btn btn-success" onClick={onSubmit} disabled={busy}>{submitLabel}</button>
        {onCancel && (
          <button type="button" className="btn btn-danger" onClick={onCancel}>Annuler</button>
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
        shuffle: Boolean(next.shuffle),
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
        <div style={{
          background: 'rgba(81,207,102,0.12)',
          border: '1px solid rgba(81,207,102,0.35)',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>Nouveau quiz</h3>
          <input
            className="input"
            placeholder="Nom du quiz"
            value={newQuiz.name}
            onChange={(event) => setNewQuiz({ ...newQuiz, name: event.target.value })}
          />
          <input
            className="input"
            placeholder="Description"
            value={newQuiz.description}
            onChange={(event) => setNewQuiz({ ...newQuiz, description: event.target.value })}
          />
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '8px 0 16px' }}>
            <input
              type="checkbox"
              checked={Boolean(newQuiz.isPrivate)}
              onChange={(event) => setNewQuiz({ ...newQuiz, isPrivate: event.target.checked })}
            />
            Privé — masqué dans le menu des quiz
          </label>
          <button type="button" className="btn btn-success" onClick={createQuiz} disabled={loading}>
            Créer
          </button>
          <p className="blind-hint">
            {admin?.role === 'super'
              ? 'Un quiz créé t\'est attribué. Tu peux le donner à un admin : lui et toi seuls pourrez le modifier ou le supprimer.'
              : 'Un quiz que tu crées t\'est attribué. Tu modifies et tu supprimes seulement les tiens.'}
          </p>
        </div>

        {quizzes.length === 0 ? (
          <div style={{ textAlign: 'center', opacity: 0.8 }}>
            <Icon name="quiz" tone="hero" />
            <p>Aucun quiz pour l'instant.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {quizzes.map((item) => {
              const editable = canEdit(item) && !item.locked;
              const count = item.questions ? item.questions.length : (item.questionCount || 0);
              return (
                <div key={item._id} className="score-card">
                  <h3 style={{ color: '#ff2347' }}>{item.name}</h3>
                  {item.isPrivate && (
                    <div style={{ color: '#ff2347', fontWeight: 'bold', marginBottom: 6 }}>Privé</div>
                  )}
                  <p style={{ minHeight: 40, opacity: 0.85 }}>{item.description}</p>
                  <div>{count} questions</div>
                  <div style={{ color: '#ffd000', margin: '8px 0' }}>
                    {item.owner ? item.owner : 'Non attribué'}
                  </div>
                  {admin?.role === 'super' && (
                    <select
                      className="input"
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
                    <>
                      <button type="button" className="btn" onClick={() => openQuiz(item._id)}><Icon name="pencil" />Modifier</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setConfirm({
                          title: 'Supprimer ce quiz ?',
                          message: `« ${item.name} » disparaît pour de bon.`,
                          run: () => removeQuiz(item._id)
                        })}
                      >
                        <Icon name="trash" />Supprimer
                      </button>
                    </>
                  )}
                </div>
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
      <button type="button" className="btn" onClick={() => { setQuiz(null); setDraft(null); }}>
        <Icon name="back" />Tous les quiz
      </button>
      <input
        className="input"
        value={quiz.name}
        onChange={(event) => setQuiz({ ...quiz, name: event.target.value })}
      />
      <input
        className="input"
        placeholder="Description"
        value={quiz.description || ''}
        onChange={(event) => setQuiz({ ...quiz, description: event.target.value })}
      />
      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '8px 0 16px' }}>
        <input
          type="checkbox"
          checked={Boolean(quiz.shuffle)}
          onChange={(event) => setQuiz({ ...quiz, shuffle: event.target.checked })}
        />
        Mélanger les questions à chaque partie
      </label>
      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '8px 0 16px' }}>
        <input
          type="checkbox"
          checked={Boolean(quiz.isPrivate)}
          onChange={(event) => setQuiz({ ...quiz, isPrivate: event.target.checked })}
        />
        Privé — masqué dans le menu des quiz
      </label>
      <button
        type="button"
        className="btn btn-success"
        disabled={loading}
        onClick={() => persist(quiz)}
      >
        Enregistrer
      </button>

      <h3 style={{ marginTop: 28 }}>Questions</h3>
      <p style={{ opacity: 0.75, marginTop: 0 }}>Glisse une question pour la déplacer.</p>
      {(quiz.questions || []).map((question, index) => (
        <div
          key={question.clientKey || index}
          className={`correction-item question-row${dragIndex === index ? ' is-dragging' : ''}`}
          style={{ alignItems: 'flex-start' }}
          draggable={!loading}
          onDragStart={(event) => startQuestionDrag(event, index)}
          onDragOver={(event) => hoverQuestion(event, index)}
          onDrop={(event) => event.preventDefault()}
          onDragEnd={finishQuestionDrag}
        >
          <div className="question-row-body">
            <span className="drag-handle" aria-hidden="true">⋮⋮</span>
            <div>
              <strong>{index + 1}. {typeLabel(question.type)}</strong>
              <div style={{ opacity: 0.85 }}>{question.prompt || question.musicUrl || 'Sans énoncé'}</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                {question.points || 1} pt · {question.timeLimit ? `${question.timeLimit}s` : 'temps libre'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={() => moveQuestion(index, -1)} disabled={index === 0}>↑</button>
            <button type="button" className="btn" onClick={() => moveQuestion(index, 1)} disabled={index === quiz.questions.length - 1}>↓</button>
            <button type="button" className="btn" onClick={() => { setDraft(questionFromApi(question)); setDraftIndex(index); }}>
              Modifier
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setConfirm({
                title: 'Supprimer cette question ?',
                message: `La question ${index + 1} sera retirée du quiz.`,
                run: () => deleteQuestion(index)
              })}
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}

      {draft ? (
        <QuestionForm
          draft={draft}
          setDraft={setDraft}
          submitLabel={draftIndex == null ? 'Ajouter la question' : 'Mettre à jour'}
          busy={loading}
          onCancel={() => { setDraft(null); setDraftIndex(null); }}
          onSubmit={commitDraft}
        />
      ) : (
        <button type="button" className="btn btn-success" onClick={() => { setDraft(emptyDraft()); setDraftIndex(null); }}>
          Ajouter une question
        </button>
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
