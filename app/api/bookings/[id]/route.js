import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { sendEmail, bookingThankYouEmail } from '@/lib/email';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { id } = await params;

    const booking = db.prepare(`
      SELECT b.*, p.title as package_title, p.slug as package_slug, p.destination as package_destination,
        p.duration_days, p.duration_nights, p.meeting_point, p.inclusions, p.exclusions,
        p.cancellation_days, p.price_per,
        u.name as user_name, u.email as user_email, u.phone as user_phone,
        a.name as agent_name, a.company_name as agent_company, a.email as agent_email, a.phone as agent_phone,
        pd.start_date, pd.end_date
      FROM bookings b
      LEFT JOIN packages p ON b.package_id = p.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN users a ON b.agent_id = a.id
      LEFT JOIN package_dates pd ON b.package_date_id = pd.id
      WHERE b.id = ? OR b.booking_ref = ?
    `).get(parseInt(id) || 0, id);

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // Check permission
    const uid = parseInt(session.user.id);
    const isAdmin = session.user.role === 'admin';
    const isUser = session.user.role === 'user' && booking.user_id === uid;
    const isAgent = session.user.role === 'agent' && booking.agent_id === uid;

    if (!isAdmin && !isUser && !isAgent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ booking, ...booking });
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
    const body = await request.json();

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? OR booking_ref = ?').get(parseInt(id) || 0, id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const uid = parseInt(session.user.id);
    const isAgent = session.user.role === 'agent' && booking.agent_id === uid;
    const isAdmin = session.user.role === 'admin';
    const isUser = session.user.role === 'user' && booking.user_id === uid;

    if (!isAgent && !isAdmin && !isUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (body.status) {
      db.prepare("UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(body.status, booking.id);

      // Send thank you email when confirmed
      if (body.status === 'confirmed') {
        const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(booking.package_id);
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(booking.user_id);
        const html = bookingThankYouEmail(booking, pkg, user);
        await sendEmail(booking.contact_email, `Booking Confirmed - ${booking.booking_ref}`, html);
      }

      // Handle cancellation
      if (body.status === 'cancelled' && body.cancellation_reason) {
        db.prepare("UPDATE bookings SET cancellation_reason = ? WHERE id = ?").run(body.cancellation_reason, booking.id);
        if (booking.package_date_id) {
          db.prepare('UPDATE package_dates SET booked_slots = MAX(0, booked_slots - ?) WHERE id = ?').run(booking.guests_count, booking.package_date_id);
        }
      }
    }

    if (body.payment_status) {
      db.prepare("UPDATE bookings SET payment_status = ?, updated_at = datetime('now') WHERE id = ?").run(body.payment_status, booking.id);
    }

    if (process.env.DATABASE_URL) {
      try {
        const { syncBookingToNeon } = await import('@/lib/neon-sync');
        const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id);
        if (updatedBooking) {
          await syncBookingToNeon(updatedBooking);
        }
      } catch (syncErr) {
        console.warn('Failed to sync updated booking to Neon:', syncErr.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
