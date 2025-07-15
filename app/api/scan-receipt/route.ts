import { NextRequest, NextResponse } from 'next/server';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
// Using nanoid instead of uuid
import { nanoid } from 'nanoid';

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
async function performOCR(imageData: string): Promise<ParsedReceipt> {
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
    const fileId = nanoid();
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
    
    // Process with OCR directly without base64 conversion
    // In a real implementation, you would handle this differently
    const parsedReceipt = await performOCR("mock-data-for-demo");
    
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
