import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const data = callbackQuery.data; 
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;

      let newStatus = '';
      let orderId = '';

      if (data.startsWith('process_')) {
        newStatus = 'processing';
        orderId = data.replace('process_', '');
      } else if (data.startsWith('dispatch_')) {
        newStatus = 'dispatched';
        orderId = data.replace('dispatch_', '');
      }

      if (newStatus && orderId) {
        // 1. Update the order status in Firestore
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });

        const botToken = "8901674777:AAFJU1bLmXWXY2E0Ozgx2CY-zdgwW4jt6pw";
        
        // 2. Acknowledge the callback so the button stops loading in Telegram
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: `Order marked as ${newStatus}!`,
          }),
        });

        // 3. Edit the original Telegram message to reflect the new status and remove buttons
        await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: callbackQuery.message.text + `\n\n✅ *UPDATE:* Pipeline moved to ${newStatus.toUpperCase()}`,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [] } 
          }),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
