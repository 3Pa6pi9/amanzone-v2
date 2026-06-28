import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Material ID required." }, { status: 400 });
    }

    await adminDb.collection("inventory").doc(id).delete();

    return NextResponse.json({ success: true, message: "Material purged successfully." });
  } catch (error: any) {
    console.error("Database DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete material from pipeline." }, { status: 500 });
  }
}