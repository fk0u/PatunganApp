import React from 'react';
import { Metadata } from 'next';
import AcceptInvitation from '@/components/sessions/accept-invitation';

export const metadata: Metadata = {
  title: 'Join Session | Split Bill App',
  description: 'Accept an invitation to join a split bill session',
};

export default function AcceptInvitePage({ 
  params, 
  searchParams 
}: { 
  params: { id: string },
  searchParams: { code: string }
}) {
  const inviteCode = searchParams.code;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <AcceptInvitation inviteCode={inviteCode} />
    </div>
  );
}
