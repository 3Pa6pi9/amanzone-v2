import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// UPDATE A PRODUCT (Edit)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js requires awaiting params in dynamic routes
    const { id } = await params;
    const body = await request.json();
    
    await adminDb.collection("products").doc(id).update({
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error: any) {
    console.error("Inventory PUT API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

// REMOVE A PRODUCT (Delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js requires awaiting params in dynamic routes
    const { id } = await params;
    
    await adminDb.collection("products").doc(id).delete();
    
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Inventory DELETE API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
