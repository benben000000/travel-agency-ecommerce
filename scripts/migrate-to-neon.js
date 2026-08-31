const Database = require('better-sqlite3');
const { neon } = require('@neondatabase/serverless');
const path = require('path');

const sqliteDb = new Database(path.join(process.cwd(), 'data', 'global-one-travel.db'));
const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_YWjaC5r4RgXl@ep-dark-flower-b3pfod7n-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

const sql = neon(databaseUrl);

async function migrate() {
  console.log('🚀 Starting migration from SQLite to Neon Postgres...');

  // 1. Create Tables
  console.log('📦 Creating tables in Neon Postgres...');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'agent', 'user')),
      phone VARCHAR(50),
      avatar_url TEXT,
      bio TEXT,
      company_name VARCHAR(255),
      is_active SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      type VARCHAR(50) NOT NULL CHECK(type IN ('destination', 'activity')),
      description TEXT,
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      agent_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      short_description TEXT,
      destination VARCHAR(255),
      country VARCHAR(255),
      region VARCHAR(100),
      category VARCHAR(100),
      activity_type VARCHAR(100),
      duration_days INTEGER DEFAULT 1,
      duration_nights INTEGER DEFAULT 0,
      max_guests INTEGER DEFAULT 10,
      price_amount INTEGER NOT NULL,
      price_currency VARCHAR(10) DEFAULT 'USD',
      price_per VARCHAR(50) DEFAULT 'person',
      cancellation_days INTEGER DEFAULT 7,
      inclusions TEXT,
      exclusions TEXT,
      highlights TEXT,
      meeting_point TEXT,
      difficulty_level VARCHAR(50) DEFAULT 'easy',
      min_age INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'rejected', 'archived')),
      featured SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS itinerary_days (
      id SERIAL PRIMARY KEY,
      package_id INTEGER NOT NULL,
      day_number INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      meals VARCHAR(255),
      accommodation VARCHAR(255),
      activities TEXT,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS package_images (
      id SERIAL PRIMARY KEY,
      package_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      alt_text VARCHAR(255),
      is_primary SMALLINT DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS package_dates (
      id SERIAL PRIMARY KEY,
      package_id INTEGER NOT NULL,
      start_date VARCHAR(50) NOT NULL,
      end_date VARCHAR(50) NOT NULL,
      available_slots INTEGER DEFAULT 10,
      price_override INTEGER,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      booking_ref VARCHAR(100) UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      package_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      departure_date VARCHAR(50),
      return_date VARCHAR(50),
      guests_count INTEGER DEFAULT 1,
      total_price INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      special_requests TEXT,
      contact_phone VARCHAR(50),
      contact_email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      package_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      booking_id INTEGER,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title VARCHAR(255),
      comment TEXT,
      verified SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id SERIAL PRIMARY KEY,
      agent_id INTEGER NOT NULL,
      code VARCHAR(100) UNIQUE NOT NULL,
      discount_type VARCHAR(50) NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value INTEGER NOT NULL,
      min_order_amount INTEGER DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      valid_from VARCHAR(50),
      valid_to VARCHAR(50),
      active SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      booking_id INTEGER,
      last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      read SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255),
      message TEXT NOT NULL,
      read SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 2. Transfer Data from SQLite
  console.log('📥 Transferring records from SQLite to Neon...');

  // Users
  const users = sqliteDb.prepare('SELECT * FROM users').all();
  for (const u of users) {
    await sql`
      INSERT INTO users (id, email, password_hash, name, role, phone, avatar_url, bio, company_name, is_active)
      VALUES (${u.id}, ${u.email}, ${u.password_hash}, ${u.name}, ${u.role}, ${u.phone}, ${u.avatar_url}, ${u.bio}, ${u.company_name}, ${u.is_active})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;`;
  console.log(`✅ Users transferred: ${users.length}`);

  // Categories
  const categories = sqliteDb.prepare('SELECT * FROM categories').all();
  for (const c of categories) {
    await sql`
      INSERT INTO categories (id, name, slug, type, description, image_url, sort_order)
      VALUES (${c.id}, ${c.name}, ${c.slug}, ${c.type}, ${c.description}, ${c.image_url}, ${c.sort_order})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(MAX(id), 1)) FROM categories;`;
  console.log(`✅ Categories transferred: ${categories.length}`);

  // Packages
  const packages = sqliteDb.prepare('SELECT * FROM packages').all();
  for (const p of packages) {
    await sql`
      INSERT INTO packages (
        id, agent_id, title, slug, description, short_description, destination, country, region,
        category, activity_type, duration_days, duration_nights, max_guests, price_amount, price_currency,
        price_per, cancellation_days, inclusions, exclusions, highlights, meeting_point, difficulty_level,
        min_age, status, featured
      ) VALUES (
        ${p.id}, ${p.agent_id}, ${p.title}, ${p.slug}, ${p.description}, ${p.short_description}, ${p.destination},
        ${p.country}, ${p.region}, ${p.category}, ${p.activity_type}, ${p.duration_days}, ${p.duration_nights},
        ${p.max_guests}, ${p.price_amount}, ${p.price_currency}, ${p.price_per}, ${p.cancellation_days},
        ${p.inclusions}, ${p.exclusions}, ${p.highlights}, ${p.meeting_point}, ${p.difficulty_level},
        ${p.min_age}, ${p.status}, ${p.featured}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('packages', 'id'), COALESCE(MAX(id), 1)) FROM packages;`;
  console.log(`✅ Packages transferred: ${packages.length}`);

  // Itinerary Days
  const itinerary = sqliteDb.prepare('SELECT * FROM itinerary_days').all();
  for (const i of itinerary) {
    await sql`
      INSERT INTO itinerary_days (id, package_id, day_number, title, description, meals, accommodation, activities)
      VALUES (${i.id}, ${i.package_id}, ${i.day_number}, ${i.title}, ${i.description}, ${i.meals}, ${i.accommodation}, ${i.activities})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('itinerary_days', 'id'), COALESCE(MAX(id), 1)) FROM itinerary_days;`;
  console.log(`✅ Itinerary days transferred: ${itinerary.length}`);

  // Package Images
  const images = sqliteDb.prepare('SELECT * FROM package_images').all();
  for (const img of images) {
    await sql`
      INSERT INTO package_images (id, package_id, image_url, alt_text, is_primary, sort_order)
      VALUES (${img.id}, ${img.package_id}, ${img.image_url}, ${img.alt_text}, ${img.is_primary}, ${img.sort_order})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('package_images', 'id'), COALESCE(MAX(id), 1)) FROM package_images;`;
  console.log(`✅ Package images transferred: ${images.length}`);

  // Package Dates
  const dates = sqliteDb.prepare('SELECT * FROM package_dates').all();
  for (const d of dates) {
    await sql`
      INSERT INTO package_dates (id, package_id, start_date, end_date, available_slots, price_override)
      VALUES (${d.id}, ${d.package_id}, ${d.start_date}, ${d.end_date}, ${d.available_slots}, ${d.price_override})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('package_dates', 'id'), COALESCE(MAX(id), 1)) FROM package_dates;`;
  console.log(`✅ Package dates transferred: ${dates.length}`);

  // Bookings
  const bookings = sqliteDb.prepare('SELECT * FROM bookings').all();
  for (const b of bookings) {
    const safePrice = b.total_price != null ? b.total_price : 0;
    await sql`
      INSERT INTO bookings (id, booking_ref, user_id, package_id, agent_id, departure_date, return_date, guests_count, total_price, status, special_requests, contact_phone, contact_email)
      VALUES (${b.id}, ${b.booking_ref}, ${b.user_id}, ${b.package_id}, ${b.agent_id}, ${b.departure_date}, ${b.return_date}, ${b.guests_count || 1}, ${safePrice}, ${b.status || 'pending'}, ${b.special_requests}, ${b.contact_phone}, ${b.contact_email})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('bookings', 'id'), COALESCE(MAX(id), 1)) FROM bookings;`;
  console.log(`✅ Bookings transferred: ${bookings.length}`);

  // Reviews
  const reviews = sqliteDb.prepare('SELECT * FROM reviews').all();
  for (const r of reviews) {
    await sql`
      INSERT INTO reviews (id, package_id, user_id, booking_id, rating, title, comment, verified)
      VALUES (${r.id}, ${r.package_id}, ${r.user_id}, ${r.booking_id}, ${r.rating}, ${r.title}, ${r.comment}, ${r.verified || 0})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('reviews', 'id'), COALESCE(MAX(id), 1)) FROM reviews;`;
  console.log(`✅ Reviews transferred: ${reviews.length}`);

  // Promo Codes
  const promos = sqliteDb.prepare('SELECT * FROM promo_codes').all();
  for (const pr of promos) {
    await sql`
      INSERT INTO promo_codes (id, agent_id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, valid_from, valid_to, active)
      VALUES (${pr.id}, ${pr.agent_id}, ${pr.code}, ${pr.discount_type}, ${pr.discount_value}, ${pr.min_order_amount || 0}, ${pr.max_uses || 0}, ${pr.used_count || 0}, ${pr.valid_from}, ${pr.valid_to}, ${pr.active || 1})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('promo_codes', 'id'), COALESCE(MAX(id), 1)) FROM promo_codes;`;
  console.log(`✅ Promo codes transferred: ${promos.length}`);

  // Conversations
  const conversations = sqliteDb.prepare('SELECT * FROM conversations').all();
  for (const c of conversations) {
    await sql`
      INSERT INTO conversations (id, user_id, agent_id, booking_id)
      VALUES (${c.id}, ${c.user_id}, ${c.agent_id}, ${c.booking_id})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('conversations', 'id'), COALESCE(MAX(id), 1)) FROM conversations;`;
  console.log(`✅ Conversations transferred: ${conversations.length}`);

  // Messages
  const messages = sqliteDb.prepare('SELECT * FROM messages').all();
  for (const m of messages) {
    await sql`
      INSERT INTO messages (id, conversation_id, sender_id, content, read)
      VALUES (${m.id}, ${m.conversation_id}, ${m.sender_id}, ${m.content}, ${m.read || 0})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('messages', 'id'), COALESCE(MAX(id), 1)) FROM messages;`;
  console.log(`✅ Messages transferred: ${messages.length}`);

  // Contact Submissions
  const contacts = sqliteDb.prepare('SELECT * FROM contact_submissions').all();
  for (const cs of contacts) {
    await sql`
      INSERT INTO contact_submissions (id, name, email, subject, message, read)
      VALUES (${cs.id}, ${cs.name}, ${cs.email}, ${cs.subject}, ${cs.message}, ${cs.read || 0})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('contact_submissions', 'id'), COALESCE(MAX(id), 1)) FROM contact_submissions;`;
  console.log(`✅ Contact submissions transferred: ${contacts.length}`);

  // Settings
  const settings = sqliteDb.prepare('SELECT * FROM settings').all();
  for (const s of settings) {
    await sql`
      INSERT INTO settings (id, key, value)
      VALUES (${s.id}, ${s.key}, ${s.value})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  await sql`SELECT setval(pg_get_serial_sequence('settings', 'id'), COALESCE(MAX(id), 1)) FROM settings;`;
  console.log(`✅ Settings transferred: ${settings.length}`);

  console.log('🎉 All SQLite data successfully migrated to Neon Serverless Postgres!');
  sqliteDb.close();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
