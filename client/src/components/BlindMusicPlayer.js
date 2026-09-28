import React, { useEffect, useRef, useState } from 'react';
import { extractSpotifyId, extractYouTubeId, extractYouTubeTimestamp } from '../utils/media';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PlayerControls = ({
  isPlaying,
  onToggle,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolume
}) => (
  <div className="blind-controls">
    <button type="button" className="blind-play" onClick={onToggle}>
      {isPlaying ? 'Pause' : 'Lecture'}
    </button>
    <input
      className="blind-range"
      type="range"
      min="0"
      max={duration || 100}
      step="0.1"
      value={Math.min(currentTime, duration || 100)}
      aria-label="Position dans l'extrait"
      onChange={(event) => onSeek(Number(event.target.value))}
    />
    <div className="blind-times">
      <span>{formatTime(currentTime)}</span>
      <span>{formatTime(duration)}</span>
    </div>
    <label className="blind-volume">
      <span>Volume</span>
      <input
        className="blind-range"
        type="range"
        min="0"
        max="100"
        value={volume}
        aria-label="Volume"
        onChange={(event) => onVolume(Number(event.target.value))}
      />
    </label>
  </div>
);

const BlindMusicPlayer = ({ url, revealed = false }) => {
  const audioRef = useRef(null);
  const iframeRef = useRef(null);
  const volumeRef = useRef(80);
  const [audioUrl, setAudioUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);

  const youtubeId = extractYouTubeId(url);
  const spotifyId = extractSpotifyId(url);
  const start = extractYouTubeTimestamp(url);

  const postYouTube = (func, args = []) => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(JSON.stringify({
      event: 'command',
      func,
      args
    }), '*');
  };

  const applyVolume = (next) => {
    const value = Math.max(0, Math.min(100, Math.round(next)));
    volumeRef.current = value;
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value / 100;
    postYouTube('setVolume', [value]);
    postYouTube(value === 0 ? 'mute' : 'unMute');
  };

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
    if (audioRef.current) audioRef.current.volume = volumeRef.current / 100;
  }, [audioUrl]);

  useEffect(() => {
    if (!youtubeId || revealed) return undefined;

    let ready = false;
    const arm = () => {
      const frame = iframeRef.current?.contentWindow;
      if (!frame) return;
      frame.postMessage(JSON.stringify({
        event: 'listening',
        id: 'blind-test',
        channel: 'widget'
      }), '*');
      frame.postMessage(JSON.stringify({
        event: 'command',
        func: 'addEventListener',
        args: ['onReady']
      }), '*');
      frame.postMessage(JSON.stringify({
        event: 'command',
        func: 'addEventListener',
        args: ['onStateChange']
      }), '*');
    };

    const onMessage = (event) => {
      if (event.origin !== 'https://www.youtube.com') return;
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        return;
      }

      if (data.event === 'onReady' || data.event === 'initialDelivery') {
        ready = true;
        postYouTube('setVolume', [volumeRef.current]);
        postYouTube(volumeRef.current === 0 ? 'mute' : 'unMute');
      }

      const info = data.info || {};
      if (data.event === 'infoDelivery' || data.event === 'video-progress') {
        if (typeof info.currentTime === 'number') setCurrentTime(info.currentTime);
        if (typeof info.duration === 'number' && info.duration > 0) setDuration(info.duration);
        if (typeof info.playerState === 'number') setIsPlaying(info.playerState === 1);
      }
    };

    window.addEventListener('message', onMessage);
    arm();
    const interval = setInterval(() => {
      if (!ready) arm();
    }, 500);

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', onMessage);
    };
  }, [youtubeId, revealed]);

  const togglePlayback = () => {
    if (youtubeId && !revealed) {
      postYouTube(isPlaying ? 'pauseVideo' : 'playVideo');
      setIsPlaying((playing) => !playing);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  };

  const seek = (time) => {
    setCurrentTime(time);
    if (youtubeId && !revealed) {
      postYouTube('seekTo', [time, true]);
      return;
    }
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  if (!url) {
    return <p style={{ opacity: 0.8 }}>Aucun extrait configuré.</p>;
  }

  if (spotifyId) {
    return (
      <div className="audio-player blind-player">
        <div className={`blind-spotify${revealed ? ' is-revealed' : ''}`}>
          <iframe
            title="Lecteur Spotify"
            src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator`}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
          {!revealed && <div className="blind-spotify-mask">Blind test</div>}
        </div>
        {!revealed && (
          <p className="blind-hint">La pause et le volume sont dans la barre sous le bandeau.</p>
        )}
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
    const origin = encodeURIComponent(window.location.origin);
    return (
      <div className="audio-player blind-player">
        <iframe
          ref={iframeRef}
          id="blind-test"
          title="Audio YouTube masqué"
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&start=${start}&rel=0&modestbranding=1&origin=${origin}`}
          className="blind-youtube-hidden"
          allow="autoplay; encrypted-media"
        />
        <PlayerControls
          isPlaying={isPlaying}
          onToggle={togglePlayback}
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          volume={volume}
          onVolume={applyVolume}
        />
        <p className="blind-hint">La vidéo reste masquée le temps de répondre.</p>
      </div>
    );
  }

  return (
    <div className="audio-player blind-player">
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={(event) => setCurrentTime(event.target.currentTime)}
        onLoadedMetadata={(event) => {
          setDuration(event.target.duration);
          event.target.volume = volumeRef.current / 100;
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <PlayerControls
        isPlaying={isPlaying}
        onToggle={togglePlayback}
        currentTime={currentTime}
        duration={duration}
        onSeek={seek}
        volume={volume}
        onVolume={applyVolume}
      />
    </div>
  );
};

export default BlindMusicPlayer;
