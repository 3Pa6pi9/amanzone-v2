import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      items, customerName, companyName, tinNumber, phone, 
      totalAmount, requireVat, deliveryType, region, subCity, specificAddress 
    } = body;

    if (!items || items.length === 0) return NextResponse.json({ error: "Cart empty" }, { status: 400 });

    const sanitizedPhone = phone.replace(/[^\d+]/g, ""); 
    const finalAmount = requireVat ? totalAmount * 1.15 : totalAmount;
    
    const names = (customerName || "Guest Client").split(" ");
    const firstName = names[0].substring(0, 10);
    const lastName = (names.slice(1).join(" ") || "User").substring(0, 10);

    const title = "AmanZone"; 
    const desc = requireVat ? `VAT-TIN-${tinNumber.replace(/\D/g, '')}` : "Standard-Checkout";

    const origin = req.headers.get("origin") || "https://amanzone-trading.com";
    const tx_ref = `AZ-${Date.now().toString().slice(-8)}`;

    const chapaPayload = {
      amount: finalAmount.toFixed(2),
      currency: "ETB",
      email: "sales@amanzone.com",
      first_name: firstName,
      last_name: lastName,
      phone_number: sanitizedPhone,
      tx_ref: tx_ref,
      callback_url: `${origin}/api/verify-payment?tx_ref=${tx_ref}`,
      return_url: `${origin}/success?tx_ref=${tx_ref}`,
      customization: { title, description: desc },
    };

    const chapaRes = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(chapaPayload),
    });

    const chapaData = await chapaRes.json();
    
    if (chapaData.status !== "success") {
      console.error("Chapa API Rejection:", chapaData);
      return NextResponse.json({ error: "Payment Gateway Initialization Failed", details: chapaData.message }, { status: 400 });
    }

    await adminDb.collection("orders").doc(tx_ref).set({
      tx_ref, customerName, companyName, tinNumber, phone: sanitizedPhone,
      items, subtotal: totalAmount, finalAmount, deliveryType,
      logistics: deliveryType === "Delivery" ? { region, subCity, specificAddress } : "Pickup",
      status: "pending_payment", createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ checkoutUrl: chapaData.data.checkout_url });
  } catch (error: any) {
    console.error("System Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}