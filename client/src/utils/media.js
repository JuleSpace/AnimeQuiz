export function extractYouTubeId(url) {
  if (!url) return null;
  const match = String(url).match(/(?:youtu\.be\/|shorts\/|embed\/|v\/|watch\?v=|&v=)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function extractYouTubeTimestamp(url) {
  const match = String(url || '').match(/[?&](?:t|start)=(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function extractSpotifyId(url) {
  const match = String(url || '').match(/spotify\.com\/(?:intl-[a-z]+\/)?track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function isDirectAudio(url) {
  return /\.(mp3|ogg|wav|m4a|aac)(\?|$)/i.test(String(url || ''));
}

export const WHOS_TEMPLATE_URL = 'https://www.youtube.com/watch?v=vu_zg45ONA0';

const VOLUME_KEY = 'animeQuizVolume';
let playbackVolume = null;

const clampVolume = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 80;
  return Math.max(0, Math.min(100, Math.round(number)));
};

export function readPlaybackVolume() {
  if (playbackVolume != null) return playbackVolume;
  try {
    const stored = window.localStorage.getItem(VOLUME_KEY);
    playbackVolume = stored == null || stored === '' ? 80 : clampVolume(stored);
  } catch (error) {
    playbackVolume = 80;
  }
  return playbackVolume;
}

export function writePlaybackVolume(value) {
  playbackVolume = clampVolume(value);
  try {
    window.localStorage.setItem(VOLUME_KEY, String(playbackVolume));
  } catch (error) {
    playbackVolume = clampVolume(value);
  }
  return playbackVolume;
}
