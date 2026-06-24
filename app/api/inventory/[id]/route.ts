import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Next.js 15+ strict parameter typing
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // We must await the params object now
    const { id } = await params;
    
    await adminDb.collection("inventory").doc(id).delete();
    
    return NextResponse.json({ message: "Material successfully removed from catalog." }, { status: 200 });
  } catch (error) {
    console.error("Deletion Error:", error);
    return NextResponse.json({ error: "Failed to remove item." }, { status: 500 });
  }
}