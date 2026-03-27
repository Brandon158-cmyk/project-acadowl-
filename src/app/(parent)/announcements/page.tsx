import { redirect } from 'next/navigation';

export default function ParentAnnouncementsRedirectPage() {
  redirect('/home/notices');
}
