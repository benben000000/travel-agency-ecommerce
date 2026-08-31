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

function toIso(val) {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  try {
    return new Date(val).toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

/**
 * Syncs a newly inserted message to Neon Serverless Postgres
 */
export async function syncMessageToNeon(msg, db = null) {
  const sql = getNeonSql();
  if (!sql || !msg) return;
  try {
    // Ensure parent conversation exists in Neon first to avoid FK error
    if (msg.conversation_id && db) {
      try {
        const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(msg.conversation_id);
        if (conv) {
          await syncConversationToNeon(conv);
        }
      } catch (e) {}
    }

    await sql.query(
      `INSERT INTO messages (id, conversation_id, sender_id, content, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET content = $4, read = $5`,
      [
        Number(msg.id),
        Number(msg.conversation_id),
        Number(msg.sender_id),
        String(msg.content || ''),
        msg.read ? 1 : 0,
        toIso(msg.created_at)
      ]
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
      [
        Number(conv.id),
        Number(conv.user_id),
        Number(conv.agent_id),
        conv.booking_id ? Number(conv.booking_id) : null,
        toIso(conv.last_message_at),
        toIso(conv.created_at)
      ]
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
      `INSERT INTO bookings (id, booking_ref, user_id, package_id, agent_id, package_date_id, guests_count, total_amount, currency, status, payment_status, contact_email, contact_phone, special_requests, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO UPDATE SET status = $10, payment_status = $11, updated_at = $16`,
      [
        Number(booking.id),
        String(booking.booking_ref || ''),
        Number(booking.user_id),
        Number(booking.package_id),
        Number(booking.agent_id),
        booking.package_date_id ? Number(booking.package_date_id) : null,
        Number(booking.guests_count || 1),
        Number(booking.total_amount || booking.total_price || 0),
        String(booking.currency || 'USD'),
        String(booking.status || 'pending'),
        String(booking.payment_status === 'paid' ? 'paid' : 'pending'),
        String(booking.contact_email || ''),
        String(booking.contact_phone || ''),
        String(booking.special_requests || ''),
        toIso(booking.created_at),
        toIso(booking.updated_at)
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
        insertConv.run(
          Number(c.id),
          Number(c.user_id),
          Number(c.agent_id),
          c.booking_id ? Number(c.booking_id) : null,
          toIso(c.last_message_at),
          toIso(c.created_at)
        );
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
        insertMsg.run(
          Number(m.id),
          Number(m.conversation_id),
          Number(m.sender_id),
          String(m.content || ''),
          m.read ? 1 : 0,
          toIso(m.created_at)
        );
      }
    }

    // 3. Pull bookings
    const neonBookings = await sql.query('SELECT * FROM bookings ORDER BY id ASC');
    if (neonBookings && neonBookings.length > 0) {
      const insertBooking = db.prepare(`
        INSERT OR REPLACE INTO bookings (
          id, booking_ref, user_id, package_id, agent_id, package_date_id,
          guests_count, total_amount, currency, status, payment_status,
          contact_email, contact_phone, special_requests, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const b of neonBookings) {
        const rawPaymentStatus = String(b.payment_status || '').toLowerCase();
        const validPaymentStatus = ['paid', 'refunded', 'failed'].includes(rawPaymentStatus) ? rawPaymentStatus : 'pending';
        const rawStatus = String(b.status || '').toLowerCase();
        const validStatus = ['confirmed', 'cancelled', 'completed', 'refunded'].includes(rawStatus) ? rawStatus : 'pending';

        insertBooking.run(
          Number(b.id),
          String(b.booking_ref || ''),
          Number(b.user_id),
          Number(b.package_id),
          Number(b.agent_id),
          b.package_date_id ? Number(b.package_date_id) : null,
          Number(b.guests_count || 1),
          Number(b.total_amount || b.total_price || 0),
          String(b.currency || 'USD'),
          validStatus,
          validPaymentStatus,
          String(b.contact_email || ''),
          String(b.contact_phone || ''),
          String(b.special_requests || ''),
          toIso(b.created_at),
          toIso(b.updated_at)
        );
      }
    }
  } catch (e) {
    console.warn('Hydrate from Neon error:', e.message);
  }
}
