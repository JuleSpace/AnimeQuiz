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
