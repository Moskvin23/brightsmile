'use client';
import { useEffect, useRef } from 'react';

/** Accessible dialog: Escape closes, focus is kept inside, page scroll is locked, focus returns to the opener. */
export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusables = () =>
      Array.from(box.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])') ?? []);
    focusables()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.sel-menu')) {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = prev;
      opener?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={box} className="modal" role="dialog" aria-modal="true" aria-label={title}>
        {children}
      </div>
    </div>
  );
}
