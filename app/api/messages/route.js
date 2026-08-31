import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { generateAgentAutoReply } from '@/lib/ai';

import { syncMessageToNeon, hydrateFromNeon } from '@/lib/neon-sync';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const uid = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const conversationIdParam = searchParams.get('conversation_id') || searchParams.get('conversationId');

    if (conversationIdParam) {
      const convId = parseInt(conversationIdParam);
      
      // Hydrate from Neon on Vercel to ensure cross-container persistence
      if (process.env.DATABASE_URL) {
        await hydrateFromNeon(db);
      }

      const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
      if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (conv.user_id !== uid && conv.agent_id !== uid && session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const messages = db.prepare(`
        SELECT m.*, u.name as sender_name
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
      `).all(convId);

      // Mark as read
      db.prepare('UPDATE messages SET read = 1 WHERE conversation_id = ? AND sender_id != ?').run(convId, uid);
      return NextResponse.json({ messages });
    }
    return NextResponse.json({ error: 'conversation_id required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { conversation_id, conversationId, content } = await request.json();
    const targetConvId = parseInt(conversation_id || conversationId);
    if (!targetConvId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    if (process.env.DATABASE_URL) {
      await hydrateFromNeon(db);
    }

    const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(targetConvId);
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const uid = parseInt(session.user.id);
    if (conv.user_id !== uid && conv.agent_id !== uid && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const trimmedContent = content.trim();
    const res = db.prepare('INSERT INTO messages (conversation_id, sender_id, content, read) VALUES (?, ?, ?, 0)').run(targetConvId, uid, trimmedContent);
    db.prepare("UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?").run(targetConvId);

    const newMessage = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(res.lastInsertRowid);

    // Sync traveler message to Neon
    if (process.env.DATABASE_URL) {
      await syncMessageToNeon(newMessage, db);
    }

    // AI AUTO-RESPONDER: If the sender is a client/traveler, synchronously generate and commit host reply
    let agentReplyMessage = null;
    const isTravelerSender = uid !== conv.agent_id;
    if (isTravelerSender) {
      try {
        const aiReply = await generateAgentAutoReply({
          conv,
          travelerMessage: trimmedContent,
          travelerName: session.user.name,
          db,
        });

        if (aiReply) {
          const aiRes = db.prepare('INSERT INTO messages (conversation_id, sender_id, content, read) VALUES (?, ?, ?, 0)').run(
            targetConvId,
            conv.agent_id,
            aiReply
          );
          db.prepare("UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?").run(targetConvId);

          agentReplyMessage = db.prepare(`
            SELECT m.*, u.name as sender_name
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
          `).get(aiRes.lastInsertRowid);

          // Sync AI agent message to Neon
          if (process.env.DATABASE_URL) {
            await syncMessageToNeon(agentReplyMessage, db);
          }
        }
      } catch (aiErr) {
        console.warn('AI Auto-reply error:', aiErr.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: newMessage, 
      replyMessage: agentReplyMessage 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
