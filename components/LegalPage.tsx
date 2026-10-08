import SiteHeader from './SiteHeader';
import Footer from './Footer';

export type LegalSection = { title: string; text: string[] };

export default function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap section legal">
        <h1>{title}</h1>
        <p className="muted">Last updated {updated}</p>
        <p className="notice" style={{ margin: '16px 0' }}>
          {intro}
        </p>
        {sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            {s.text.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
