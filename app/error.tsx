'use client';
import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="wrap section empty-page">
      <p className="big-num">Oops</p>
      <h1>Something went wrong</h1>
      <p className="muted">An unexpected error occurred. You can try again or go back to the start.</p>
      <div className="row-gap" style={{ justifyContent: 'center' }}>
        <button className="btn" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn ghost">
          Back to home
        </Link>
      </div>
    </main>
  );
}
