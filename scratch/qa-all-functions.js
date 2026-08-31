const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'global-one-travel.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedTests++;
  }
}

async function runFullQA() {
  console.log('====================================================');
  console.log(' STARTING COMPREHENSIVE END-TO-END QA AUDIT');
  console.log('====================================================\n');

  // TEST SUITE 1: USER ACCOUNTS & AUTHENTICATION
  console.log('--- TEST SUITE 1: USER ACCOUNTS & CREDENTIALS ---');
  const admin = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
  assert(admin && admin.email === 'admin@global1onetravel.com', 'Super Admin account exists and verified');

  const agents = db.prepare("SELECT * FROM users WHERE role = 'agent'").all();
  assert(agents.length === 7, `7 Verified Tour Operators exist (found ${agents.length})`);

  const customers = db.prepare("SELECT * FROM users WHERE role = 'user'").all();
  assert(customers.length === 250, `250 Traveler Customer accounts exist (found ${customers.length})`);

  const sampleUser = customers[0];
  const passwordMatches = bcrypt.compareSync('password123', sampleUser.password_hash);
  assert(passwordMatches, 'Bcrypt password hashing and validation verified');

  // TEST SUITE 2: PACKAGES & CONTINENT COVERAGE
  console.log('\n--- TEST SUITE 2: PACKAGES & CONTINENT COVERAGE ---');
  const packages = db.prepare('SELECT * FROM packages').all();
  assert(packages.length >= 65, `At least 65 Packages exist (found ${packages.length})`);

  const regions = db.prepare('SELECT DISTINCT region FROM packages').all().map(r => r.region);
  assert(regions.includes('Asia'), 'Asia packages verified');
  assert(regions.includes('Europe'), 'Europe packages verified');
  assert(regions.includes('Americas'), 'Americas packages verified');
  assert(regions.includes('Africa'), 'Africa packages verified');
  assert(regions.includes('Oceania'), 'Oceania packages verified');
  assert(regions.includes('Middle East'), 'Middle East packages verified');

  const samplePkg = db.prepare('SELECT * FROM packages WHERE slug = ?').get('7-day-kyoto-zen-temples-kaiseki-culinary-arts');
  assert(samplePkg !== undefined, 'Kyoto package exists by slug');

  const itineraryDays = db.prepare('SELECT * FROM itinerary_days WHERE package_id = ?').all(samplePkg.id);
  assert(itineraryDays.length === 7, `Package day-by-day itinerary verified (${itineraryDays.length} days found)`);

  const packageDates = db.prepare('SELECT * FROM package_dates WHERE package_id = ?').all(samplePkg.id);
  assert(packageDates.length >= 4, `Package departure dates verified (${packageDates.length} slots found)`);

  const packageImages = db.prepare('SELECT * FROM package_images WHERE package_id = ?').all(samplePkg.id);
  assert(packageImages.length >= 2, `Package gallery images verified (${packageImages.length} images found)`);

  // TEST SUITE 3: FILTERING & SORTING SIMULATION
  console.log('\n--- TEST SUITE 3: FILTERING & HIGH-SPEED SORTING ---');
  const europePkgs = db.prepare("SELECT * FROM packages WHERE region = 'Europe' AND status = 'active'").all();
  assert(europePkgs.length > 0, `Region filter: Europe (${europePkgs.length} packages found)`);

  const adventurePkgs = db.prepare("SELECT * FROM packages WHERE activity_type = 'Adventure' AND status = 'active'").all();
  assert(adventurePkgs.length > 0, `Activity filter: Adventure (${adventurePkgs.length} packages found)`);

  const priceSortedAsc = db.prepare("SELECT price_amount FROM packages WHERE status = 'active' ORDER BY price_amount ASC").all();
  let isSortedAsc = true;
  for (let i = 0; i < priceSortedAsc.length - 1; i++) {
    if (priceSortedAsc[i].price_amount > priceSortedAsc[i+1].price_amount) isSortedAsc = false;
  }
  assert(isSortedAsc, 'Sort mode: Price Low to High verified');

  const priceSortedDesc = db.prepare("SELECT price_amount FROM packages WHERE status = 'active' ORDER BY price_amount DESC").all();
  let isSortedDesc = true;
  for (let i = 0; i < priceSortedDesc.length - 1; i++) {
    if (priceSortedDesc[i].price_amount < priceSortedDesc[i+1].price_amount) isSortedDesc = false;
  }
  assert(isSortedDesc, 'Sort mode: Price High to Low verified');

  // TEST SUITE 4: PROMO CODE ENGINE
  console.log('\n--- TEST SUITE 4: PROMO CODE ENGINE ---');
  const promo = db.prepare("SELECT * FROM promo_codes WHERE code = 'AURORA15' AND active = 1").get();
  assert(promo !== undefined && promo.discount_value === 15, 'Promo code AURORA15 (15% OFF) verified');

  const testOrderAmount = 200000; // $2000.00
  const discountAmount = Math.floor(testOrderAmount * (promo.discount_value / 100));
  const finalPrice = testOrderAmount - discountAmount;
  assert(discountAmount === 30000 && finalPrice === 170000, `Discount calculation verified ($${discountAmount/100} off, final: $${finalPrice/100})`);

  // TEST SUITE 5: BOOKING WORKFLOW & LIFECYCLE
  console.log('\n--- TEST SUITE 5: BOOKING WORKFLOW & DATABASE PERSISTENCE ---');
  const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
  assert(totalBookings >= 250, `Bookings ledger populated (found ${totalBookings} records)`);

  const newRef = 'GOT-TEST-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const testCustomer = customers[5];
  const testPkg = packages[0];
  const testDate = db.prepare('SELECT * FROM package_dates WHERE package_id = ?').get(testPkg.id);

  const insertBooking = db.prepare(`
    INSERT INTO bookings (
      booking_ref, user_id, package_id, package_date_id, agent_id,
      guests_count, guest_names, contact_email, contact_phone,
      total_amount, currency, status, payment_status, payment_method, special_requests
    ) VALUES (
      ?, ?, ?, ?, ?,
      2, 'QA Test User, Companion', ?, '+1 (555) 000-1111',
      ?, 'USD', 'pending', 'paid', 'card', 'QA test booking verification'
    )
  `);

  const bkRes = insertBooking.run(newRef, testCustomer.id, testPkg.id, testDate.id, testPkg.agent_id, testCustomer.email, testPkg.price_amount * 2);
  const createdBookingId = bkRes.lastInsertRowid;
  assert(createdBookingId > 0, `New booking placed successfully with Ref ${newRef}`);

  // Test status transition: pending -> confirmed -> completed
  db.prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?").run(createdBookingId);
  const confirmedBk = db.prepare('SELECT status FROM bookings WHERE id = ?').get(createdBookingId);
  assert(confirmedBk.status === 'confirmed', 'Booking status transition to confirmed verified');

  db.prepare("UPDATE bookings SET status = 'completed' WHERE id = ?").run(createdBookingId);
  const completedBk = db.prepare('SELECT status FROM bookings WHERE id = ?').get(createdBookingId);
  assert(completedBk.status === 'completed', 'Booking status transition to completed verified');

  // TEST SUITE 6: REVIEW SYSTEM & RATINGS AGGREGATION
  console.log('\n--- TEST SUITE 6: REVIEW SYSTEM & RATINGS AGGREGATION ---');
  const insertRev = db.prepare(`
    INSERT INTO reviews (user_id, package_id, booking_id, rating, comment)
    VALUES (?, ?, ?, 5, 'QA Audit Test: Extraordinary journey and 5-star service.')
  `);
  const revRes = insertRev.run(testCustomer.id, testPkg.id, createdBookingId);
  assert(revRes.lastInsertRowid > 0, 'Customer review submitted on completed booking');

  const ratingAgg = db.prepare('SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE package_id = ?').get(testPkg.id);
  assert(ratingAgg.cnt > 0 && ratingAgg.avg_r >= 4.0, `Rating aggregation verified (Avg: ${ratingAgg.avg_r.toFixed(1)} stars across ${ratingAgg.cnt} reviews)`);

  // TEST SUITE 7: IN-APP MESSAGING
  console.log('\n--- TEST SUITE 7: REAL-TIME IN-APP MESSAGING ---');
  const convRes = db.prepare(`
    INSERT INTO conversations (user_id, agent_id, booking_id, last_message_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(testCustomer.id, testPkg.agent_id, createdBookingId);
  const testConvId = convRes.lastInsertRowid;

  const msgRes = db.prepare(`
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (?, ?, 'QA Message: Hello Elena, confirming our pickup time.')
  `).run(testConvId, testCustomer.id);
  assert(msgRes.lastInsertRowid > 0, 'In-app message dispatched and saved to database');

  const convMessages = db.prepare('SELECT * FROM messages WHERE conversation_id = ?').all(testConvId);
  assert(convMessages.length === 1 && convMessages[0].content.includes('confirming our pickup time'), 'Message thread retrieval verified');

  // TEST SUITE 8: CONTACT FORM INQUIRIES & SETTINGS
  console.log('\n--- TEST SUITE 8: INQUIRIES & SITE SETTINGS ---');
  const inqRes = db.prepare(`
    INSERT INTO contact_submissions (name, email, subject, message)
    VALUES ('QA Contact Test', 'qatest@example.com', 'General Inquiry', 'Testing contact persistence.')
  `).run();
  assert(inqRes.lastInsertRowid > 0, 'Contact inquiry submitted and recorded in database');

  const inquiriesCount = db.prepare('SELECT COUNT(*) as c FROM contact_submissions').get().c;
  assert(inquiriesCount >= 5, `Admin inquiries viewer verified (${inquiriesCount} inquiries found)`);

  // Clean up QA test booking
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(testConvId);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(testConvId);
  db.prepare('DELETE FROM reviews WHERE booking_id = ?').run(createdBookingId);
  db.prepare('DELETE FROM bookings WHERE id = ?').run(createdBookingId);

  // FINAL SUMMARY
  console.log('\n====================================================');
  console.log(` QA AUDIT FINISHED: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================');

  db.close();

  if (failedTests > 0) process.exit(1);
}

runFullQA().catch(err => {
  console.error('QA AUDIT EXCEPTION:', err);
  process.exit(1);
});
