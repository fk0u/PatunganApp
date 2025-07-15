import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// Process a session invitation
export async function POST(request: NextRequest) {
  try {
    const { inviteCode, userId, displayName, avatarUrl } = await request.json();
    
    if (!inviteCode || !userId) {
      return NextResponse.json(
        { error: 'Missing inviteCode or userId' },
        { status: 400 }
      );
    }
    
    // Find session with this invite code
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('invitations', 'array-contains', { code: inviteCode, used: false })
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Try a different approach since Firebase array-contains with complex objects can be tricky
      // Get all sessions
      const allSessionsQuery = query(sessionsRef);
      const allSessionsSnapshot = await getDocs(allSessionsQuery);
      
      let matchingSession = null;
      let matchingInvitation = null;
      
      // Manually find the session with the matching invitation code
      for (const sessionDoc of allSessionsSnapshot.docs) {
        const sessionData = sessionDoc.data();
        if (sessionData.invitations) {
          const invitation = sessionData.invitations.find(
            (inv) => inv.code === inviteCode && !inv.used
          );
          
          if (invitation) {
            matchingSession = sessionDoc;
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
      
      const sessionId = matchingSession.id;
      const sessionData = matchingSession.data();
      
      // Check if user is already a participant
      const isExistingParticipant = sessionData.participants.some(
        (p) => p.userId === userId
      );
      
      if (isExistingParticipant) {
        return NextResponse.json({
          success: true,
          sessionId,
          message: 'You are already a participant in this session'
        });
      }
      
      // Add user as participant
      const participant = {
        userId,
        displayName: displayName || 'Guest',
        avatarUrl: avatarUrl || null,
        status: 'active'
      };
      
      // Update session with new participant
      const sessionRef = doc(db, 'sessions', sessionId);
      
      await updateDoc(sessionRef, {
        participants: arrayUnion(participant),
        updatedAt: Date.now()
      });
      
      // Mark invitation as used
      const updatedInvitations = [...sessionData.invitations];
      const invitationIndex = updatedInvitations.findIndex(
        (inv) => inv.code === inviteCode
      );
      
      updatedInvitations[invitationIndex] = {
        ...updatedInvitations[invitationIndex],
        used: true,
        usedBy: userId,
        usedAt: Date.now()
      };
      
      await updateDoc(sessionRef, {
        invitations: updatedInvitations
      });
      
      return NextResponse.json({
        success: true,
        sessionId,
        message: 'Successfully joined session'
      });
    }
    
    // If we find a session using the query
    const sessionDoc = querySnapshot.docs[0];
    const sessionId = sessionDoc.id;
    const sessionData = sessionDoc.data();
    
    // Check if user is already a participant
    const isExistingParticipant = sessionData.participants.some(
      (p) => p.userId === userId
    );
    
    if (isExistingParticipant) {
      return NextResponse.json({
        success: true,
        sessionId,
        message: 'You are already a participant in this session'
      });
    }
    
    // Add user as participant
    const participant = {
      userId,
      displayName: displayName || 'Guest',
      avatarUrl: avatarUrl || null,
      status: 'active'
    };
    
    // Update session with new participant
    const sessionRef = doc(db, 'sessions', sessionId);
    
    await updateDoc(sessionRef, {
      participants: arrayUnion(participant),
      updatedAt: Date.now()
    });
    
    // Find and mark invitation as used
    const invitation = sessionData.invitations.find(
      (inv) => inv.code === inviteCode
    );
    
    if (invitation) {
      const updatedInvitations = [...sessionData.invitations];
      const invitationIndex = updatedInvitations.findIndex(
        (inv) => inv.code === inviteCode
      );
      
      updatedInvitations[invitationIndex] = {
        ...updatedInvitations[invitationIndex],
        used: true,
        usedBy: userId,
        usedAt: Date.now()
      };
      
      await updateDoc(sessionRef, {
        invitations: updatedInvitations
      });
    }
    
    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Successfully joined session'
    });
    
  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json(
      { error: 'Failed to process invitation' },
      { status: 500 }
    );
  }
}
