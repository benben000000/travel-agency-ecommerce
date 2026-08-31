const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'data', 'global-one-travel.db');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'agent', 'user')),
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    company_name TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('destination', 'activity')),
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    destination TEXT,
    country TEXT,
    region TEXT,
    category TEXT,
    activity_type TEXT,
    duration_days INTEGER DEFAULT 1,
    duration_nights INTEGER DEFAULT 0,
    max_guests INTEGER DEFAULT 10,
    price_amount INTEGER NOT NULL,
    price_currency TEXT DEFAULT 'USD',
    price_per TEXT DEFAULT 'person',
    cancellation_days INTEGER DEFAULT 7,
    inclusions TEXT,
    exclusions TEXT,
    highlights TEXT,
    meeting_point TEXT,
    difficulty_level TEXT DEFAULT 'easy',
    min_age INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'rejected', 'archived')),
    featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (agent_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS itinerary_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    meals TEXT,
    accommodation TEXT,
    activities TEXT,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS package_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS package_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    available_slots INTEGER DEFAULT 10,
    booked_slots INTEGER DEFAULT 0,
    price_override INTEGER,
    status TEXT DEFAULT 'available' CHECK(status IN ('available', 'sold_out', 'cancelled')),
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_ref TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    package_date_id INTEGER,
    agent_id INTEGER NOT NULL,
    guests_count INTEGER DEFAULT 1,
    guest_names TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    total_amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    promo_code_id INTEGER,
    discount_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded')),
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_method TEXT,
    special_requests TEXT,
    cancellation_reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (package_id) REFERENCES packages(id),
    FOREIGN KEY (agent_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    booking_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (package_id) REFERENCES packages(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
    discount_value INTEGER NOT NULL,
    min_order_amount INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 0,
    used_count INTEGER DEFAULT 0,
    valid_from TEXT,
    valid_to TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (agent_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    booking_id INTEGER,
    last_message_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (agent_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_packages_agent ON packages(agent_id);
  CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
  CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
  CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_agent ON bookings(agent_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_ref);
  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_package ON reviews(package_id);
`);

// Seed admin account
const adminEmail = 'admin@global1onetravel.com';
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existing) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (email, password_hash, name, role, bio, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(adminEmail, hash, 'Platform Admin', 'admin', 'Global One Travel platform administrator', 1);
  console.log('Admin account created: admin@global1onetravel.com / admin123');
}

// Seed default categories
const categories = [
  { name: 'Asia', slug: 'asia', type: 'destination', description: 'Explore the diverse cultures and landscapes of Asia', sort_order: 1 },
  { name: 'Europe', slug: 'europe', type: 'destination', description: 'Discover the rich history and beauty of Europe', sort_order: 2 },
  { name: 'Americas', slug: 'americas', type: 'destination', description: 'Journey through North and South America', sort_order: 3 },
  { name: 'Africa', slug: 'africa', type: 'destination', description: 'Experience the wild beauty of Africa', sort_order: 4 },
  { name: 'Oceania', slug: 'oceania', type: 'destination', description: 'Explore Australia, New Zealand and Pacific Islands', sort_order: 5 },
  { name: 'Middle East', slug: 'middle-east', type: 'destination', description: 'Discover ancient civilizations and modern wonders', sort_order: 6 },
  { name: 'Adventure', slug: 'adventure', type: 'activity', description: 'Thrilling outdoor adventures and extreme sports', sort_order: 1 },
  { name: 'Cultural', slug: 'cultural', type: 'activity', description: 'Immerse yourself in local traditions and heritage', sort_order: 2 },
  { name: 'Relaxation', slug: 'relaxation', type: 'activity', description: 'Unwind with spa retreats and beach getaways', sort_order: 3 },
  { name: 'Romantic', slug: 'romantic', type: 'activity', description: 'Perfect packages for couples and honeymoons', sort_order: 4 },
  { name: 'Family', slug: 'family', type: 'activity', description: 'Fun-filled trips for the whole family', sort_order: 5 },
  { name: 'Wildlife', slug: 'wildlife', type: 'activity', description: 'Safari and nature encounters', sort_order: 6 },
];

const insertCat = db.prepare(`
  INSERT OR IGNORE INTO categories (name, slug, type, description, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);

for (const cat of categories) {
  insertCat.run(cat.name, cat.slug, cat.type, cat.description, cat.sort_order);
}
console.log('Categories seeded');

// Seed default settings
const defaultSettings = [
  { key: 'site_name', value: 'Global One Travel' },
  { key: 'site_tagline', value: 'Your Gateway to Extraordinary Journeys' },
  { key: 'site_description', value: 'A multi-vendor travel marketplace connecting travelers with the best tour operators worldwide.' },
  { key: 'contact_email', value: 'info@global1onetravel.com' },
  { key: 'contact_phone', value: '+1 (800) 123-4567' },
  { key: 'contact_address', value: '123 Travel Street, Suite 100, New York, NY 10001' },
  { key: 'about_text', value: 'Global One Travel is a trusted marketplace that connects travelers with verified tour operators and travel agents from around the world. We curate exceptional travel experiences, ensuring quality, transparency, and unforgettable memories for every journey.' },
  { key: 'footer_text', value: 'Global One Travel. All rights reserved.' },
  { key: 'smtp_host', value: '' },
  { key: 'smtp_port', value: '587' },
  { key: 'smtp_user', value: '' },
  { key: 'smtp_pass', value: '' },
  { key: 'smtp_from', value: 'noreply@global1onetravel.com' },
  { key: 'default_currency', value: 'USD' },
];

const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value)
  VALUES (?, ?)
`);

for (const s of defaultSettings) {
  insertSetting.run(s.key, s.value);
}
console.log('Settings seeded');

db.close();
console.log('Database seeded successfully!');
