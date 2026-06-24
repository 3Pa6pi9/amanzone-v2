import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customer, delivery, totalAmount, isNegotiable } = body;

    // 1. Log the Order to Firebase
    const orderStatus = isNegotiable ? "negotiation_requested" : "pending";
    
    const orderRef = await adminDb.collection("orders").add({
      customer: customer || { name: "Guest", phone: "N/A", company: "N/A", tin: "N/A" },
      delivery: delivery || { method: "Store Pickup", address: "N/A" },
      items: items || [],
      total: totalAmount,
      status: orderStatus,
      isNegotiable: isNegotiable || false,
      paymentMethod: isNegotiable ? "manual_contact" : "chapa",
      createdAt: new Date().toISOString(),
    });

    // 2. Branch Logic: Bypass Chapa if Negotiable
    if (isNegotiable) {
      return NextResponse.json({ 
        success: true, 
        message: "Order submitted for negotiation. Our team will contact you shortly.",
        orderId: orderRef.id 
      }, { status: 200 });
    }

    // 3. Initialize Chapa for Standard Purchases
    const chapaPayload = {
      amount: totalAmount.toString(),
      currency: "ETB",
      email: "customer@amanzone.com", 
      first_name: customer?.name?.split(" ")[0] || "AmanZone",
      last_name: customer?.name?.split(" ")[1] || "Client",
      tx_ref: `txn-${orderRef.id}-${Date.now()}`,
      callback_url: `https://your-domain.com/api/chapa/callback`,
      return_url: `http://localhost:3000/success?order=${orderRef.id}`,
      customization: {
        title: "AmanZone", // <--- THE FIX: Shortened to fit Chapa's 16-character limit
        description: `Payment for Order ${orderRef.id}`,
      }
    };

    const chapaResponse = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chapaPayload),
    });

    const chapaData = await chapaResponse.json();

    // 4. Handle Chapa's Response Safely
    if (chapaData.status === "success") {
      return NextResponse.json({ checkoutUrl: chapaData.data.checkout_url }, { status: 200 });
    } else {
      const errorMessage = typeof chapaData.message === 'string' 
        ? chapaData.message 
        : JSON.stringify(chapaData.message || chapaData);
        
      console.error("Chapa Detailed Error:", errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

  } catch (error) {
    console.error("Checkout System Error:", error);
    return NextResponse.json({ error: "Internal server error during checkout." }, { status: 500 });
  }
}