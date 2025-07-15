import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Get the session ID from the query params
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('id')
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    // Here you would typically validate the session ID against your database
    // For demo purposes, we'll consider any session ID valid with a mock delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // In a real app, you would check if the session exists and is valid
    // For demo, we'll return a mock session object
    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
        title: "Makan Bareng di Resto ABC",
        description: "Makan malam tanggal 15 Juli 2025",
        createdAt: new Date().toISOString(),
        totalAmount: 350000,
        merchantName: "Resto ABC",
        items: [
          { id: "1", name: "Nasi Goreng", price: 50000, quantity: 2, participants: ["user1", "user2"] },
          { id: "2", name: "Es Teh", price: 15000, quantity: 3, participants: ["user1", "user2", "user3"] },
          { id: "3", name: "Ayam Bakar", price: 65000, quantity: 2, participants: ["user2", "user3"] },
        ],
        participants: [
          { id: "user1", name: "Andi", joined: true },
          { id: "user2", name: "Budi", joined: true },
          { id: "user3", name: "Citra", joined: false }
        ]
      }
    })
  } catch (error) {
    console.error('Error validating session:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, participantName } = body
    
    if (!sessionId || !participantName) {
      return NextResponse.json(
        { success: false, error: 'Session ID and participant name are required' },
        { status: 400 }
      )
    }
    
    // In a real app, you would add the participant to the session
    // For demo, we'll return success
    return NextResponse.json({
      success: true,
      participantId: `user${Date.now()}`,
      message: `Added ${participantName} to session ${sessionId}`
    })
  } catch (error) {
    console.error('Error joining session:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}
