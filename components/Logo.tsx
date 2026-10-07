import Link from 'next/link';

export default function Logo({ light = false, sub }: { light?: boolean; sub?: string }) {
  return (
    <Link href="/" className={`logo${light ? ' light' : ''}`}>
      <i />
      <span>Brightsmile{sub && <small>{sub}</small>}</span>
    </Link>
  );
}
