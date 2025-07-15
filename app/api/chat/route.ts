import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Handle different request formats
    let message = ""
    let sessionId = ""
    let groupId = ""
    
    if (body.messages) {
      // Standard chat format
      const { messages } = body as {
        messages: { role: "user" | "assistant"; content: string }[]
      }
      
      // Get the last user message
      const lastUserMessage = [...messages].reverse().find(m => m.role === "user")
      message = lastUserMessage?.content || ""
    } else if (body.message) {
      // Split bill format
      message = body.message
      sessionId = body.sessionId || ""
      groupId = body.groupId || ""
    }

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }

    const GEMINI_KEY =
      process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!GEMINI_KEY) {
      return Response.json({ error: "Gemini API key tidak ditemukan di environment." }, { status: 500 })
    }

    // Get context from the session or group if provided
    let context = ''
    if (sessionId) {
      try {
        const sessionRef = doc(db, 'sessions', sessionId)
        const sessionDoc = await getDoc(sessionRef)
        
        if (sessionDoc.exists()) {
          const session = sessionDoc.data()
          
          // Build context about the session
          context = `
            This is a split bill session named "${session.name}".
            ${session.description ? `Description: ${session.description}` : ''}
            Total amount: $${session.totalAmount.toFixed(2)}
            Number of participants: ${session.participants.length}
            Number of expense items: ${session.expenseItems.length}
            Status: ${session.isSettled ? 'Settled' : 'Active'}
            
            Participants:
            ${session.participants.map((p: any) => `- ${p.name} (${p.email || 'No email'})`).join('\n')}
            
            ${session.expenseItems.length > 0 ? `
            Expense items:
            ${session.expenseItems.map((item: any) => {
              const payer = session.participants.find((p: any) => p.id === item.paidBy);
              return `- ${item.name}: $${(item.amount * item.quantity).toFixed(2)}, paid by ${payer?.name || 'Unknown'}`;
            }).join('\n')}
            ` : 'No expense items yet.'}
          `
        }
      } catch (error) {
        console.error('Error fetching session data:', error)
      }
    } else if (groupId) {
      try {
        const groupRef = doc(db, 'groups', groupId)
        const groupDoc = await getDoc(groupRef)
        
        if (groupDoc.exists()) {
          const group = groupDoc.data()
          
          // Build context about the group
          context = `
            This is a group named "${group.name}".
            ${group.description ? `Description: ${group.description}` : ''}
            Number of members: ${group.members.length}
            
            Members:
            ${group.members.map((m: any) => `- ${m.name} (${m.role})`).join('\n')}
          `
        }
      } catch (error) {
        console.error('Error fetching group data:', error)
      }
    }

    // Construct the enhanced prompt with context if available
    const enhancedPrompt = context ? `
      You are a helpful assistant for a split bill app. 
      Your role is to help users with questions about their split bills, expenses, and transactions.
      
      Context about the current conversation:
      ${context}
      
      User message: ${message}
      
      Please provide a helpful, conversational response. You can:
      1. Explain how to use the split bill app
      2. Help calculate how much each person owes
      3. Suggest how to settle expenses fairly
      4. Provide tips on managing group expenses
      5. Answer questions about the current session or group
      
      Keep your response concise, friendly, and helpful.
    ` : message

    const { text } = await generateText({
      model: google("gemini-2.5-flash", {
        apiKey: GEMINI_KEY,
      }),
      prompt: enhancedPrompt,
    })

    return Response.json({ response: text, text: text })
  } catch (error) {
    console.error("Error in AI chat API:", error)
    return Response.json({ error: "Failed to generate AI response." }, { status: 500 })
  }
}
