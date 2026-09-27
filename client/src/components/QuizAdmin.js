import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TYPE_OPTIONS = [
  { id: 'qcm', label: 'Choix multiple' },
  { id: 'boolean', label: 'Vrai / Faux' },
  { id: 'text', label: 'Réponse libre' },
  { id: 'blank', label: 'Texte à trous' },
  { id: 'music', label: 'Blind test' }
];

const emptyDraft = () => ({
  type: 'qcm',
  prompt: '',
  imageUrl: '',
  videoUrl: '',
  musicUrl: '',
  options: ['', '', '', ''],
  correctIndexes: [0],
  multiple: false,
  correctBoolean: true,
  acceptedText: '',
  blanksText: '',
  points: 1,
  timeLimit: 20
});

const questionToApi = (draft) => ({
  type: draft.type,
  prompt: draft.prompt,
  imageUrl: draft.imageUrl,
  videoUrl: draft.type === 'music' ? '' : draft.videoUrl,
  musicUrl: draft.type === 'music' ? draft.musicUrl : '',
  options: draft.options,
  correctIndexes: draft.multiple ? draft.correctIndexes : draft.correctIndexes.slice(0, 1),
  multiple: Boolean(draft.multiple),
  correctBoolean: draft.correctBoolean,
  acceptedAnswers: draft.acceptedText.split('\n').map((line) => line.trim()).filter(Boolean),
  blanks: draft.blanksText.split('\n').map((line) => line.trim()).filter(Boolean),
  points: Number(draft.points) || 1,
  timeLimit: draft.timeLimit === '' ? 0 : Number(draft.timeLimit) || 0
});

const questionFromApi = (question) => ({
  type: question.type,
  prompt: question.prompt || '',
  imageUrl: question.imageUrl || '',
  videoUrl: question.videoUrl || '',
  musicUrl: question.musicUrl || '',
  options: question.options?.length ? [...question.options] : ['', ''],
  correctIndexes: question.correctIndexes?.length ? [...question.correctIndexes] : [0],
  multiple: (question.correctIndexes || []).length > 1,
  correctBoolean: question.correctBoolean !== false,
  acceptedText: (question.acceptedAnswers || []).join('\n'),
  blanksText: (question.blanks || []).join('\n'),
  points: question.points || 1,
  timeLimit: question.timeLimit ?? 0
});

const typeLabel = (type) => TYPE_OPTIONS.find((option) => option.id === type)?.label || type;

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

const QuestionForm = ({ draft, setDraft, onSubmit, onCancel, submitLabel, busy }) => {
  const holes = (draft.prompt.match(/_{3,}/g) || []).length;
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
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="btn"
            style={{
              margin: 0,
              background: draft.type === option.id ? 'linear-gradient(45deg, #ffd700, #f08c00)' : undefined,
              color: draft.type === option.id ? '#1a1a1a' : 'white'
            }}
            onClick={() => setDraft((current) => ({
              ...current,
              type: option.id,
              timeLimit: option.id === 'music' && Number(current.timeLimit) === 20 ? 0 : current.timeLimit
            }))}
          >
            {option.label}
          </button>
        ))}
      </div>

      {draft.type !== 'blank' && (
        <textarea
          className="input"
          rows={3}
          placeholder={draft.type === 'music' ? 'Consigne (optionnel), ex. Quel est ce générique ?' : 'Énoncé de la question'}
          value={draft.prompt}
          onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
        />
      )}

      {draft.type === 'blank' && (
        <>
          <textarea
            className="input"
            rows={3}
            placeholder="Le héros de ___ s'appelle ___."
            value={draft.prompt}
            onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
          />
          <p style={{ opacity: 0.8, margin: '4px 0 8px' }}>
            {holes} trou{holes > 1 ? 's' : ''} détecté{holes > 1 ? 's' : ''}. Une réponse par ligne, variantes séparées par |. Pour donner 1 point par trou, mets autant de points que de trous.
          </p>
          <textarea
            className="input"
            rows={Math.max(2, holes)}
            placeholder={'One Piece\nLuffy|Monkey D. Luffy'}
            value={draft.blanksText}
            onChange={(event) => setDraft({ ...draft, blanksText: event.target.value })}
          />
        </>
      )}

      {draft.type === 'qcm' && (
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
                {draft.correctIndexes.includes(index) ? '✅' : '⬜'}
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
                  ✕
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
        <textarea
          className="input"
          rows={3}
          placeholder={'Une réponse acceptée par ligne\nNaruto\nNaruto Uzumaki'}
          value={draft.acceptedText}
          onChange={(event) => setDraft({ ...draft, acceptedText: event.target.value })}
        />
      )}

      {draft.type === 'music' && (
        <>
          <input
            className="input"
            placeholder="Lien MP3, YouTube ou Spotify"
            value={draft.musicUrl}
            onChange={(event) => setDraft({ ...draft, musicUrl: event.target.value })}
          />
          <textarea
            className="input"
            rows={2}
            placeholder={'Réponse attendue (une par ligne)\nTank!\nCowboy Bebop'}
            value={draft.acceptedText}
            onChange={(event) => setDraft({ ...draft, acceptedText: event.target.value })}
          />
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
            L'extrait est masqué. Le chef attribue les points à la main, comme pour les autres questions.
            Mets 0 seconde pour laisser le chef décider du moment.
          </p>
        </>
      )}

      {draft.type !== 'music' && (
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

const QuizAdmin = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftIndex, setDraftIndex] = useState(null);
  const [newQuiz, setNewQuiz] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const loadQuizzes = async () => {
    const response = await axios.get('/api/quizzes?edit=1');
    setQuizzes(response.data);
  };

  useEffect(() => {
    loadQuizzes().catch(() => setError('Impossible de charger les quiz'));
  }, []);

  const persist = async (next) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.put(`/api/quizzes/${next._id}`, {
        name: next.name,
        description: next.description,
        shuffle: Boolean(next.shuffle),
        questions: next.questions
      });
      setQuiz(response.data);
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
      setNewQuiz({ name: '', description: '' });
      setQuiz(response.data);
      setDraft(emptyDraft());
      setDraftIndex(null);
      await loadQuizzes();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Création impossible'));
    } finally {
      setLoading(false);
    }
  };

  const removeQuiz = async (quizId) => {
    if (!window.confirm('Supprimer ce quiz ?')) return;
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
      setQuiz(response.data);
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

  const moveQuestion = async (index, direction) => {
    const target = index + direction;
    if (!quiz || target < 0 || target >= quiz.questions.length) return;
    const questions = [...quiz.questions];
    const [item] = questions.splice(index, 1);
    questions.splice(target, 0, item);
    await persist({ ...quiz, questions });
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
          <button type="button" className="btn btn-success" onClick={createQuiz} disabled={loading}>
            Créer
          </button>
        </div>

        {quizzes.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.8 }}>Aucun quiz pour l'instant.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {quizzes.map((item) => (
              <div key={item._id} className="score-card">
                <h3 style={{ color: '#ffd700' }}>{item.name}</h3>
                <p style={{ minHeight: 40, opacity: 0.85 }}>{item.description}</p>
                <div>{item.questions?.length || 0} questions</div>
                <button type="button" className="btn" onClick={() => openQuiz(item._id)}>Modifier</button>
                <button type="button" className="btn btn-danger" onClick={() => removeQuiz(item._id)}>Supprimer</button>
              </div>
            ))}
          </div>
        )}
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="btn" onClick={() => { setQuiz(null); setDraft(null); }}>
        ← Tous les quiz
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
      <button
        type="button"
        className="btn btn-success"
        disabled={loading}
        onClick={() => persist(quiz)}
      >
        Enregistrer
      </button>

      <h3 style={{ marginTop: 28 }}>Questions</h3>
      {(quiz.questions || []).map((question, index) => (
        <div key={`${question.prompt}-${index}`} className="correction-item" style={{ alignItems: 'flex-start' }}>
          <div>
            <strong>{index + 1}. {typeLabel(question.type)}</strong>
            <div style={{ opacity: 0.85 }}>{question.prompt || question.musicUrl || 'Sans énoncé'}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              {question.points || 1} pt · {question.timeLimit ? `${question.timeLimit}s` : 'temps libre'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={() => moveQuestion(index, -1)}>↑</button>
            <button type="button" className="btn" onClick={() => moveQuestion(index, 1)}>↓</button>
            <button type="button" className="btn" onClick={() => { setDraft(questionFromApi(question)); setDraftIndex(index); }}>
              Modifier
            </button>
            <button type="button" className="btn btn-danger" onClick={() => deleteQuestion(index)}>Supprimer</button>
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
    </div>
  );
};

export default QuizAdmin;
