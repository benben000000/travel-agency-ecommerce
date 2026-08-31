import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get('packageId');
    if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 });
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.package_id = ? ORDER BY r.created_at DESC
    `).all(parseInt(packageId));
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { package_id, booking_id, rating, comment } = await request.json();
    if (!package_id || !booking_id || !rating) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status IN ('confirmed', 'completed')").get(parseInt(booking_id), parseInt(session.user.id));
    if (!booking) return NextResponse.json({ error: 'Invalid booking' }, { status: 400 });

    const existing = db.prepare('SELECT id FROM reviews WHERE booking_id = ?').get(parseInt(booking_id));
    if (existing) return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });

    db.prepare('INSERT INTO reviews (user_id, package_id, booking_id, rating, comment) VALUES (?, ?, ?, ?, ?)')
      .run(parseInt(session.user.id), parseInt(package_id), parseInt(booking_id), rating, comment || '');

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
