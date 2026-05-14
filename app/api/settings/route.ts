import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { action, password, newPassword } = await request.json();

    // Look for a saved password in the database
    const docRef = db.collection("config").doc("admin");
    const doc = await docRef.get();
    
    // If no password is in the DB yet, fallback to your .env.local password ("miracle")
    const currentRealPassword = doc.exists ? doc.data()?.password : (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "miracle");

    // Action 1: Logging in
    if (action === "verify") {
      if (password === currentRealPassword) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Action 2: Changing the password from the UI
    if (action === "update") {
      if (password !== currentRealPassword) {
        return NextResponse.json({ error: "Current password incorrect" }, { status: 401 });
      }
      // Save the new password to Firestore
      await docRef.set({ password: newPassword }, { merge: true });
      return NextResponse.json({ success: true, message: "Password updated securely" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}