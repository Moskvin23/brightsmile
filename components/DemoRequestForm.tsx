'use client';
import { useState } from 'react';

/** "Request a demo" form on the clinics landing page. Nothing is sent anywhere — it only validates and confirms. */
export default function DemoRequestForm() {
  const [f, setF] = useState({ name: '', clinic: '', email: '', phone: '' });
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
    if (f.clinic.trim().length < 2) er.clinic = 'Please enter the clinic name';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    setErrors(er);
    if (!Object.keys(er).length) setSent(true);
  };
  if (sent) {
    return (
      <div className="confirmed">
        <div className="check">✓</div>
        <h3>Thanks, {f.name.trim().split(' ')[0]}!</h3>
        <p className="muted">Demo only: nothing was sent, but this is where we would reply to {f.email} within one business day.</p>
      </div>
    );
  }
  const fields = [
    ['name', 'Your name', 'Jane Smith'],
    ['clinic', 'Clinic name', 'Sunrise Family Dental'],
    ['email', 'Work email', 'jane@clinic.com'],
    ['phone', 'Phone (optional)', '(512) 555-0142'],
  ] as const;
  return (
    <form className="details" noValidate onSubmit={submit}>
      {fields.map(([k, label, ph]) => (
        <label key={k} className="field">
          <span>{label}</span>
          <input
            value={f[k]}
            placeholder={ph}
            type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}
            onChange={(e) => set(k, e.target.value)}
            aria-invalid={!!errors[k]}
          />
          {errors[k] && <small className="err">{errors[k]}</small>}
        </label>
      ))}
      <button className="btn full" type="submit">
        Request a demo
      </button>
    </form>
  );
}
