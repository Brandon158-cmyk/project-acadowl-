import { redirect } from 'next/navigation';

export default function ParentFeesRedirectPage() {
  redirect('/home/fees');
}
