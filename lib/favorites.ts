'use client';
// Saved clinics ("heart" on a card), kept in localStorage.
const KEY = 'brightsmile.favorites';

export function loadFavorites(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveFavorites(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* private mode */
  }
}
