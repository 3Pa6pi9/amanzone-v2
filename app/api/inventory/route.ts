import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// FETCH ALL PRODUCTS FOR CATALOG
export async function GET() {
<<<<<<< HEAD
  const snapshot = await adminDb.collection("inventory").get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(data);
=======
  try {
    const snapshot = await adminDb.collection("products").orderBy("createdAt", "desc").get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Inventory GET API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch inventory" }, { status: 500 });
  }
>>>>>>> 897b8485f2b00d59be677144965edc371517a93f
}

// DEPLOY NEW PRODUCT TO DATABASE
export async function POST(request: Request) {
  try {
    const body = await request.json();
<<<<<<< HEAD
    const docRef = await adminDb.collection("inventory").add({
      ...body,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
=======
    
    if (!body.title || !body.price) {
       return NextResponse.json({ error: "Missing required fields (title, price)." }, { status: 400 });
    }

    const productRef = await adminDb.collection("products").add({
      ...body,
      createdAt: new Date().toISOString(),
    });
    
    return NextResponse.json({ id: productRef.id, ...body }, { status: 201 });
  } catch (error: any) {
    console.error("Inventory POST API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to add product" }, { status: 500 });
>>>>>>> 897b8485f2b00d59be677144965edc371517a93f
  }
}
