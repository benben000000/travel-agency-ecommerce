import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const uid = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(parseInt(conversationId));
      if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (conv.user_id !== uid && conv.agent_id !== uid && session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const messages = db.prepare('SELECT m.*, u.name as sender_name FROM messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? ORDER BY m.created_at ASC').all(parseInt(conversationId));
      // Mark as read
      db.prepare('UPDATE messages SET read = 1 WHERE conversation_id = ? AND sender_id != ?').run(parseInt(conversationId), uid);
      return NextResponse.json({ messages });
    }
    return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { conversation_id, content } = await request.json();
    if (!conversation_id || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(parseInt(conversation_id));
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const uid = parseInt(session.user.id);
    if (conv.user_id !== uid && conv.agent_id !== uid && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)').run(parseInt(conversation_id), uid, content);
    db.prepare("UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?").run(parseInt(conversation_id));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
