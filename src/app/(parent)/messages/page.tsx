import { redirect } from 'next/navigation';

export default function ParentMessagesRedirectPage() {
  redirect('/home/messages');
}
