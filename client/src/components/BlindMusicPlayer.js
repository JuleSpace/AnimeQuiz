import React, { useEffect, useRef, useState } from 'react';
import { extractSpotifyId, extractYouTubeId, extractYouTubeTimestamp } from '../utils/media';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const BlindMusicPlayer = ({ url, revealed = false }) => {
  const audioRef = useRef(null);
  const iframeRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const youtubeId = extractYouTubeId(url);
  const spotifyId = extractSpotifyId(url);
  const start = extractYouTubeTimestamp(url);

  useEffect(() => {
    setAudioUrl('');
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    if (!url || youtubeId || spotifyId) return undefined;

    setAudioUrl(url);
    return undefined;
  }, [url, youtubeId, spotifyId]);

  useEffect(() => {
    if (!youtubeId || revealed) return undefined;

    const onMessage = (event) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'video-progress' || data.event === 'infoDelivery') {
          const info = data.info || {};
          if (typeof info.currentTime === 'number') setCurrentTime(info.currentTime);
          if (typeof info.duration === 'number') setDuration(info.duration);
          if (typeof info.playerState === 'number') setIsPlaying(info.playerState === 1);
        }
      } catch (error) {
        // Messages YouTube non JSON ignorés.
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [youtubeId, revealed]);

  const postYouTube = (func, args = '') => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func,
      args
    }), '*');
  };

  if (!url) {
    return <p style={{ opacity: 0.8 }}>Aucun extrait configuré.</p>;
  }

  if (spotifyId) {
    return (
      <div className="audio-player">
        <div style={{ color: '#1db954', marginBottom: '10px', fontWeight: 'bold' }}>
          {revealed ? 'Réponse Spotify' : 'Lecteur Spotify masqué'}
        </div>
        <div style={{ position: 'relative', width: '100%', height: revealed ? '152px' : '80px', overflow: 'hidden', borderRadius: '12px' }}>
          <iframe
            title="Lecteur Spotify"
            src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator`}
            style={{
              position: 'absolute',
              top: revealed ? 0 : '-72px',
              left: 0,
              width: '100%',
              height: '152px',
              border: 'none'
            }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </div>
      </div>
    );
  }

  if (youtubeId && revealed) {
    return (
      <div className="audio-player">
        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', borderRadius: '12px', overflow: 'hidden' }}>
          <iframe
            title="Vidéo YouTube"
            src={`https://www.youtube.com/embed/${youtubeId}?start=${start}&rel=0`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (youtubeId) {
    return (
      <div className="audio-player">
        <div style={{ position: 'relative', height: '88px', borderRadius: '12px', overflow: 'hidden', background: '#111' }}>
          <iframe
            ref={iframeRef}
            title="Audio YouTube masqué"
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&start=${start}&rel=0&modestbranding=1`}
            style={{ position: 'absolute', top: '-220px', left: 0, width: '100%', height: '360px', opacity: 0.01, border: 'none' }}
            allow="autoplay; encrypted-media"
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 16px',
            background: 'linear-gradient(45deg, #667eea, #764ba2)'
          }}>
            <button
              type="button"
              className="choice-btn"
              style={{ width: 48, height: 48, minHeight: 48, padding: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}
              onClick={() => postYouTube(isPlaying ? 'pauseVideo' : 'playVideo')}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Blind test</div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(event) => {
                  const time = Number(event.target.value);
                  setCurrentTime(time);
                  postYouTube('seekTo', [time, true]);
                }}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.85 }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
        <p style={{ marginTop: 8, fontSize: '0.85rem', opacity: 0.75, textAlign: 'center' }}>
          La vidéo reste masquée le temps de répondre.
        </p>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={(event) => setCurrentTime(event.target.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.target.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center'
      }}>
        <button
          type="button"
          className="choice-btn"
          style={{ width: 52, height: 52, minHeight: 52, padding: 0, borderRadius: '50%', marginBottom: 12 }}
          onClick={() => {
            if (!audioRef.current) return;
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(event) => {
            const time = Number(event.target.value);
            setCurrentTime(time);
            if (audioRef.current) audioRef.current.currentTime = time;
          }}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default BlindMusicPlayer;
