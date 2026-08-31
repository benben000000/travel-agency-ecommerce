import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase() || '';

    let matchingPackages = [];
    let matchingDestinations = [];
    let matchingCategories = [];

    if (!query) {
      // Return top featured packages
      matchingPackages = db.prepare(`
        SELECT 
          p.id, p.title, p.slug, p.destination, p.country, p.price_amount, p.duration_days,
          (SELECT image_url FROM package_images WHERE package_id = p.id AND is_primary = 1 LIMIT 1) as thumbnail,
          (SELECT AVG(rating) FROM reviews WHERE package_id = p.id) as avg_rating
        FROM packages p
        WHERE p.status = 'active'
        ORDER BY p.featured DESC, p.created_at DESC
        LIMIT 6
      `).all();

      // Return top destinations
      matchingDestinations = db.prepare(`
        SELECT 
          p.destination,
          p.country,
          COUNT(p.id) as package_count,
          (SELECT image_url FROM package_images WHERE package_id = p.id AND is_primary = 1 LIMIT 1) as thumbnail
        FROM packages p
        WHERE p.status = 'active'
        GROUP BY p.destination, p.country
        ORDER BY package_count DESC, p.destination ASC
        LIMIT 6
      `).all();

      // Return popular categories
      matchingCategories = db.prepare(`
        SELECT name, slug, type, description
        FROM categories
        WHERE type = 'category' OR type = 'activity'
        LIMIT 4
      `).all();
    } else {
      const qWildcard = `%${query}%`;

      // 1. Search Packages by Title, Destination, Country, Description, Category, Activity Type
      matchingPackages = db.prepare(`
        SELECT 
          p.id, p.title, p.slug, p.destination, p.country, p.price_amount, p.duration_days,
          (SELECT image_url FROM package_images WHERE package_id = p.id AND is_primary = 1 LIMIT 1) as thumbnail,
          (SELECT AVG(rating) FROM reviews WHERE package_id = p.id) as avg_rating
        FROM packages p
        WHERE p.status = 'active' AND (
          LOWER(p.title) LIKE LOWER(?) OR 
          LOWER(p.destination) LIKE LOWER(?) OR 
          LOWER(p.country) LIKE LOWER(?) OR 
          LOWER(p.description) LIKE LOWER(?) OR
          LOWER(p.category) LIKE LOWER(?) OR
          LOWER(p.activity_type) LIKE LOWER(?)
        )
        ORDER BY p.featured DESC, p.title ASC
        LIMIT 8
      `).all(qWildcard, qWildcard, qWildcard, qWildcard, qWildcard, qWildcard);

      // 2. Search Destinations
      matchingDestinations = db.prepare(`
        SELECT 
          p.destination,
          p.country,
          COUNT(p.id) as package_count,
          (SELECT image_url FROM package_images WHERE package_id = p.id AND is_primary = 1 LIMIT 1) as thumbnail
        FROM packages p
        WHERE p.status = 'active' AND (
          LOWER(p.destination) LIKE LOWER(?) OR 
          LOWER(p.country) LIKE LOWER(?)
        )
        GROUP BY p.destination, p.country
        ORDER BY package_count DESC, p.destination ASC
        LIMIT 5
      `).all(qWildcard, qWildcard);

      // 3. Search Categories & Activities
      matchingCategories = db.prepare(`
        SELECT name, slug, type, description
        FROM categories
        WHERE LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?)
        LIMIT 3
      `).all(qWildcard, qWildcard);
    }

    const formattedDestinations = matchingDestinations.map((loc) => {
      const parts = loc.destination.split(',');
      const city = parts[0]?.trim();
      const country = loc.country || parts[1]?.trim() || '';
      return {
        type: 'destination',
        label: loc.destination,
        city,
        country,
        package_count: loc.package_count,
        thumbnail: loc.thumbnail,
      };
    });

    const formattedPackages = matchingPackages.map((pkg) => ({
      type: 'package',
      id: pkg.id,
      title: pkg.title,
      slug: pkg.slug,
      destination: pkg.destination,
      country: pkg.country,
      price: pkg.price_amount ? (pkg.price_amount / 100).toFixed(0) : '0',
      duration: pkg.duration_days,
      thumbnail: pkg.thumbnail || '/images/placeholder-travel.jpg',
      rating: pkg.avg_rating ? Math.round(pkg.avg_rating) : null,
    }));

    const formattedCategories = matchingCategories.map((cat) => ({
      type: 'category',
      name: cat.name,
      slug: cat.slug,
      categoryType: cat.type,
      description: cat.description,
    }));

    return NextResponse.json({
      packages: formattedPackages,
      destinations: formattedDestinations,
      categories: formattedCategories,
      // Legacy backwards-compatible locations array
      locations: formattedDestinations,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
