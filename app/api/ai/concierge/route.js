import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateConciergeReply } from '@/lib/ai';

export async function POST(request) {
  try {
    const db = getDb();
    const { message, chatHistory } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const reply = await generateConciergeReply({
      userQuery: message.trim(),
      chatHistory: chatHistory || [],
      db,
    });

    if (!reply) {
      return NextResponse.json({
        reply: "I'd be happy to help you discover our curated travel packages! Could you tell me more about your preferred destination, travel dates, or budget?",
      });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Concierge API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
