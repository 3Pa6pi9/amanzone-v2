import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// FETCH GLOBAL CONFIGURATIONS
export async function GET() {
  try {
    const doc = await adminDb.collection("settings").doc("global").get();
    
    if (doc.exists) {
      return NextResponse.json(doc.data());
    } else {
      // Fallback defaults if the document hasn't been created yet
      return NextResponse.json({ theme: "dark", allowDeliveries: true });
    }
  } catch (error: any) {
    console.error("Settings GET API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

// UPDATE GLOBAL CONFIGURATIONS
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Using { merge: true } prevents overwriting unspecified fields
    await adminDb.collection("settings").doc("global").set(body, { merge: true });
    
    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error: any) {
    console.error("Settings POST API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
