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

// UPDATE CONFIGURATIONS & PASSWORDS
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // FEATURE 1: Password Verification & Updates
    if (body.action === "verify" || body.action === "update") {
      const { action, password, newPassword } = body;
      const docRef = adminDb.collection("config").doc("admin");
      const doc = await docRef.get();
      
      const currentRealPassword = doc.exists ? doc.data()?.password : (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "miracle");

      if (action === "verify") {
        if (password === currentRealPassword) {
          return NextResponse.json({ success: true }, { status: 200 });
        }
        return NextResponse.json({ error: "Unauthorized access attempt" }, { status: 401 });
      }

      if (action === "update") {
        if (password !== currentRealPassword) {
          return NextResponse.json({ error: "Current password incorrect" }, { status: 401 });
        }
        if (!newPassword || newPassword.length < 4) {
          return NextResponse.json({ error: "New password must be at least 4 characters" }, { status: 400 });
        }
        await docRef.set({ password: newPassword }, { merge: true });
        return NextResponse.json({ success: true, message: "Password updated securely" }, { status: 200 });
      }
    }

    // FEATURE 2: Global Settings Updates (Theme, Deliveries, etc.)
    // If no specific password 'action' is passed, treat it as a settings update
    delete body.action; // Ensure we don't accidentally save an 'action' field to the database
    
    await adminDb.collection("settings").doc("global").set(body, { merge: true });
    return NextResponse.json({ success: true, message: "Settings updated successfully" });

  } catch (error: any) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ error: error.message || "Server error occurred" }, { status: 500 });
  }
}