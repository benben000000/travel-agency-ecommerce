import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const submissions = db.prepare('SELECT * FROM contact_submissions ORDER BY created_at DESC').all();
    return NextResponse.json({ submissions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const { name, email, subject, message } = await request.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    db.prepare('INSERT INTO contact_submissions (name, email, subject, message) VALUES (?, ?, ?, ?)').run(
      name,
      email,
      subject || '',
      message
    );

    const contactEmail = db.prepare("SELECT value FROM settings WHERE key = 'contact_email'").get();
    if (contactEmail?.value) {
      await sendEmail(
        contactEmail.value,
        `Contact Form: ${subject || 'New Message'}`,
        `<h3>New Contact Form Submission</h3><p><strong>From:</strong> ${name} (${email})</p><p><strong>Subject:</strong> ${
          subject || 'N/A'
        }</p><p><strong>Message:</strong></p><p>${message}</p>`
      );
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
