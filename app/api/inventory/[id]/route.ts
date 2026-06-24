import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

<<<<<<< HEAD
// Next.js 15+ strict parameter typing
export async function DELETE(
=======
// UPDATE A PRODUCT (Edit)
export async function PUT(
>>>>>>> 897b8485f2b00d59be677144965edc371517a93f
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
<<<<<<< HEAD
    // We must await the params object now
    const { id } = await params;
    
    await adminDb.collection("inventory").doc(id).delete();
    
    return NextResponse.json({ message: "Material successfully removed from catalog." }, { status: 200 });
  } catch (error) {
    console.error("Deletion Error:", error);
    return NextResponse.json({ error: "Failed to remove item." }, { status: 500 });
=======
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
>>>>>>> 897b8485f2b00d59be677144965edc371517a93f
  }
}
