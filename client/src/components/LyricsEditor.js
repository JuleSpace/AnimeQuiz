import React, { useState } from 'react';
import axios from 'axios';
import LyricsPlayer, { lyricHoleLengths, LyricLine } from './LyricsPlayer';

const mark = (value) => Math.round((Number(value) || 0) * 10) / 10;

const HoleHint = ({ line, answers }) => {
  const lengths = lyricHoleLengths(line);
  if (!lengths.length) return null;
  const written = String(answers || '').split(/\r?\n/).map((entry) => entry.split('|')[0].trim()).filter(Boolean);
  const text = lengths.map((length, index) => {
    const word = written[index];
    const size = `${length} caractère${length > 1 ? 's' : ''}`;
    if (word && word.length !== length) {
      return `Trou ${index + 1} : ${size}, « ${word} » en fait ${word.length}`;
    }
    return `Trou ${index + 1} : ${size}`;
  }).join(' · ');
  return <p className="blind-hint">{text}</p>;
};

const LyricsEditor = ({ draft, setDraft }) => {
  const [playhead, setPlayhead] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const clip = {
    muteStart: Number(draft.clipMuteStart) || 0,
    muteEnd: Number(draft.clipMuteEnd) || 0,
    endAt: Number(draft.clipEndAt) || 0,
    line: draft.clipLine || '',
    masks: draft.clipMasks || []
  };

  const stamp = (field) => {
    setDraft((current) => ({ ...current, [field]: mark(playhead) }));
  };

  const onFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const body = new FormData();
      body.append('clip', file);
      const response = await axios.post('/api/clips', body);
      setDraft((current) => ({ ...current, musicUrl: response.data.url || '' }));
    } catch (error) {
      setUploadError(error.response?.data?.error || 'Import impossible');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="lyrics-editor">
      <input
        className="input"
        placeholder="Lien YouTube"
        value={draft.musicUrl || ''}
        onChange={(event) => setDraft({ ...draft, musicUrl: event.target.value })}
      />
      <label className="lyrics-upload">
        <span className="btn">{uploading ? 'Import…' : 'Importer un MP4'}</span>
        <input type="file" accept="video/mp4,video/webm" disabled={uploading} onChange={onFile} />
      </label>
      {uploadError && <p className="blind-hint">{uploadError}</p>}
      <p className="blind-hint">
        Lance la vidéo, marque où le son se coupe, où il revient, puis où l'écran de fin apparaît.
        Trace un rectangle pour cacher des paroles à l'image.
      </p>
      <LyricsPlayer
        url={draft.musicUrl}
        clip={clip}
        editing
        drawMode={drawing}
        onTime={setPlayhead}
        onDraw={(mask) => {
          setDrawing(false);
          setDraft((current) => ({
            ...current,
            clipMasks: [...(current.clipMasks || []), mask].slice(0, 4)
          }));
        }}
      />
      <div className="lyrics-marks">
        <label>
          Son coupé
          <input
            className="input"
            type="number"
            min="0"
            step="0.1"
            value={draft.clipMuteStart}
            onChange={(event) => setDraft({ ...draft, clipMuteStart: event.target.value })}
          />
          <button type="button" className="btn btn-quiet" onClick={() => stamp('clipMuteStart')}>Ici</button>
        </label>
        <label>
          Son de retour
          <input
            className="input"
            type="number"
            min="0"
            step="0.1"
            value={draft.clipMuteEnd}
            onChange={(event) => setDraft({ ...draft, clipMuteEnd: event.target.value })}
          />
          <button type="button" className="btn btn-quiet" onClick={() => stamp('clipMuteEnd')}>Ici</button>
        </label>
        <label>
          Écran de fin
          <input
            className="input"
            type="number"
            min="0"
            step="0.1"
            value={draft.clipEndAt}
            onChange={(event) => setDraft({ ...draft, clipEndAt: event.target.value })}
          />
          <button type="button" className="btn btn-quiet" onClick={() => stamp('clipEndAt')}>Ici</button>
        </label>
      </div>
      <div className="lyrics-mask-row">
        <button
          type="button"
          className={`btn${drawing ? ' is-on' : ''}`}
          disabled={(draft.clipMasks || []).length >= 4}
          onClick={() => setDrawing((value) => !value)}
        >
          {drawing ? 'Trace le cache' : 'Cacher une zone'}
        </button>
        {(draft.clipMasks || []).map((mask, index) => (
          <button
            key={`${mask.x}-${mask.y}-${index}`}
            type="button"
            className="btn btn-danger"
            onClick={() => setDraft((current) => ({
              ...current,
              clipMasks: current.clipMasks.filter((_, maskIndex) => maskIndex !== index)
            }))}
          >
            Retirer le cache {index + 1}
          </button>
        ))}
      </div>
      <textarea
        className="input"
        rows={3}
        placeholder={'Écran de fin : un _ par caractère\nJe suis ____ dans la ville'}
        value={draft.clipLine}
        onChange={(event) => setDraft({ ...draft, clipLine: event.target.value })}
      />
      <HoleHint line={draft.clipLine} answers={draft.choice ? '' : draft.acceptedText} />
      {draft.clipLine && (
        <div className="lyrics-preview">
          <LyricLine line={draft.clipLine} />
        </div>
      )}
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
        <>
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
    </div>
  );
};

export default LyricsEditor;
