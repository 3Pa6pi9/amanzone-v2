import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("inventory").orderBy("createdAt", "desc").get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, price, menu, submenu, type, color, metric, description, imageUrl } = body;

    if (!title || !price || !menu) {
      return NextResponse.json({ error: "Missing critical material specifications." }, { status: 400 });
    }

    const newItem = {
      title,
      price: parseFloat(price),
      menu,
      submenu: submenu || "",
      type: type || "",
      color: color || "",
      metric: metric || "",
      description: description || "",
      imageUrl: imageUrl || "", // Added Image Support
      createdAt: new Date().toISOString(),
      inStock: true
    };

    const docRef = await adminDb.collection("inventory").add(newItem);
    return NextResponse.json({ success: true, id: docRef.id, ...newItem });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to deploy material." }, { status: 500 });
  }
}