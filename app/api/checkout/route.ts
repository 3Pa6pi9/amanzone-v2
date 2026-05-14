import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

// This is Chapa's official initialization endpoint
const CHAPA_URL = "https://api.chapa.co/v1/transaction/initialize";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. First, save the order to Firebase with a "PENDING_PAYMENT" status
    const docRef = await adminDb.collection("orders").add({
      ...body,
      createdAt: new Date().toISOString(),
      status: "PENDING_PAYMENT"
    });

    // 2. Format the data perfectly for Chapa
    // Chapa requires a unique transaction reference (tx_ref) for every single payment
    const tx_ref = `amz-${docRef.id}-${Date.now()}`;

    const chapaPayload = {
      amount: body.total.toString(),
      currency: "ETB",
      email: "finance@amanzone.com", // You can use a generic email if the client doesn't provide one
      first_name: body.client.name.split(" ")[0] || "AmanZone",
      last_name: body.client.name.split(" ")[1] || "Client",
      phone_number: body.client.phone,
      tx_ref: tx_ref,
      callback_url: `https://your-live-website.com/api/payment-webhook`,
      return_url: `http://localhost:3000/?payment=success`, // Where they go after paying
      customization: {
        title: "AmanZone Trading PLC",
        description: "Payment for Construction Materials",
        logo: "https://your-logo-url-here.png" // We can update this once you upload your logo
      }
    };

    // 3. Send the request to Chapa
    const chapaResponse = await fetch(CHAPA_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(chapaPayload)
    });

    const chapaData = await chapaResponse.json();

    if (chapaData.status === "success") {
      // 4. Return the secure checkout link to the Client UI
      return NextResponse.json({ checkoutUrl: chapaData.data.checkout_url });
    } else {
      console.error("Chapa Error:", chapaData);
      return NextResponse.json({ error: chapaData.message || "Failed to initialize payment" }, { status: 400 });
    }

  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}