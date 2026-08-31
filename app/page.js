import { getDb } from '@/lib/db';
import HomeClient from './HomeClient';

export default function HomePage() {
  const db = getDb();
  const featuredPackages = db.prepare(`
    SELECT p.*, u.name as agent_name,
      (SELECT image_url FROM package_images WHERE package_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
      (SELECT AVG(rating) FROM reviews WHERE package_id = p.id) as avg_rating,
      (SELECT COUNT(*) FROM reviews WHERE package_id = p.id) as review_count
    FROM packages p LEFT JOIN users u ON p.agent_id = u.id
    WHERE p.status = 'active'
    ORDER BY p.featured DESC, p.created_at DESC LIMIT 6
  `).all();

  const destinations = db.prepare("SELECT * FROM categories WHERE type = 'destination' ORDER BY sort_order").all();
  const activities = db.prepare("SELECT * FROM categories WHERE type = 'activity' ORDER BY sort_order").all();
  const settings = {};
  db.prepare('SELECT key, value FROM settings').all().forEach(r => { settings[r.key] = r.value; });

  return <HomeClient packages={featuredPackages} destinations={destinations} activities={activities} settings={settings} />;
}
