import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { nanoid } from 'nanoid';

// Create an invitation link for a session
export async function POST(request: NextRequest) {
  try {
    const { sessionId, creatorId } = await request.json();
    
    if (!sessionId || !creatorId) {
      return NextResponse.json(
        { error: 'Missing sessionId or creatorId' },
        { status: 400 }
      );
    }
    
    // Get the session
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    const session = sessionDoc.data();
    
    // Check if user is authorized (creator)
    if (session.createdBy !== creatorId) {
      return NextResponse.json(
        { error: 'Not authorized to create invitation link' },
        { status: 403 }
      );
    }
    
    // Generate invitation code
    const inviteCode = nanoid(10);
    
    // Create expiry date (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    
    // Add invitation to session
    const invitation = {
      code: inviteCode,
      createdAt: Date.now(),
      expiresAt: expiryDate.getTime(),
      createdBy: creatorId,
      used: false
    };
    
    // Update session with invitation
    await updateDoc(sessionRef, {
      invitations: arrayUnion(invitation),
      updatedAt: Date.now()
    });
    
    // Return success with invite code
    return NextResponse.json({
      success: true,
      invitation: {
        code: inviteCode,
        expiresAt: expiryDate.getTime(),
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://patungan.app'}/invite/${inviteCode}`
      }
    });
    
  } catch (error) {
    console.error('Error creating invitation link:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation link' },
      { status: 500 }
    );
  }
}
