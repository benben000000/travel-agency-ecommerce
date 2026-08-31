import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function GET() {
  try {
    const db = getDb();
    const categories = db.prepare('SELECT * FROM categories ORDER BY type, sort_order').all();
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { name, type, description } = await request.json();
    if (!name || !type) return NextResponse.json({ error: 'Name and type required' }, { status: 400 });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    db.prepare('INSERT INTO categories (name, slug, type, description) VALUES (?, ?, ?, ?)').run(name, slug, type, description || '');
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
