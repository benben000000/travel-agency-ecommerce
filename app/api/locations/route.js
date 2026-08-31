import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase() || '';

    let sql = `
      SELECT 
        p.destination,
        p.country,
        COUNT(p.id) as package_count,
        (SELECT image_url FROM package_images WHERE package_id = p.id AND is_primary = 1 LIMIT 1) as thumbnail
      FROM packages p
      WHERE p.status = 'active'
    `;

    const params = [];
    if (query) {
      sql += ` AND (LOWER(p.destination) LIKE ? OR LOWER(p.country) LIKE ? OR LOWER(p.title) LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    sql += `
      GROUP BY p.destination, p.country
      ORDER BY package_count DESC, p.destination ASC
      LIMIT 30
    `;

    const locations = db.prepare(sql).all(...params);

    // Also extract simple clean city names
    const formatted = locations.map((loc) => {
      const parts = loc.destination.split(',');
      const city = parts[0]?.trim();
      const country = loc.country || parts[1]?.trim() || '';
      return {
        label: loc.destination,
        city,
        country,
        package_count: loc.package_count,
        thumbnail: loc.thumbnail,
      };
    });

    return NextResponse.json({ locations: formatted });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
