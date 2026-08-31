import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const destination = searchParams.get('destination') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const duration = searchParams.get('duration') || '';
    const sort = searchParams.get('sort') || 'featured';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const agentId = searchParams.get('agentId') || searchParams.get('agent_id') || '';
    const status = searchParams.get('status') || '';
    const featured = searchParams.get('featured') || '';
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    if (!status) {
      where.push("p.status = 'active'");
    } else if (status !== 'all') {
      where.push('p.status = ?');
      params.push(status);
    }

    if (search) {
      where.push('(p.title LIKE ? OR p.destination LIKE ? OR p.country LIKE ? OR p.description LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (category) {
      where.push('(p.category = ? OR p.activity_type = ?)');
      params.push(category, category);
    }
    if (destination) {
      where.push('(p.region = ? OR p.destination LIKE ?)');
      params.push(destination, `%${destination}%`);
    }
    if (minPrice) {
      where.push('p.price_amount >= ?');
      params.push(parseInt(minPrice) * 100);
    }
    if (maxPrice) {
      where.push('p.price_amount <= ?');
      params.push(parseInt(maxPrice) * 100);
    }
    if (duration) {
      where.push('p.duration_days <= ?');
      params.push(parseInt(duration));
    }
    if (agentId) {
      where.push('p.agent_id = ?');
      params.push(parseInt(agentId));
    }
    if (featured) {
      where.push('p.featured = 1');
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM packages p ${whereClause}`).get(...params);
    const total = countRow ? countRow.total : 0;

    let orderBy = 'p.featured DESC, p.created_at DESC';
    if (sort === 'price_asc') {
      orderBy = 'p.price_amount ASC, p.featured DESC';
    } else if (sort === 'price_desc') {
      orderBy = 'p.price_amount DESC, p.featured DESC';
    } else if (sort === 'duration_asc') {
      orderBy = 'p.duration_days ASC';
    } else if (sort === 'duration_desc') {
      orderBy = 'p.duration_days DESC';
    } else if (sort === 'rating') {
      orderBy = 'avg_rating DESC, p.featured DESC';
    } else if (sort === 'newest') {
      orderBy = 'p.created_at DESC';
    }

    const packages = db.prepare(`
      SELECT p.*, u.name as agent_name, u.company_name as agent_company,
        (SELECT image_url FROM package_images WHERE package_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT AVG(rating) FROM reviews WHERE package_id = p.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE package_id = p.id) as review_count
      FROM packages p
      LEFT JOIN users u ON p.agent_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return NextResponse.json({
      packages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('GET /api/packages error:', error);
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
    const body = await request.json();

    const {
      title, slug, description, short_description, destination, country, region,
      category, activity_type, duration_days, duration_nights, max_guests,
      price_amount, price_currency = 'USD', price_per = 'person',
      cancellation_days = 7, inclusions, exclusions, highlights,
      meeting_point, difficulty_level = 'easy', min_age = 0,
      status = 'active', featured = 0,
      itinerary = [], images = [], dates = []
    } = body;

    if (!title || !destination || !price_amount) {
      return NextResponse.json({ error: 'Title, destination, and price are required' }, { status: 400 });
    }

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = db.prepare('SELECT id FROM packages WHERE slug = ?').get(finalSlug);
    if (existing) {
      return NextResponse.json({ error: 'A package with this slug already exists' }, { status: 400 });
    }

    const agent_id = session.user.role === 'admin' && body.agent_id ? body.agent_id : session.user.id;

    const insertPkg = db.prepare(`
      INSERT INTO packages (
        agent_id, title, slug, description, short_description, destination, country, region,
        category, activity_type, duration_days, duration_nights, max_guests,
        price_amount, price_currency, price_per, cancellation_days,
        inclusions, exclusions, highlights, meeting_point, difficulty_level, min_age,
        status, featured
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    const result = insertPkg.run(
      agent_id, title, finalSlug, description, short_description, destination, country, region,
      category, activity_type, duration_days, duration_nights, max_guests,
      price_amount, price_currency, price_per, cancellation_days,
      inclusions, exclusions, highlights, meeting_point, difficulty_level, min_age,
      status, featured
    );

    const packageId = result.lastInsertRowid;

    if (itinerary && itinerary.length) {
      const insertDay = db.prepare(`
        INSERT INTO itinerary_days (package_id, day_number, title, description, meals, accommodation, activities)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const day of itinerary) {
        insertDay.run(packageId, day.day_number, day.title, day.description || null, day.meals || null, day.accommodation || null, day.activities || null);
      }
    }

    if (images && images.length) {
      const insertImg = db.prepare(`
        INSERT INTO package_images (package_id, image_url, alt_text, is_primary, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        insertImg.run(packageId, img.image_url, img.alt_text || null, img.is_primary || (i === 0 ? 1 : 0), i);
      }
    }

    if (dates && dates.length) {
      const insertDate = db.prepare(`
        INSERT INTO package_dates (package_id, start_date, end_date, available_slots, booked_slots, price_override)
        VALUES (?, ?, ?, ?, 0, ?)
      `);
      for (const d of dates) {
        insertDate.run(packageId, d.start_date, d.end_date || null, d.available_slots || max_guests, d.price_override || null);
      }
    }

    return NextResponse.json({ success: true, package_id: packageId, slug: finalSlug }, { status: 201 });
  } catch (error) {
    console.error('POST /api/packages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
