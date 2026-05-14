import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

// DELETE A PRODUCT
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await adminDb.collection("inventory").doc(params.id).delete();
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

// UPDATE A PRODUCT
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    await adminDb.collection("inventory").doc(params.id).update(body);
    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}