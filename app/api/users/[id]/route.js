import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { id } = await params;
    const user = db.prepare('SELECT id, email, name, role, phone, company_name, bio, avatar_url, is_active, created_at FROM users WHERE id = ?').get(parseInt(id));
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { id } = await params;
    const uid = parseInt(id);
    const body = await request.json();

    if (session.user.role !== 'admin' && parseInt(session.user.id) !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fields = [];
    const values = [];
    if (body.name) { fields.push('name = ?'); values.push(body.name); }
    if (body.phone !== undefined) { fields.push('phone = ?'); values.push(body.phone); }
    if (body.company_name !== undefined) { fields.push('company_name = ?'); values.push(body.company_name); }
    if (body.bio !== undefined) { fields.push('bio = ?'); values.push(body.bio); }
    if (body.is_active !== undefined && session.user.role === 'admin') { fields.push('is_active = ?'); values.push(body.is_active); }
    if (body.role && session.user.role === 'admin') { fields.push('role = ?'); values.push(body.role); }
    if (body.password) { fields.push('password_hash = ?'); values.push(bcrypt.hashSync(body.password, 10)); }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(uid);
      db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { id } = await params;
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
