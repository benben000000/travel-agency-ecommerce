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
    let conversations;
    if (session.user.role === 'admin') {
      conversations = db.prepare(`
        SELECT c.*, u.name as user_name, a.name as agent_name,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND read = 0 AND sender_id != ?) as unread_count
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users a ON c.agent_id = a.id
        ORDER BY c.last_message_at DESC
      `).all(uid);
    } else if (session.user.role === 'agent') {
      conversations = db.prepare(`
        SELECT c.*, u.name as user_name, a.name as agent_name,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND read = 0 AND sender_id != ?) as unread_count
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users a ON c.agent_id = a.id
        WHERE c.agent_id = ?
        ORDER BY c.last_message_at DESC
      `).all(uid, uid);
    } else {
      conversations = db.prepare(`
        SELECT c.*, u.name as user_name, a.name as agent_name,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND read = 0 AND sender_id != ?) as unread_count
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users a ON c.agent_id = a.id
        WHERE c.user_id = ?
        ORDER BY c.last_message_at DESC
      `).all(uid, uid);
    }
    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { agent_id, booking_id } = await request.json();
    if (!agent_id) return NextResponse.json({ error: 'agent_id required' }, { status: 400 });

    const uid = parseInt(session.user.id);
    const agentIdInt = parseInt(agent_id);

    // Check if conversation already exists
    let conv;
    if (booking_id) {
      conv = db.prepare('SELECT * FROM conversations WHERE user_id = ? AND agent_id = ? AND booking_id = ?').get(uid, agentIdInt, parseInt(booking_id));
    } else {
      conv = db.prepare('SELECT * FROM conversations WHERE user_id = ? AND agent_id = ? AND booking_id IS NULL').get(uid, agentIdInt);
    }

    if (conv) {
      return NextResponse.json({ conversation_id: conv.id });
    }

    const result = db.prepare('INSERT INTO conversations (user_id, agent_id, booking_id) VALUES (?, ?, ?)').run(uid, agentIdInt, booking_id || null);
    return NextResponse.json({ conversation_id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
