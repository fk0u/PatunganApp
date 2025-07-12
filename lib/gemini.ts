import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCgJ0lm3IusFVcMcjW_y8Aub65bragGr0c")

export async function processReceiptWithGemini(imageFile: File) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    // Convert file to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64String = Buffer.from(arrayBuffer).toString("base64")

    const prompt = `Analyze this Indonesian receipt image and extract all information in the following JSON format. Be very precise with numbers and text recognition. For item names, try to clean up any strange codes or abbreviations and get the actual product name if possible. Also, include the quantity for each item.

{
  "restaurant_info": {
    "name": "string",
    "address": "string",
    "phone": "string",
    "date": "YYYY-MM-DD",
    "time": "HH:MM"
  },
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit_price": number,
      "total_price": number,
      "category_guess": "food|drink|dessert|appetizer|main_course|other",
      "sharing_potential": 0.0-1.0,
      "description": "string"
    }
  ],
  "summary": {
    "subtotal": number,
    "tax": number,
    "ppn": number, // Added PPN
    "service_charge": number,
    "discount": number, // Added Discount
    "points_redeemed": number, // Added Points Redeemed
    "total": number
  },
  "payment_info": {
    "method": "string",
    "card_last_digits": "string"
  }
}

Important notes:
- sharing_potential: 1.0 = easily shareable (pizza, appetizers), 0.0 = personal item (individual drinks). If unsure, default to 0.5.
- Extract ALL text visible on receipt.
- Convert all prices to numbers (remove currency symbols and dots/commas).
- If information is unclear or not found, use null for string fields and 0 for number fields.
- Detect Indonesian Rupiah (IDR) format.
- Be very accurate with numbers and calculations.
- Return ONLY the JSON, no additional text.
- For item names, if there are codes like "P001" or "SKU123", try to infer the actual product name. For example, "P001 TEH BOTOL" should become "Teh Botol".
- Ensure 'quantity' is always a number, defaulting to 1 if not explicitly found.
`

    const imagePart = {
      inlineData: {
        data: base64String,
        mimeType: imageFile.type,
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    // Clean the response to extract only JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response")
    }

    const receiptData = JSON.parse(jsonMatch[0])
    return receiptData
  } catch (error) {
    console.error("Error processing receipt with Gemini:", error)
    throw new Error("Failed to process receipt. Please try again.")
  }
}
