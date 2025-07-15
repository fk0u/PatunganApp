import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';

// Define interfaces for our types
interface Invitation {
  code: string;
  used: boolean;
  expiresAt: number;
  createdAt: number;
}

interface Participant {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'removed';
}

interface Session {
  id: string;
  name: string;
  description: string;
  participants: Participant[];
  invitations: Invitation[];
  [key: string]: any; // For any other properties
}

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
    
    // Find session with this invite code - using a more efficient query if possible
    const sessionsRef = collection(db, 'sessions');
    
    // Try a compound query (requires an index to be set up in Firestore)
    // This query searches for sessions with an invitation that has the specified code and is not used
    const q = query(
      sessionsRef,
      where('invitations.code', '==', code),
      where('invitations.used', '==', false)
    );
    
    try {
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Found session with matching invitation
        const sessionDoc = querySnapshot.docs[0];
        const sessionData = sessionDoc.data() as DocumentData;
        
        // Find the specific invitation
        const invitation = sessionData.invitations.find(
          (inv: Invitation) => inv.code === code && !inv.used
        );
        
        // Check if invitation has expired
        if (invitation && invitation.expiresAt < Date.now()) {
          return NextResponse.json(
            { error: 'Invitation has expired' },
            { status: 400 }
          );
        }
        
        // Return session information (limited)
        return NextResponse.json({
          success: true,
          session: {
            id: sessionDoc.id,
            name: sessionData.name,
            description: sessionData.description,
            participantCount: sessionData.participants?.filter((p: Participant) => p.status === 'active').length || 0
          }
        });
      }
    } catch (indexError) {
      // If compound query fails (index not set up), fall back to manual search
      console.log('Compound query failed, falling back to manual search:', indexError);
    }
    
    // Fallback: Manual search through all sessions
    const allSessionsQuery = query(sessionsRef);
    const allSessionsSnapshot = await getDocs(allSessionsQuery);
    
    let matchingSession: Session | null = null;
    let matchingInvitation: Invitation | null = null;
    
    // Manually find the session with the matching invitation code
    for (const sessionDoc of allSessionsSnapshot.docs) {
      const sessionData = sessionDoc.data() as DocumentData;
      if (sessionData.invitations) {
        const invitation = sessionData.invitations.find(
          (inv: Invitation) => inv.code === code && !inv.used
        );
        
        if (invitation) {
          matchingSession = {
            id: sessionDoc.id,
            ...sessionData as any
          } as Session;
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
    if (matchingInvitation && matchingInvitation.expiresAt < Date.now()) {
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
        participantCount: matchingSession.participants?.filter((p: Participant) => p.status === 'active').length || 0
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
