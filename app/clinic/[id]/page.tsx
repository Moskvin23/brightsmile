import { notFound } from 'next/navigation';
import { clinics, getClinic } from '@/lib/data';
import ClinicView from '@/components/ClinicView';

export function generateStaticParams() {
  return clinics.map((c) => ({ id: c.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const c = getClinic(params.id);
  return { title: c ? `${c.name} — book online` : 'Clinic' };
}

export default function Page({ params }: { params: { id: string } }) {
  const c = getClinic(params.id);
  if (!c) notFound();
  return <ClinicView id={c.id} />;
}
