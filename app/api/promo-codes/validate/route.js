import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    const db = getDb();
    const { code, agent_id } = await request.json();
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    let query = `SELECT * FROM promo_codes WHERE code = ? AND active = 1
      AND (valid_from IS NULL OR valid_from <= datetime('now'))
      AND (valid_to IS NULL OR valid_to >= datetime('now'))
      AND (max_uses = 0 OR used_count < max_uses)`;
    let params = [code.toUpperCase()];

    if (agent_id) {
      query += ' AND agent_id = ?';
      params.push(parseInt(agent_id));
    }

    const promo = db.prepare(query).get(...params);
    if (!promo) return NextResponse.json({ valid: false, error: 'Invalid or expired promo code' });

    return NextResponse.json({
      valid: true,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      code: promo.code
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
