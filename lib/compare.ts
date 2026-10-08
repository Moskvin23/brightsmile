'use client';
// Clinics picked for the side-by-side comparison, kept in localStorage.
const KEY = 'brightsmile.compare';
export const MAX_COMPARE = 3;

export function loadCompare(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string').slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function saveCompare(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_COMPARE)));
  } catch {
    /* private mode */
  }
}
