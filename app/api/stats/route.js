import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const uid = parseInt(session.user.id);

    if (session.user.role === 'admin') {
      const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get().c;
      const totalAgents = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'agent'").get().c;
      const totalPackages = db.prepare('SELECT COUNT(*) as c FROM packages').get().c;
      const activePackages = db.prepare("SELECT COUNT(*) as c FROM packages WHERE status = 'active'").get().c;
      const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
      const pendingBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'pending'").get().c;
      const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as s FROM bookings WHERE payment_status = ?').get('paid').s;
      const recentBookings = db.prepare(`
        SELECT b.*, p.title as package_title, u.name as user_name
        FROM bookings b LEFT JOIN packages p ON b.package_id = p.id LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC LIMIT 5
      `).all();
      return NextResponse.json({ totalUsers, totalAgents, totalPackages, activePackages, totalBookings, pendingBookings, totalRevenue, recentBookings });
    }

    if (session.user.role === 'agent') {
      const totalPackages = db.prepare('SELECT COUNT(*) as c FROM packages WHERE agent_id = ?').get(uid).c;
      const activePackages = db.prepare("SELECT COUNT(*) as c FROM packages WHERE agent_id = ? AND status = 'active'").get(uid).c;
      const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE agent_id = ?').get(uid).c;
      const pendingBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE agent_id = ? AND status = 'pending'").get(uid).c;
      const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as s FROM bookings WHERE agent_id = ? AND payment_status = 'paid'").get(uid).s;
      const unreadMessages = db.prepare(`SELECT COUNT(*) as c FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.agent_id = ? AND m.read = 0 AND m.sender_id != ?`).get(uid, uid).c;
      const recentBookings = db.prepare(`
        SELECT b.*, p.title as package_title, u.name as user_name
        FROM bookings b LEFT JOIN packages p ON b.package_id = p.id LEFT JOIN users u ON b.user_id = u.id
        WHERE b.agent_id = ? ORDER BY b.created_at DESC LIMIT 5
      `).all(uid);
      return NextResponse.json({ totalPackages, activePackages, totalBookings, pendingBookings, totalRevenue, unreadMessages, recentBookings });
    }

    // User stats
    const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE user_id = ?').get(uid).c;
    const activeBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE user_id = ? AND status IN ('pending', 'confirmed')").get(uid).c;
    const totalSpent = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as s FROM bookings WHERE user_id = ? AND payment_status = 'paid'").get(uid).s;
    const unreadMessages = db.prepare(`SELECT COUNT(*) as c FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.user_id = ? AND m.read = 0 AND m.sender_id != ?`).get(uid, uid).c;
    const recentBookings = db.prepare(`
      SELECT b.*, p.title as package_title FROM bookings b
      LEFT JOIN packages p ON b.package_id = p.id WHERE b.user_id = ? ORDER BY b.created_at DESC LIMIT 5
    `).all(uid);
    return NextResponse.json({ totalBookings, activeBookings, totalSpent, unreadMessages, recentBookings });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
