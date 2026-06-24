import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { action, password, newPassword } = await request.json();

    // FIXED: Changed 'db' to 'adminDb' to match your import
    const docRef = adminDb.collection("config").doc("admin");
    const doc = await docRef.get();
    
    // Fallback to .env.local password if database is empty
    const currentRealPassword = doc.exists ? doc.data()?.password : (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "miracle");

    // Action 1: Verification / Login
    if (action === "verify") {
      if (password === currentRealPassword) {
        return NextResponse.json({ success: true }, { status: 200 });
      }
      return NextResponse.json({ error: "Unauthorized access attempt" }, { status: 401 });
    }

    // Action 2: Update Password
    if (action === "update") {
      if (password !== currentRealPassword) {
        return NextResponse.json({ error: "Current password incorrect" }, { status: 401 });
      }

      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json({ error: "New password must be at least 4 characters" }, { status: 400 });
      }

      // Save the new password to Firestore
      await docRef.set({ password: newPassword }, { merge: true });
      return NextResponse.json({ success: true, message: "Password updated securely" }, { status: 200 });
    }

    // Fallback for unknown actions
    return NextResponse.json({ error: "Invalid action requested" }, { status: 400 });

  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ error: "Server error occurred" }, { status: 500 });
  }
}