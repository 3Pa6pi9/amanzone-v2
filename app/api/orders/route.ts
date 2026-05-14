import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Orders Fetch Error:", error);
    return NextResponse.json([]); 
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await db.collection("orders").add({
      ...body,
      createdAt: new Date().toISOString(),
      status: "PENDING"
    });
    return NextResponse.json({ id: docRef.id, message: "Order placed" });
  } catch (error) {
    console.error("Failed to place order:", error);
    return NextResponse.json({ error: "Order failed" }, { status: 500 });
  }
}