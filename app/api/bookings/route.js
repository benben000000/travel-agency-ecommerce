import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail, bookingConfirmationEmail, agentBookingAlertEmail } from '@/lib/email';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    if (session.user.role === 'user') {
      where.push('b.user_id = ?');
      params.push(parseInt(session.user.id));
    } else if (session.user.role === 'agent') {
      where.push('b.agent_id = ?');
      params.push(parseInt(session.user.id));
    }

    if (status) {
      where.push('b.status = ?');
      params.push(status);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const total = db.prepare(`SELECT COUNT(*) as c FROM bookings b ${whereClause}`).get(...params).c;

    const bookings = db.prepare(`
      SELECT b.*, p.title as package_title, p.slug as package_slug, p.destination,
        u.name as user_name, u.email as user_email,
        a.name as agent_name
      FROM bookings b
      LEFT JOIN packages p ON b.package_id = p.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN users a ON b.agent_id = a.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return NextResponse.json({ bookings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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
    const { package_id, package_date_id, guests_count, guest_names, contact_email, contact_phone, special_requests, payment_method, promo_code } = body;

    if (!package_id || !guests_count || !contact_email) {
      return NextResponse.json({ error: 'Package, guests count, and contact email are required' }, { status: 400 });
    }

    const pkg = db.prepare('SELECT * FROM packages WHERE id = ? AND status = ?').get(parseInt(package_id), 'active');
    if (!pkg) return NextResponse.json({ error: 'Package not found or not active' }, { status: 404 });

    // Check date availability
    if (package_date_id) {
      const dateSlot = db.prepare('SELECT * FROM package_dates WHERE id = ? AND package_id = ?').get(parseInt(package_date_id), pkg.id);
      if (!dateSlot) return NextResponse.json({ error: 'Date not found' }, { status: 404 });
      if (dateSlot.available_slots - dateSlot.booked_slots < guests_count) {
        return NextResponse.json({ error: 'Not enough available slots' }, { status: 400 });
      }
    }

    let totalAmount = pkg.price_amount * guests_count;
    let discountAmount = 0;
    let promoCodeId = null;

    // Validate promo code
    if (promo_code) {
      const code = db.prepare(`
        SELECT * FROM promo_codes WHERE code = ? AND active = 1 AND agent_id = ?
        AND (valid_from IS NULL OR valid_from <= datetime('now'))
        AND (valid_to IS NULL OR valid_to >= datetime('now'))
        AND (max_uses = 0 OR used_count < max_uses)
      `).get(promo_code, pkg.agent_id);
      if (code) {
        promoCodeId = code.id;
        if (code.discount_type === 'percentage') {
          discountAmount = Math.floor(totalAmount * code.discount_value / 100);
        } else {
          discountAmount = code.discount_value;
        }
        totalAmount = Math.max(0, totalAmount - discountAmount);
        db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?').run(code.id);
      }
    }

    const bookingRef = 'GOT-' + uuidv4().substring(0, 8).toUpperCase();
    const userId = parseInt(session.user.id);

    const result = db.prepare(`
      INSERT INTO bookings (booking_ref, user_id, package_id, package_date_id, agent_id,
        guests_count, guest_names, contact_email, contact_phone,
        total_amount, currency, promo_code_id, discount_amount,
        status, payment_status, payment_method, special_requests)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'paid', ?, ?)
    `).run(
      bookingRef, userId, pkg.id, package_date_id || null, pkg.agent_id,
      guests_count, guest_names || '', contact_email, contact_phone || '',
      totalAmount, pkg.price_currency || 'USD', promoCodeId, discountAmount,
      payment_method || 'card', special_requests || ''
    );

    // Update booked slots
    if (package_date_id) {
      db.prepare('UPDATE package_dates SET booked_slots = booked_slots + ? WHERE id = ?').run(guests_count, parseInt(package_date_id));
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(Number(result.lastInsertRowid));
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const agent = db.prepare('SELECT * FROM users WHERE id = ?').get(pkg.agent_id);

    // Send confirmation email to user
    const confirmHtml = bookingConfirmationEmail(booking, pkg, user);
    await sendEmail(contact_email, `Booking Confirmation - ${bookingRef}`, confirmHtml);

    // Send alert to agent
    const alertHtml = agentBookingAlertEmail(booking, pkg, user, agent);
    await sendEmail(agent.email, `New Booking - ${bookingRef}`, alertHtml);

    return NextResponse.json({ booking_ref: bookingRef, id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
