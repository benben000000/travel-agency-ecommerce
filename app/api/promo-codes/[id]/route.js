import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const code = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(parseInt(id));
    if (!code) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.user.role !== 'admin' && code.agent_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (body.active !== undefined) {
      db.prepare('UPDATE promo_codes SET active = ? WHERE id = ?').run(body.active ? 1 : 0, parseInt(id));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { id } = await params;
    const code = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(parseInt(id));
    if (!code) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.user.role !== 'admin' && code.agent_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    db.prepare('DELETE FROM promo_codes WHERE id = ?').run(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
