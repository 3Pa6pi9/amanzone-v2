import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await db.collection("inventory").get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(items);
  } catch (error) {
    console.error("Inventory Fetch Error:", error);
    return NextResponse.json([]); 
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await db.collection("inventory").add({
      ...body,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ id: docRef.id, message: "Product Added" });
  } catch (error) {
    console.error("Failed to add product:", error);
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
  }
}