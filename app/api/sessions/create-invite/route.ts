import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';

// Create an invitation link for a session
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { sessionId, userId, expiresInHours = 24 } = body;
    
    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }
    
    // Validate expiry time
    const hours = parseInt(expiresInHours);
    if (isNaN(hours) || hours <= 0 || hours > 168) { // Max 7 days (168 hours)
      return NextResponse.json(
        { error: 'Invalid expiry time. Must be between 1 and 168 hours.' },
        { status: 400 }
      );
    }
    
    // Get the session
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    const sessionData = sessionSnap.data();
    
    // Check if user is an active participant in the session
    const isParticipant = sessionData.participants && sessionData.participants.some(
      (p: any) => p.id === userId && p.status === 'active'
    );
    
    // Check if user is the creator
    const isCreator = sessionData.createdBy === userId;
    
    if (!isParticipant && !isCreator) {
      return NextResponse.json(
        { error: 'You are not authorized to create invitations for this session' },
        { status: 403 }
      );
    }
    
    // Generate a unique invitation code
    const code = nanoid(10); // 10 character unique code
    
    // Calculate expiry time
    const expiresAt = Date.now() + (hours * 60 * 60 * 1000);
    
    // Create the invitation
    const invitation = {
      code,
      createdAt: Date.now(),
      expiresAt,
      createdBy: userId,
      used: false
    };
    
    // Add the invitation to the session
    await updateDoc(sessionRef, {
      invitations: arrayUnion(invitation),
      updatedAt: serverTimestamp()
    });
    
    // Generate invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://patungan.app';
    const inviteUrl = `${baseUrl}/sessions/join?code=${code}`;
    
    // Return the invitation code
    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      url: inviteUrl
    });
    
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
