import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;

    let pkg;
    if (isNaN(id)) {
      pkg = db.prepare(`
        SELECT p.*, u.name as agent_name, u.email as agent_email, u.company_name as agent_company, u.phone as agent_phone
        FROM packages p LEFT JOIN users u ON p.agent_id = u.id
        WHERE p.slug = ?
      `).get(id);
    } else {
      pkg = db.prepare(`
        SELECT p.*, u.name as agent_name, u.email as agent_email, u.company_name as agent_company, u.phone as agent_phone
        FROM packages p LEFT JOIN users u ON p.agent_id = u.id
        WHERE p.id = ?
      `).get(parseInt(id));
    }

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const images = db.prepare('SELECT * FROM package_images WHERE package_id = ? ORDER BY sort_order').all(pkg.id);
    const itinerary = db.prepare('SELECT * FROM itinerary_days WHERE package_id = ? ORDER BY day_number').all(pkg.id);
    const dates = db.prepare("SELECT * FROM package_dates WHERE package_id = ? AND status = 'available' ORDER BY start_date").all(pkg.id);
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.package_id = ? ORDER BY r.created_at DESC
    `).all(pkg.id);

    const avgRating = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE package_id = ?').get(pkg.id);

    return NextResponse.json({
      ...pkg,
      images,
      itinerary,
      dates,
      reviews,
      avg_rating: avgRating.avg || 0,
      review_count: avgRating.count || 0
    });
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
    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(parseInt(id));
    if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (session.user.role === 'agent' && pkg.agent_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fields = [];
    const values = [];

    const updateable = ['title', 'description', 'short_description', 'destination', 'country', 'region',
      'category', 'activity_type', 'duration_days', 'duration_nights', 'max_guests',
      'price_amount', 'price_currency', 'price_per', 'cancellation_days',
      'inclusions', 'exclusions', 'highlights', 'meeting_point',
      'difficulty_level', 'min_age', 'status', 'featured'];

    for (const field of updateable) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(parseInt(id));
      db.prepare(`UPDATE packages SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    // Update itinerary
    if (body.itinerary && Array.isArray(body.itinerary)) {
      db.prepare('DELETE FROM itinerary_days WHERE package_id = ?').run(parseInt(id));
      const insertDay = db.prepare(`
        INSERT INTO itinerary_days (package_id, day_number, title, description, meals, accommodation, activities)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const day of body.itinerary) {
        insertDay.run(parseInt(id), day.day_number, day.title, day.description || '', day.meals || '', day.accommodation || '', day.activities || '');
      }
    }

    // Update images
    if (body.images && Array.isArray(body.images)) {
      db.prepare('DELETE FROM package_images WHERE package_id = ?').run(parseInt(id));
      const insertImg = db.prepare(`
        INSERT INTO package_images (package_id, image_url, alt_text, is_primary, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      body.images.forEach((img, idx) => {
        insertImg.run(parseInt(id), img.image_url, img.alt_text || '', idx === 0 ? 1 : 0, idx);
      });
    }

    // Update dates
    if (body.dates && Array.isArray(body.dates)) {
      db.prepare('DELETE FROM package_dates WHERE package_id = ?').run(parseInt(id));
      const insertDate = db.prepare(`
        INSERT INTO package_dates (package_id, start_date, end_date, available_slots, price_override)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const d of body.dates) {
        insertDate.run(parseInt(id), d.start_date, d.end_date || '', d.available_slots || 10, d.price_override || null);
      }
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
    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(parseInt(id));
    if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (session.user.role !== 'admin' && pkg.agent_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare("UPDATE packages SET status = 'archived' WHERE id = ?").run(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
