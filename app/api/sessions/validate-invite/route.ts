import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Validate an invitation code without joining
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Missing invitation code' },
        { status: 400 }
      );
    }
    
    // Find session with this invite code
    const sessionsRef = collection(db, 'sessions');
    const allSessionsQuery = query(sessionsRef);
    const allSessionsSnapshot = await getDocs(allSessionsQuery);
    
    let matchingSession = null;
    let matchingInvitation = null;
    
    // Manually find the session with the matching invitation code
    for (const sessionDoc of allSessionsSnapshot.docs) {
      const sessionData = sessionDoc.data();
      if (sessionData.invitations) {
        const invitation = sessionData.invitations.find(
          (inv) => inv.code === code && !inv.used
        );
        
        if (invitation) {
          matchingSession = {
            id: sessionDoc.id,
            ...sessionData
          };
          matchingInvitation = invitation;
          break;
        }
      }
    }
    
    if (!matchingSession) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation code' },
        { status: 404 }
      );
    }
    
    // Check if invitation has expired
    if (matchingInvitation.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }
    
    // Return session information (limited)
    return NextResponse.json({
      success: true,
      session: {
        id: matchingSession.id,
        name: matchingSession.name,
        description: matchingSession.description,
        participantCount: matchingSession.participants.filter(p => p.status === 'active').length
      }
    });
    
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}
