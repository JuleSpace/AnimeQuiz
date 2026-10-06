import React, { useEffect, useRef, useState } from 'react';
import { extractYouTubeId, extractYouTubeTimestamp, readPlaybackVolume, writePlaybackVolume } from '../utils/media';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const loadYouTube = () => {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!window.__lyricsYouTube) {
    window.__lyricsYouTube = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === 'function') previous();
        resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    });
  }
  return window.__lyricsYouTube;
};

export const lyricHoleLengths = (line) => {
  const matches = String(line || '').match(/_+/g);
  return matches ? matches.map((run) => run.length) : [];
};

export const LyricLine = ({ line, filled }) => {
  if (filled) {
    return <p className="lyrics-line">{filled}</p>;
  }
  const parts = String(line || '').split(/(_+)/);
  return (
    <p className="lyrics-line">
      {parts.map((part, index) => (
        /^_+$/.test(part)
          ? (
            <span key={index} className="lyrics-hole" aria-label={`${part.length} caractères`}>
              {Array.from({ length: part.length }, (_, slot) => (
                <span key={slot} className="lyrics-slot" />
              ))}
            </span>
          )
          : <span key={index}>{part}</span>
      ))}
    </p>
  );
};

const LyricsPlayer = ({
  url,
  clip,
  filled = '',
  editing = false,
  drawMode = false,
  onTime,
  onDraw,
  portrait = '',
  previewAt = 0
}) => {
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const clipRef = useRef(clip);
  const volumeRef = useRef(readPlaybackVolume());
  const drawRef = useRef(null);
  const cardLock = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [draftRect, setDraftRect] = useState(null);
  const [volume, setVolume] = useState(readPlaybackVolume);

  clipRef.current = clip || {};
  const youtubeId = extractYouTubeId(url);
  const masks = Array.isArray(clip?.masks) ? clip.masks : [];

  const outputVolume = (time) => {
    const edit = clipRef.current || {};
    const muteStart = Number(edit.muteStart) || 0;
    const muteEnd = Number(edit.muteEnd) || 0;
    const silent = muteEnd > muteStart && time >= muteStart && time < muteEnd;
    return silent ? 0 : volumeRef.current;
  };

  const applyVolume = (next) => {
    const value = writePlaybackVolume(next);
    volumeRef.current = value;
    setVolume(value);
    const live = playerRef.current;
    if (live?.setVolume) live.setVolume(outputVolume(live.getCurrentTime?.() || 0));
    if (videoRef.current) videoRef.current.volume = value / 100;
  };

  useEffect(() => {
    cardLock.current = false;
    setShowCard(false);
    setPlaying(false);
    setCurrentTime(0);
    playerRef.current = null;
    if (!url) return undefined;

    if (!youtubeId) {
      return undefined;
    }

    let dead = false;
    let timer = 0;
    const host = document.createElement('div');
    host.style.width = '100%';
    host.style.height = '100%';
    frameRef.current?.appendChild(host);
    loadYouTube().then((YT) => {
      if (dead || !host.isConnected) return;
      const player = new YT.Player(host, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: editing ? 1 : 0,
          origin: window.location.origin,
          start: extractYouTubeTimestamp(url) || 0,
          enablejsapi: 1,
          playsinline: 1
        },
        events: {
          onReady: () => {
            playerRef.current = player;
            const length = player.getDuration?.() || 0;
            if (length) setDuration(length);
            if (editing && previewAt > 0) {
              player.seekTo?.(previewAt, true);
              player.pauseVideo?.();
              setCurrentTime(previewAt);
            }
            player.setVolume?.(outputVolume(player.getCurrentTime?.() || 0));
          },
          onStateChange: (event) => {
            const state = event.data;
            setPlaying(state === YT.PlayerState.PLAYING);
            if (state === YT.PlayerState.ENDED && String(clipRef.current?.line || '').trim()) {
              setShowCard(true);
              cardLock.current = true;
            }
          }
        }
      });
      timer = window.setInterval(() => {
        const live = playerRef.current;
        if (!live || !live.getCurrentTime) return;
        const time = live.getCurrentTime() || 0;
        const length = live.getDuration?.() || 0;
        const edit = clipRef.current || {};
        const muteStart = Number(edit.muteStart) || 0;
        const muteEnd = Number(edit.muteEnd) || 0;
        const endAt = Number(edit.endAt) || 0;
        const silent = muteEnd > muteStart && time >= muteStart && time < muteEnd;
        if (live.setVolume) live.setVolume(silent ? 0 : volumeRef.current);
        setCurrentTime(time);
        if (length) setDuration(length);
        if (onTime) onTime(time);
        if (!cardLock.current && endAt > 0 && time >= endAt) {
          cardLock.current = true;
          live.pauseVideo?.();
          setPlaying(false);
          if (String(edit.line || '').trim()) setShowCard(true);
        }
      }, 200);
    });

    return () => {
      dead = true;
      window.clearInterval(timer);
      const live = playerRef.current;
      playerRef.current = null;
      if (live && live.destroy) live.destroy();
      host.remove();
    };
  }, [url, youtubeId, editing, onTime, previewAt]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || youtubeId) return undefined;
    video.volume = volumeRef.current / 100;
    const onUpdate = () => {
      const time = video.currentTime || 0;
      const edit = clipRef.current || {};
      const muteStart = Number(edit.muteStart) || 0;
      const muteEnd = Number(edit.muteEnd) || 0;
      const endAt = Number(edit.endAt) || 0;
      video.muted = muteEnd > muteStart && time >= muteStart && time < muteEnd;
      video.volume = volumeRef.current / 100;
      setCurrentTime(time);
      if (onTime) onTime(time);
      if (!cardLock.current && endAt > 0 && time >= endAt) {
        cardLock.current = true;
        video.pause();
        setPlaying(false);
        if (String(edit.line || '').trim()) setShowCard(true);
      }
    };
    const onMeta = () => {
      video.volume = volumeRef.current / 100;
      setDuration(video.duration || 0);
    };
    const onEnd = () => {
      setPlaying(false);
      cardLock.current = true;
      if (String(clipRef.current?.line || '').trim()) setShowCard(true);
    };
    video.addEventListener('timeupdate', onUpdate);
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('ended', onEnd);
    return () => {
      video.removeEventListener('timeupdate', onUpdate);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('ended', onEnd);
    };
  }, [url, youtubeId, onTime]);

  const seek = (seconds) => {
    const next = Math.max(0, seconds);
    cardLock.current = false;
    setShowCard(false);
    if (youtubeId && playerRef.current?.seekTo) {
      playerRef.current.seekTo(next, true);
      return;
    }
    if (videoRef.current) videoRef.current.currentTime = next;
  };

  const toggle = () => {
    if (youtubeId && playerRef.current) {
      if (playing) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
    setPlaying(video.paused === false);
  };

  const replay = () => {
    cardLock.current = false;
    setShowCard(false);
    seek(extractYouTubeTimestamp(url) || 0);
    if (youtubeId && playerRef.current?.playVideo) playerRef.current.playVideo();
    else if (videoRef.current) videoRef.current.play();
  };

  const pointOf = (event) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100
    };
  };

  const onPointerDown = (event) => {
    if (!drawMode) return;
    const point = pointOf(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawRef.current = { ...point, rect: null };
    setDraftRect({ ...point, w: 0, h: 0 });
  };

  const onPointerMove = (event) => {
    const start = drawRef.current;
    if (!start) return;
    const point = pointOf(event);
    if (!point) return;
    const x = Math.min(start.x, point.x);
    const y = Math.min(start.y, point.y);
    const rect = {
      x,
      y,
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y)
    };
    start.rect = rect;
    setDraftRect(rect);
  };

  const onPointerUp = () => {
    const rect = drawRef.current?.rect;
    drawRef.current = null;
    setDraftRect(null);
    if (!rect || rect.w < 3 || rect.h < 3 || !onDraw) return;
    onDraw({
      x: Math.max(0, Math.min(100, rect.x)),
      y: Math.max(0, Math.min(100, rect.y)),
      w: Math.max(0, Math.min(100 - rect.x, rect.w)),
      h: Math.max(0, Math.min(100 - rect.y, rect.h))
    });
  };

  return (
    <div className="lyrics-player">
      <div className="lyrics-stage" ref={stageRef}>
        <div className="lyrics-frame">
          {youtubeId ? (
            <div ref={frameRef} className="lyrics-yt" />
          ) : url ? (
            <video
              ref={videoRef}
              src={url}
              playsInline
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          ) : (
            <div className="lyrics-empty">Ajoute un lien ou une vidéo</div>
          )}
        </div>
        {!showCard && masks.map((mask, index) => (
          <div
            key={`${mask.x}-${mask.y}-${index}`}
            className="lyrics-mask"
            style={{ left: `${mask.x}%`, top: `${mask.y}%`, width: `${mask.w}%`, height: `${mask.h}%` }}
          />
        ))}
        {draftRect && (
          <div
            className="lyrics-mask is-draft"
            style={{ left: `${draftRect.x}%`, top: `${draftRect.y}%`, width: `${draftRect.w}%`, height: `${draftRect.h}%` }}
          />
        )}
        {portrait && (editing || currentTime >= 1.4) && (
          <img className="whos-portrait" src={portrait} alt="" />
        )}
        {showCard && (
          <div className="lyrics-card">
            <LyricLine line={clip?.line} filled={filled} />
            <button type="button" className="btn lyrics-replay" onClick={replay}>Revoir</button>
          </div>
        )}
        {drawMode && (
          <div
            className="lyrics-draw"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        )}
      </div>
      {url && (
        <div className="blind-controls lyrics-controls">
          {!showCard && (
            <>
              <button type="button" className="blind-play" onClick={toggle}>
                {playing ? 'Pause' : 'Lecture'}
              </button>
              <div className="blind-times">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              {editing && (
                <input
                  className="blind-range"
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={Math.min(currentTime, duration || 0)}
                  aria-label="Position dans la vidéo"
                  onChange={(event) => seek(Number(event.target.value))}
                />
              )}
            </>
          )}
          <label className="blind-volume">
            <span>Volume</span>
            <input
              className="blind-range"
              type="range"
              min="0"
              max="100"
              value={volume}
              aria-label="Volume"
              onChange={(event) => applyVolume(Number(event.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default LyricsPlayer;
