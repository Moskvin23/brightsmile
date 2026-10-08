'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type Opt = { value: string; label: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  /** field = bordered input, chip = filter pill, bare = inside the search bar */
  variant?: 'field' | 'chip' | 'bare';
  ariaLabel?: string;
  /** shown on the button instead of the selected label (e.g. "Price") */
  display?: string;
  active?: boolean;
  className?: string;
};

export default function Select({ value, onChange, options, variant = 'field', ariaLabel, display, active, className = '' }: Props) {
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number; up: boolean } | null>(null);

  const selected = options.find((o) => o.value === value);
  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  const openMenu = () => {
    setHi(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };

  // place the menu under the button (or above if there is no room), keep it inside the viewport
  useLayoutEffect(() => {
    if (!open || !btn.current || !menu.current) return;
    const r = btn.current.getBoundingClientRect();
    const m = menu.current.getBoundingClientRect();
    const up = r.bottom + m.height + 12 > window.innerHeight && r.top > m.height + 12;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - Math.max(m.width, r.width) - 8);
    setPos({ top: up ? r.top - m.height - 6 : r.bottom + 6, left, minWidth: r.width, up });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      const t = e.target as Node;
      if (menu.current?.contains(t) || btn.current?.contains(t)) return;
      close();
    };
    const onScroll = (e: Event) => {
      if (!menu.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', away);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', away);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) menu.current?.querySelector('[data-hi="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [hi, open, pos]);

  const pick = (v: string) => {
    onChange(v);
    close();
    btn.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') close();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((hi + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((hi - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setHi(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setHi(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(options[hi].value);
    }
  };

  return (
    <>
      <button
        type="button"
        ref={btn}
        className={`sel sel-${variant}${open ? ' open' : ''}${active ? ' on' : ''} ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKey}
      >
        <span className="sel-val">{display ?? selected?.label ?? ''}</span>
        <svg className="sel-caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={id}
            role="listbox"
            className="sel-menu"
            onKeyDown={onKey}
            style={pos ? { top: pos.top, left: pos.left, minWidth: pos.minWidth } : { top: 0, left: 0, visibility: 'hidden' }}
          >
            {options.map((o, i) => (
              <div
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                data-hi={i === hi}
                className={`sel-opt${o.value === value ? ' picked' : ''}${i === hi ? ' hi' : ''}`}
                onPointerEnter={() => setHi(i)}
                onClick={() => pick(o.value)}
              >
                <span>{o.label}</span>
                {o.value === value && (
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <path d="M2.5 7.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
