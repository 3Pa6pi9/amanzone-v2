import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate that the cart isn't empty before sending to Firestore
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty or invalid data." }, { status: 400 });
    }

    const orderRef = await adminDb.collection("orders").add({
      items: body.items,
      total: body.total || 0,
      status: "Pending",
      createdAt: new Date().toISOString(),
    });
    
    return NextResponse.json({ success: true, orderId: orderRef.id });
  } catch (error: any) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process checkout" }, { status: 500 });
  }
}
