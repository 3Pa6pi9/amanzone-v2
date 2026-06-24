import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Order Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch active orders." }, { status: 500 });
  }
}