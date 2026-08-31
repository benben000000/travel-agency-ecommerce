import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const IS_VERCEL = !!process.env.VERCEL;
const SOURCE_DB_PATH = path.join(process.cwd(), 'data', 'global-one-travel.db');
const DB_PATH = IS_VERCEL
  ? path.join('/tmp', 'global-one-travel.db')
  : SOURCE_DB_PATH;

let db;

export function getDb() {
  if (!db) {
    if (IS_VERCEL) {
      if (!fs.existsSync(DB_PATH) && fs.existsSync(SOURCE_DB_PATH)) {
        try {
          fs.copyFileSync(SOURCE_DB_PATH, DB_PATH);
        } catch (e) {
          console.error('Error copying database to /tmp in Vercel:', e);
        }
      }
    } else {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    db = new Database(DB_PATH);
    
    // Enterprise performance optimizations
    if (!IS_VERCEL) {
      db.pragma('journal_mode = WAL');
    }
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    db.pragma('cache_size = -64000'); // 64MB memory page cache
    db.pragma('temp_store = MEMORY');
    
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db) {
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

    -- Composite and specialized indexes for high-throughput concurrency
    CREATE INDEX IF NOT EXISTS idx_packages_agent ON packages(agent_id);
    CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
    CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
    CREATE INDEX IF NOT EXISTS idx_packages_status_featured ON packages(status, featured);
    CREATE INDEX IF NOT EXISTS idx_packages_category_status ON packages(category, status);
    CREATE INDEX IF NOT EXISTS idx_packages_destination ON packages(destination);
    CREATE INDEX IF NOT EXISTS idx_packages_price ON packages(price_amount);
    CREATE INDEX IF NOT EXISTS idx_packages_duration ON packages(duration_days);
    CREATE INDEX IF NOT EXISTS idx_packages_created ON packages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_bookings_agent_status ON bookings(agent_id, status);
    CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_ref);
    CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_reviews_pkg_created ON reviews(package_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_categories_type_order ON categories(type, sort_order);
    CREATE INDEX IF NOT EXISTS idx_promo_code_agent ON promo_codes(code, agent_id, active);
  `);
}

export default getDb;
