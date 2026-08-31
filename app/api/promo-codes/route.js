import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    let codes;
    if (session.user.role === 'admin') {
      codes = db.prepare('SELECT pc.*, u.name as agent_name FROM promo_codes pc LEFT JOIN users u ON pc.agent_id = u.id ORDER BY pc.created_at DESC').all();
    } else {
      codes = db.prepare('SELECT * FROM promo_codes WHERE agent_id = ? ORDER BY created_at DESC').all(parseInt(session.user.id));
    }
    return NextResponse.json({ promo_codes: codes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'agent' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = getDb();
    const { code, discount_type, discount_value, min_order_amount, max_uses, valid_from, valid_to } = await request.json();
    if (!code || !discount_type || !discount_value) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const existing = db.prepare('SELECT id FROM promo_codes WHERE code = ?').get(code.toUpperCase());
    if (existing) return NextResponse.json({ error: 'Code already exists' }, { status: 409 });

    db.prepare('INSERT INTO promo_codes (agent_id, code, discount_type, discount_value, min_order_amount, max_uses, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(parseInt(session.user.id), code.toUpperCase(), discount_type, parseInt(discount_value), min_order_amount || 0, max_uses || 0, valid_from || null, valid_to || null);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
