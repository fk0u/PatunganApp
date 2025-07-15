import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, runTransaction, serverTimestamp } from 'firebase/firestore';

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
  joinedAt?: number;
}

interface Session {
  id: string;
  name: string;
  description: string;
  participants: Participant[];
  invitations: Invitation[];
  [key: string]: any; // For any other properties
}

export async function POST(request: NextRequest) {
  try {
    // Get the invitation code and user's information from request body
    const body = await request.json();
    const { code, userId, name } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Missing invitation code' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Missing participant name' },
        { status: 400 }
      );
    }
    
    // Find session with this invite code
    const sessionsRef = doc(db, 'sessions');
    const sessionsSnapshot = await getDoc(sessionsRef);
    
    if (!sessionsSnapshot.exists()) {
      return NextResponse.json(
        { error: 'No sessions found' },
        { status: 404 }
      );
    }
    
    // Get all sessions and find the one with matching invitation code
    const sessions = sessionsSnapshot.data() as Record<string, any>;
    
    let sessionId = null;
    let sessionData = null;
    let invitationIndex = -1;
    
    // Search through sessions for the invitation
    for (const [id, session] of Object.entries(sessions)) {
      if (session.invitations) {
        const index = session.invitations.findIndex(
          (inv: Invitation) => inv.code === code && !inv.used
        );
        
        if (index !== -1) {
          sessionId = id;
          sessionData = session;
          invitationIndex = index;
          break;
        }
      }
    }
    
    if (!sessionId || invitationIndex === -1) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation code' },
        { status: 404 }
      );
    }
    
    // Check if invitation has expired
    const invitation = sessionData.invitations[invitationIndex];
    if (invitation.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }
    
    // Check if user is already a participant
    const existingParticipantIndex = sessionData.participants.findIndex(
      (p: Participant) => p.id === userId
    );
    
    // Update session data
    if (existingParticipantIndex !== -1) {
      // If user is already a participant but was removed, reactivate them
      if (sessionData.participants[existingParticipantIndex].status === 'removed') {
        sessionData.participants[existingParticipantIndex].status = 'active';
        sessionData.participants[existingParticipantIndex].name = name; // Update name if it changed
        sessionData.participants[existingParticipantIndex].joinedAt = Date.now();
      }
      // If active, don't change anything
    } else {
      // Add user as a new participant
      const newParticipant: Participant = {
        id: userId,
        name: name,
        status: 'active',
        joinedAt: Date.now()
      };
      
      sessionData.participants.push(newParticipant);
    }
    
    // Mark invitation as used
    sessionData.invitations[invitationIndex].used = true;
    
    // Update session in database
    await updateDoc(sessionsRef, {
      [`${sessionId}.participants`]: sessionData.participants,
      [`${sessionId}.invitations`]: sessionData.invitations,
      [`${sessionId}.updatedAt`]: serverTimestamp()
    });
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Successfully joined session',
      session: { id: sessionId }
    });
    
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
