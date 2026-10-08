'use client';
import { useState } from 'react';

/** Contact form — validates and confirms, nothing is sent (portfolio demo). */
export default function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f, v: string) => {
    setF({ ...f, [k]: v });
    if (errors[k]) {
      const r = { ...errors };
      delete r[k];
      setErrors(r);
    }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = 'Please enter your name';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    if (f.message.trim().length < 10) er.message = 'Write at least a short sentence';
    setErrors(er);
    if (!Object.keys(er).length) setSent(true);
  };
  if (sent)
    return (
      <div className="confirmed">
        <div className="check">✓</div>
        <h3>Message received</h3>
        <p className="muted">Demo only: nothing was sent.</p>
      </div>
    );
  return (
    <form className="details" noValidate onSubmit={submit}>
      <label className="field">
        <span>Your name</span>
        <input value={f.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />
        {errors.name && <small className="err">{errors.name}</small>}
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} />
        {errors.email && <small className="err">{errors.email}</small>}
      </label>
      <label className="field">
        <span>Message</span>
        <textarea rows={5} value={f.message} onChange={(e) => set('message', e.target.value)} aria-invalid={!!errors.message} />
        {errors.message && <small className="err">{errors.message}</small>}
      </label>
      <button className="btn full" type="submit">
        Send message
      </button>
    </form>
  );
}
