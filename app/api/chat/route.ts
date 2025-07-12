import { generateText } from "ai"
import { google } from "@ai-sdk/google" // Import google from @ai-sdk/google

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[]
    }

    // Flatten the chat history into a single prompt
    // e.g. "User: ...\nAssistant: ...\nUser: ..."
    const prompt =
      messages.map((m) => (m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`)).join("\n") +
      "\nAssistant:" // let the model know it should answer next

    const GEMINI_KEY =
      process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!GEMINI_KEY) {
      return Response.json({ error: "Gemini API key tidak ditemukan di environment." }, { status: 500 })
    }

    const { text } = await generateText({
      model: google("gemini-2.5-flash", {
        // Menggunakan gemini-2.5-flash
        apiKey: GEMINI_KEY,
      }),
      prompt,
    })

    return Response.json({ response: text })
  } catch (error) {
    console.error("Error in AI chat API:", error)
    return Response.json({ error: "Failed to generate AI response." }, { status: 500 })
  }
}
