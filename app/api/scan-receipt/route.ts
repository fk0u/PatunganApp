import { NextRequest, NextResponse } from 'next/server';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
}

interface ParsedReceipt {
  merchant: string;
  date: string;
  total: number;
  items: ReceiptItem[];
}

// This is a mock OCR function. In a real implementation, 
// you would use a third-party OCR service like Google Cloud Vision or Azure Computer Vision
async function performOCR(imageBase64: string): Promise<ParsedReceipt> {
  // In a real implementation, you would send the image to an OCR service
  // and parse the response into a structured format
  
  // For demo purposes, we'll return mock data
  return {
    merchant: "Sample Restaurant",
    date: new Date().toISOString(),
    total: 120000,
    items: [
      { name: "Nasi Goreng", price: 25000, quantity: 2 },
      { name: "Es Teh Manis", price: 10000, quantity: 2 },
      { name: "Ayam Goreng", price: 30000, quantity: 1 },
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('receipt') as File;
    const sessionId = formData.get('sessionId') as string;
    
    if (!file || !sessionId) {
      return NextResponse.json(
        { error: 'Missing receipt image or session ID' },
        { status: 400 }
      );
    }
    
    // Upload image to Firebase Storage
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `receipts/${sessionId}/${fileId}.${fileExtension}`;
    const storageRef = ref(storage, fileName);
    
    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    
    // Upload to Firebase Storage
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });
    
    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Convert file to base64 for OCR processing
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Process with OCR
    const parsedReceipt = await performOCR(base64);
    
    // Return processed data
    return NextResponse.json({
      success: true,
      receipt: {
        ...parsedReceipt,
        imageUrl: downloadUrl,
      }
    });
    
  } catch (error) {
    console.error('Error processing receipt:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    );
  }
}
