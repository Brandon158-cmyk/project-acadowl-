import { redirect } from 'next/navigation';

export default async function ParentMessageThreadRedirectPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  redirect(`/home/messages/${threadId}`);
}
