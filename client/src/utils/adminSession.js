import axios from 'axios';

const KEY = 'animeQuizAdminSession';

export function readAdminSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function applyAdminSession(session) {
  if (session?.token) {
    axios.defaults.headers.common.Authorization = `Bearer ${session.token}`;
    return session;
  }
  delete axios.defaults.headers.common.Authorization;
  return null;
}

export function storeAdminSession(session) {
  sessionStorage.setItem(KEY, JSON.stringify(session));
  return applyAdminSession(session);
}

export function clearAdminSession() {
  sessionStorage.removeItem(KEY);
  delete axios.defaults.headers.common.Authorization;
}

applyAdminSession(readAdminSession());
