import { neon } from '@neondatabase/serverless';

let sqlClient = null;

export function getNeonSql() {
  if (!sqlClient && process.env.DATABASE_URL) {
    try {
      sqlClient = neon(process.env.DATABASE_URL);
    } catch (e) {
      console.warn('Neon SQL initialization error:', e.message);
    }
  }
  return sqlClient;
}

/**
 * Syncs a newly inserted message to Neon Serverless Postgres
 */
export async function syncMessageToNeon(msg) {
  const sql = getNeonSql();
  if (!sql || !msg) return;
  try {
    await sql.query(
      `INSERT INTO messages (id, conversation_id, sender_id, content, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET content = $4, read = $5`,
      [msg.id, msg.conversation_id, msg.sender_id, msg.content, msg.read ? 1 : 0, msg.created_at || new Date().toISOString()]
    );
  } catch (e) {
    console.warn('Neon sync message error:', e.message);
  }
}

/**
 * Syncs a conversation to Neon Serverless Postgres
 */
export async function syncConversationToNeon(conv) {
  const sql = getNeonSql();
  if (!sql || !conv) return;
  try {
    await sql.query(
      `INSERT INTO conversations (id, user_id, agent_id, booking_id, last_message_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET booking_id = $4, last_message_at = $5`,
      [conv.id, conv.user_id, conv.agent_id, conv.booking_id || null, conv.last_message_at || new Date().toISOString(), conv.created_at || new Date().toISOString()]
    );
  } catch (e) {
    console.warn('Neon sync conversation error:', e.message);
  }
}

/**
 * Syncs a booking to Neon Serverless Postgres
 */
export async function syncBookingToNeon(booking) {
  const sql = getNeonSql();
  if (!sql || !booking) return;
  try {
    await sql.query(
      `INSERT INTO bookings (id, booking_ref, user_id, package_id, agent_id, departure_date, return_date, guests_count, total_price, status, payment_status, contact_email, contact_phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO UPDATE SET status = $10, payment_status = $11, updated_at = $15`,
      [
        booking.id,
        booking.booking_ref,
        booking.user_id,
        booking.package_id,
        booking.agent_id,
        booking.departure_date,
        booking.return_date,
        booking.guests_count,
        booking.total_price,
        booking.status,
        booking.payment_status || 'unpaid',
        booking.contact_email || '',
        booking.contact_phone || '',
        booking.created_at || new Date().toISOString(),
        booking.updated_at || new Date().toISOString()
      ]
    );
  } catch (e) {
    console.warn('Neon sync booking error:', e.message);
  }
}

/**
 * Hydrates / pulls newest messages & conversations from Neon Postgres into local SQLite on cold start
 */
export async function hydrateFromNeon(db) {
  const sql = getNeonSql();
  if (!sql) return;
  try {
    // 1. Pull conversations
    const neonConvs = await sql.query('SELECT * FROM conversations ORDER BY id ASC');
    if (neonConvs && neonConvs.length > 0) {
      const insertConv = db.prepare(`
        INSERT OR REPLACE INTO conversations (id, user_id, agent_id, booking_id, last_message_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const c of neonConvs) {
        insertConv.run(c.id, c.user_id, c.agent_id, c.booking_id, c.last_message_at, c.created_at);
      }
    }

    // 2. Pull messages
    const neonMsgs = await sql.query('SELECT * FROM messages ORDER BY id ASC');
    if (neonMsgs && neonMsgs.length > 0) {
      const insertMsg = db.prepare(`
        INSERT OR REPLACE INTO messages (id, conversation_id, sender_id, content, read, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const m of neonMsgs) {
        insertMsg.run(m.id, m.conversation_id, m.sender_id, m.content, m.read ? 1 : 0, m.created_at);
      }
    }

    // 3. Pull bookings
    const neonBookings = await sql.query('SELECT * FROM bookings ORDER BY id ASC');
    if (neonBookings && neonBookings.length > 0) {
      const insertBooking = db.prepare(`
        INSERT OR REPLACE INTO bookings (
          id, booking_ref, user_id, package_id, agent_id, package_date_id, departure_date, return_date,
          guests_count, total_price, promo_code_id, discount_amount, special_requests, status, payment_status,
          contact_name, contact_email, contact_phone, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const b of neonBookings) {
        insertBooking.run(
          b.id, b.booking_ref, b.user_id, b.package_id, b.agent_id, b.package_date_id, b.departure_date, b.return_date,
          b.guests_count, b.total_price, b.promo_code_id, b.discount_amount, b.special_requests, b.status, b.payment_status,
          b.contact_name, b.contact_email, b.contact_phone, b.created_at, b.updated_at
        );
      }
    }
  } catch (e) {
    console.warn('Hydrate from Neon warning:', e.message);
  }
}
