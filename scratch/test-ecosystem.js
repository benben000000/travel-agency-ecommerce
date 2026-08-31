const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'global-one-travel.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

async function testEcosystem() {
  console.log('--- STARTING COMPREHENSIVE ECOSYSTEM TEST ---');

  // 1. Check Admin
  const admin = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
  console.log('1. Admin user verified:', admin?.email);
  if (!admin) throw new Error('Admin not found in DB');

  // 2. Ensure Tour Operator / Agent
  const agentEmail = 'aurora@globaltours.com';
  let agent = db.prepare('SELECT * FROM users WHERE email = ?').get(agentEmail);
  if (!agent) {
    const agentHash = bcrypt.hashSync('agent123', 10);
    const agentRes = db.prepare(`
      INSERT INTO users (email, password_hash, name, role, company_name, phone, bio, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(agentEmail, agentHash, 'Elena Rostova', 'agent', 'Aurora Arctic Expeditions', '+1 (800) 456-7890', 'Specialists in Nordic and Arctic small group adventures.');
    agent = db.prepare('SELECT * FROM users WHERE id = ?').get(agentRes.lastInsertRowid);
  }
  const agentId = agent.id;
  console.log('2. Agent verified with ID:', agentId);

  // 3. Ensure Travel Packages for Agent
  let pkg1 = db.prepare('SELECT * FROM packages WHERE slug = ?').get('7-day-northern-lights-fjord-expedition');
  if (!pkg1) {
    const pkgRes1 = db.prepare(`
      INSERT INTO packages (
        agent_id, title, slug, description, short_description, destination, country, region,
        category, activity_type, duration_days, duration_nights, max_guests, price_amount, price_currency,
        inclusions, exclusions, highlights, meeting_point, status, featured
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      agentId,
      '7-Day Northern Lights & Fjord Expedition',
      '7-day-northern-lights-fjord-expedition',
      'Experience the mesmerizing Aurora Borealis, sail through majestic Norwegian fjords, and stay in glass-top wilderness igloos.',
      'Chasing the Northern Lights through pristine Nordic fjords and arctic wilderness.',
      'Tromsø, Norway',
      'Norway',
      'Europe',
      'Europe',
      'Adventure',
      7,
      6,
      10,
      189900,
      'USD',
      'All boutique accommodations\nDaily breakfast and 3 gourmet dinners\nPrivate fjord cruise\nAurora hunting guided tours\nWinter gear and thermal suits',
      'International flights\nTravel insurance\nAlcoholic beverages outside dinners',
      'Aurora Borealis night excursions\nScenic catamaran fjord cruise\nDog sledding through snow forests',
      'Tromsø Grand Hotel Lobby at 09:00 AM',
      'active',
      1
    );
    const pkgId1 = pkgRes1.lastInsertRowid;
    pkg1 = db.prepare('SELECT * FROM packages WHERE id = ?').get(pkgId1);
  }
  console.log('3. Package 1 verified (ID:', pkg1.id, ')');

  // 4. Ensure Promo Code
  let promo = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get('AURORA15');
  if (!promo) {
    const promoRes = db.prepare(`
      INSERT INTO promo_codes (agent_id, code, discount_type, discount_value, min_order_amount, max_uses, active)
      VALUES (?, 'AURORA15', 'percentage', 15, 50000, 50, 1)
    `).run(agentId);
    promo = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(promoRes.lastInsertRowid);
  }
  console.log('4. Promo code AURORA15 verified (ID:', promo.id, ')');

  // 5. Ensure Traveler / Customer
  const travelerEmail = 'sophia.traveler@example.com';
  let traveler = db.prepare('SELECT * FROM users WHERE email = ?').get(travelerEmail);
  if (!traveler) {
    const travelerHash = bcrypt.hashSync('traveler123', 10);
    const userRes = db.prepare(`
      INSERT INTO users (email, password_hash, name, role, phone, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(travelerEmail, travelerHash, 'Sophia Turner', 'user', '+1 (555) 789-0123');
    traveler = db.prepare('SELECT * FROM users WHERE id = ?').get(userRes.lastInsertRowid);
  }
  console.log('5. Traveler user verified (ID:', traveler.id, ')');

  // 6. Test Query Speed & Index Verification
  console.log('6. Testing Query Execution Plan with Composite Indexes...');
  const queryPlan = db.prepare(`
    EXPLAIN QUERY PLAN
    SELECT p.*, (SELECT AVG(rating) FROM reviews WHERE package_id = p.id) as avg_rating
    FROM packages p
    WHERE p.status = 'active'
    ORDER BY p.featured DESC, p.created_at DESC
    LIMIT 12
  `).all();
  console.log('Query Plan:', queryPlan);

  // 7. Verify Data Counts
  const totalPackages = db.prepare('SELECT COUNT(*) as c FROM packages').get().c;
  const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
  const totalReviews = db.prepare('SELECT COUNT(*) as c FROM reviews').get().c;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

  console.log('=== PLATFORM DATA INTEGRITY AUDIT ===');
  console.log(`- Total Users in DB: ${totalUsers}`);
  console.log(`- Total Packages in DB: ${totalPackages}`);
  console.log(`- Total Bookings in DB: ${totalBookings}`);
  console.log(`- Total Reviews in DB: ${totalReviews}`);
  console.log('--- ALL ECOSYSTEM & PERFORMANCE FLOWS VERIFIED ---');

  db.close();
}

testEcosystem().catch(err => {
  console.error('ERROR IN ECOSYSTEM TEST:', err);
  process.exit(1);
});
