'use client';
import Link from 'next/link';
import { useState } from 'react';
import Logo from './Logo';

export type NavItem = { key: string; label: string; icon: string; badge?: string };

export default function AdminShell({
  sub,
  items,
  active,
  onNav,
  children,
  switchTo,
}: {
  sub: string;
  items: NavItem[];
  active: string;
  onNav: (k: string) => void;
  children: React.ReactNode;
  switchTo: { href: string; label: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="admin">
      <aside className={`side${open ? ' open' : ''}`}>
        <div className="side-head">
          <Logo light sub={sub} />
          <button className="side-x" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>
        <nav>
          {items.map((i) => (
            <button
              key={i.key}
              className={i.key === active ? 'on' : ''}
              onClick={() => {
                onNav(i.key);
                setOpen(false);
              }}
            >
              <span className="ico">{i.icon}</span>
              {i.label}
              {i.badge && <em>{i.badge}</em>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <Link href={switchTo.href}>{switchTo.label}</Link>
          <Link href="/">← Public site</Link>
          <p>Demo login · data is fictional</p>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="admin-main">
        <button className="burger" onClick={() => setOpen(true)} aria-label="Menu">
          ☰
        </button>
        {children}
      </div>
    </div>
  );
}
