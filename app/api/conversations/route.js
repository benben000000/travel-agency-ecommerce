import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

import { syncConversationToNeon, hydrateFromNeon } from '@/lib/neon-sync';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    
    if (process.env.DATABASE_URL) {
      await hydrateFromNeon(db);
    }

    const uid = parseInt(session.user.id);
    let conversations;
    if (session.user.role === 'admin') {
      conversations = db.prepare(`
        SELECT c.*, u.name as user_name, a.name as agent_name, a.company_name as agent_company,
        p.title as package_title,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND read = 0 AND sender_id != ?) as unread_count
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users a ON c.agent_id = a.id
        LEFT JOIN bookings b ON c.booking_id = b.id
        LEFT JOIN packages p ON b.package_id = p.id
        ORDER BY c.last_message_at DESC
      `).all(uid);
    } else if (session.user.role === 'agent') {
      conversations = db.prepare(`
        SELECT c.*, u.name as user_name, a.name as agent_name, a.company_name as agent_company,
        p.title as package_title,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND read = 0 AND sender_id != ?) as unread_count
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users a ON c.agent_id = a.id
        LEFT JOIN bookings b ON c.booking_id = b.id
        LEFT JOIN packages p ON b.package_id = p.id
        WHERE c.agent_id = ?
        ORDER BY c.last_message_at DESC
      `).all(uid, uid);
    } else {
      conversations = db.prepare(`
        SELECT c.*, u.name as user_name, a.name as agent_name, a.company_name as agent_company,
        p.title as package_title,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND read = 0 AND sender_id != ?) as unread_count
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users a ON c.agent_id = a.id
        LEFT JOIN bookings b ON c.booking_id = b.id
        LEFT JOIN packages p ON b.package_id = p.id
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
    const body = await request.json();
    const uid = parseInt(session.user.id);
    
    if (process.env.DATABASE_URL) {
      await hydrateFromNeon(db);
    }

    let userId;
    let agentId;
    
    if (session.user.role === 'agent') {
      agentId = uid;
      userId = parseInt(body.user_id || body.userId);
    } else {
      userId = uid;
      agentId = parseInt(body.agent_id || body.agentId);
    }
    
    if (!userId || !agentId) {
      return NextResponse.json({ error: 'Both user_id and agent_id are required' }, { status: 400 });
    }

    let conv = db.prepare('SELECT * FROM conversations WHERE user_id = ? AND agent_id = ?').get(userId, agentId);
    if (!conv) {
      const res = db.prepare('INSERT INTO conversations (user_id, agent_id, booking_id) VALUES (?, ?, ?)').run(userId, agentId, body.booking_id || null);
      conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(res.lastInsertRowid);
    } else if (body.booking_id && !conv.booking_id) {
      db.prepare('UPDATE conversations SET booking_id = ? WHERE id = ?').run(body.booking_id, conv.id);
      conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conv.id);
    }

    if (process.env.DATABASE_URL && conv) {
      await syncConversationToNeon(conv);
    }

    return NextResponse.json({ conversation: conv }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
