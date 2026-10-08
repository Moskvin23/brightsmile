'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/** Demo sign-in: validates the form and remembers a display name in localStorage. There is no real auth. */
export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string) => {
    setF({ ...f, [k]: v });
    if (errors[k]) {
      const r = { ...errors };
      delete r[k];
      setErrors(r);
    }
  };
  const enter = (name: string, to: string) => {
    try {
      localStorage.setItem('brightsmile.user', JSON.stringify({ name }));
    } catch {
      /* ignore */
    }
    router.push(to);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (mode === 'signup' && f.name.trim().length < 2) er.name = 'Please enter your name';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    if (f.password.length < 8) er.password = 'Use at least 8 characters';
    setErrors(er);
    if (Object.keys(er).length) return;
    const fromEmail = f.email
      .split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
    enter(mode === 'signup' ? f.name.trim() : fromEmail, '/my-bookings/');
  };
  return (
    <div className="auth">
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>
          Log in
        </button>
        <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>
          Create account
        </button>
      </div>
      <form className="details" noValidate onSubmit={submit}>
        {mode === 'signup' && (
          <label className="field">
            <span>Full name</span>
            <input value={f.name} autoComplete="name" onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />
            {errors.name && <small className="err">{errors.name}</small>}
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={f.email}
            autoComplete="email"
            placeholder="jane@example.com"
            onChange={(e) => set('email', e.target.value)}
            aria-invalid={!!errors.email}
          />
          {errors.email && <small className="err">{errors.email}</small>}
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={f.password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onChange={(e) => set('password', e.target.value)}
            aria-invalid={!!errors.password}
          />
          {errors.password && <small className="err">{errors.password}</small>}
        </label>
        <button className="btn full" type="submit">
          {mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
      <p className="fine">Demo: any valid email and an 8+ character password will do.</p>
      <div className="auth-demo">
        <b>Or jump straight in</b>
        <button className="btn ghost full" onClick={() => enter('Demo Patient', '/my-bookings/')}>
          Continue as a patient
        </button>
        <Link className="btn ghost full" href="/admin/">
          Open the clinic admin
        </Link>
        <Link className="btn ghost full" href="/admin/platform/">
          Open the platform admin
        </Link>
      </div>
    </div>
  );
}
