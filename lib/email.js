import nodemailer from 'nodemailer';
import { getDb } from './db';

function getSmtpSettings() {
  const db = getDb();
  const settings = {};
  const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'smtp_%'").all();
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

function createTransporter() {
  const smtp = getSmtpSettings();
  if (!smtp.smtp_host || !smtp.smtp_user) {
    return null;
  }
  return nodemailer.createTransport({
    host: smtp.smtp_host,
    port: parseInt(smtp.smtp_port || '587'),
    secure: parseInt(smtp.smtp_port || '587') === 465,
    auth: {
      user: smtp.smtp_user,
      pass: smtp.smtp_pass,
    },
  });
}

function emailLayout(content, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Georgia,'Crimson Text',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e2e2e2;">
          <tr>
            <td style="background-color:#253545;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-family:'Fjalla One',Arial,sans-serif;font-size:24px;font-weight:400;letter-spacing:1px;">
                GLOBAL ONE TRAVEL
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f5f5f5;padding:20px 32px;text-align:center;border-top:1px solid #e2e2e2;">
              <p style="margin:0;color:#5e5e5e;font-size:13px;">
                Global One Travel. All rights reserved.
              </p>
              <p style="margin:8px 0 0;color:#a4a4a4;font-size:12px;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function bookingConfirmationEmail(booking, pkg, user) {
  const content = `
    <h2 style="margin:0 0 16px;color:#253545;font-family:'Fjalla One',Arial,sans-serif;font-size:22px;font-weight:400;">
      Booking Confirmation
    </h2>
    <p style="color:#1b1b1b;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Dear ${user.name},
    </p>
    <p style="color:#1b1b1b;font-size:16px;line-height:1.6;margin:0 0 24px;">
      Your booking has been received and is being processed. Below are your booking details.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e2e2e2;margin-bottom:24px;">
      <tr style="background-color:#f5f5f5;">
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;width:40%;">Booking Reference</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${booking.booking_ref}</td>
      </tr>
      <tr>
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Package</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${pkg.title}</td>
      </tr>
      <tr style="background-color:#f5f5f5;">
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Destination</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${pkg.destination || 'See package details'}</td>
      </tr>
      <tr>
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Guests</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${booking.guests_count}</td>
      </tr>
      <tr style="background-color:#f5f5f5;">
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Total Amount</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">$${(booking.total_amount / 100).toFixed(2)} ${booking.currency}</td>
      </tr>
      <tr>
        <td style="font-weight:bold;color:#253545;font-size:14px;">Status</td>
        <td style="color:#1b1b1b;font-size:14px;">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</td>
      </tr>
    </table>
    <p style="color:#5e5e5e;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Your booking is now being reviewed by the travel agent. You will receive a confirmation email once it has been approved.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="#" style="display:inline-block;background-color:#253545;color:#ffffff;text-decoration:none;padding:12px 32px;font-family:'Fjalla One',Arial,sans-serif;font-size:14px;letter-spacing:1px;">
            VIEW BOOKING
          </a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout(content, 'Booking Confirmation - Global One Travel');
}

export function bookingThankYouEmail(booking, pkg, user) {
  const content = `
    <h2 style="margin:0 0 16px;color:#253545;font-family:'Fjalla One',Arial,sans-serif;font-size:22px;font-weight:400;">
      Booking Confirmed
    </h2>
    <p style="color:#1b1b1b;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Dear ${user.name},
    </p>
    <p style="color:#1b1b1b;font-size:16px;line-height:1.6;margin:0 0 24px;">
      Great news! Your booking for <strong>${pkg.title}</strong> has been confirmed by your travel agent. We look forward to providing you an unforgettable experience.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e2e2e2;margin-bottom:24px;">
      <tr style="background-color:#f5f5f5;">
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;width:40%;">Booking Reference</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${booking.booking_ref}</td>
      </tr>
      <tr>
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Package</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${pkg.title}</td>
      </tr>
      ${pkg.meeting_point ? `
      <tr style="background-color:#f5f5f5;">
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Meeting Point</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${pkg.meeting_point}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="font-weight:bold;color:#253545;font-size:14px;">Duration</td>
        <td style="color:#1b1b1b;font-size:14px;">${pkg.duration_days} day(s)${pkg.duration_nights ? `, ${pkg.duration_nights} night(s)` : ''}</td>
      </tr>
    </table>
    <p style="color:#1b1b1b;font-size:16px;line-height:1.6;margin:0 0 8px;font-weight:bold;">
      What to expect:
    </p>
    <ul style="color:#5e5e5e;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
      <li>Your travel agent will contact you with further details</li>
      <li>Check your dashboard for itinerary updates</li>
      <li>You can message your agent directly through the platform</li>
    </ul>
    <p style="color:#5e5e5e;font-size:14px;line-height:1.6;margin:0;">
      Thank you for choosing Global One Travel. We wish you a wonderful journey!
    </p>
  `;
  return emailLayout(content, 'Booking Confirmed - Global One Travel');
}

export function agentBookingAlertEmail(booking, pkg, user, agent) {
  const content = `
    <h2 style="margin:0 0 16px;color:#253545;font-family:'Fjalla One',Arial,sans-serif;font-size:22px;font-weight:400;">
      New Booking Received
    </h2>
    <p style="color:#1b1b1b;font-size:16px;line-height:1.6;margin:0 0 24px;">
      Hello ${agent.name}, you have received a new booking for your package.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e2e2e2;margin-bottom:24px;">
      <tr style="background-color:#f5f5f5;">
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;width:40%;">Booking Reference</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${booking.booking_ref}</td>
      </tr>
      <tr>
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Customer</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${user.name} (${user.email})</td>
      </tr>
      <tr style="background-color:#f5f5f5;">
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Package</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${pkg.title}</td>
      </tr>
      <tr>
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Guests</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${booking.guests_count}</td>
      </tr>
      <tr style="background-color:#f5f5f5;">
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Amount</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">$${(booking.total_amount / 100).toFixed(2)} ${booking.currency}</td>
      </tr>
      ${booking.special_requests ? `
      <tr>
        <td style="font-weight:bold;color:#253545;font-size:14px;border-bottom:1px solid #e2e2e2;">Special Requests</td>
        <td style="color:#1b1b1b;font-size:14px;border-bottom:1px solid #e2e2e2;">${booking.special_requests}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="font-weight:bold;color:#253545;font-size:14px;">Phone</td>
        <td style="color:#1b1b1b;font-size:14px;">${booking.contact_phone || 'Not provided'}</td>
      </tr>
    </table>
    <p style="color:#5e5e5e;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Please log in to your agent dashboard to review and confirm this booking.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="#" style="display:inline-block;background-color:#253545;color:#ffffff;text-decoration:none;padding:12px 32px;font-family:'Fjalla One',Arial,sans-serif;font-size:14px;letter-spacing:1px;">
            VIEW BOOKING
          </a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout(content, 'New Booking Alert - Global One Travel');
}

export async function sendEmail(to, subject, html) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
    console.log('[EMAIL FALLBACK] SMTP not configured. Email logged but not sent.');
    return { success: true, fallback: true };
  }
  try {
    const smtp = getSmtpSettings();
    await transporter.sendMail({
      from: smtp.smtp_from || 'noreply@global1onetravel.com',
      to,
      subject,
      html,
    });
    return { success: true, fallback: false };
  } catch (error) {
    console.error('[EMAIL ERROR]', error.message);
    return { success: false, error: error.message };
  }
}
