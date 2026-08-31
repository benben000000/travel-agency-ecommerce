const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'global-one-travel.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

const defaultPasswordHash = bcrypt.hashSync('password123', 10);
const adminPasswordHash = bcrypt.hashSync('admin123', 10);

console.log('--- STARTING MASS DATABASE POPULATION ---');

// 1. CLEAR & RE-INITIALIZE TABLES
db.exec(`
  DELETE FROM messages;
  DELETE FROM conversations;
  DELETE FROM reviews;
  DELETE FROM bookings;
  DELETE FROM package_dates;
  DELETE FROM package_images;
  DELETE FROM itinerary_days;
  DELETE FROM packages;
  DELETE FROM promo_codes;
  DELETE FROM contact_submissions;
  DELETE FROM categories;
  DELETE FROM users;
`);

console.log('1. Cleared existing records.');

// 2. CREATE SUPER ADMIN
const insertUser = db.prepare(`
  INSERT INTO users (email, password_hash, name, role, phone, company_name, bio, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1)
`);

insertUser.run(
  'admin@global1onetravel.com',
  adminPasswordHash,
  'Platform Super Admin',
  'admin',
  '+1 (800) 555-0100',
  'Global 1 Onetech',
  'Platform head supervisor.'
);

// 3. CREATE 7 VERIFIED TOUR OPERATOR / AGENTS
const agentsData = [
  {
    name: 'Elena Rostova',
    email: 'aurora@globaltours.com',
    company: 'Aurora Arctic Expeditions',
    phone: '+47 77 60 00 00',
    bio: 'Specialists in Nordic, Lapland, and Arctic small-group aurora expeditions with 15+ years of arctic wilderness experience.'
  },
  {
    name: 'Kenji Takahashi',
    email: 'kenji@nipponvoyages.com',
    company: 'Nippon Heritage Voyages',
    phone: '+81 75 555 0192',
    bio: 'Boutique cultural immersion agency focusing on imperial Japanese heritage, temple stays, and master culinary tours.'
  },
  {
    name: 'Mateo Rossi',
    email: 'mateo@mediterraneantravel.com',
    company: 'Mediterranean Heritage & Yachting',
    phone: '+39 06 698 1234',
    bio: 'Luxury Mediterranean coastal voyages, Amalfi cliffside retreats, and private yacht expeditions across the Greek isles.'
  },
  {
    name: 'Amara Diallo',
    email: 'amara@safarilegacy.com',
    company: 'Serengeti & Mara Safari Legacy',
    phone: '+255 27 250 8888',
    bio: 'Eco-certified wildlife guides organizing conservation-focused safaris across Tanzania, Kenya, and Southern Africa.'
  },
  {
    name: 'Camila Rodriguez',
    email: 'camila@andesadventures.com',
    company: 'Andes & Patagonia Treks',
    phone: '+51 84 222 345',
    bio: 'High-altitude mountaineering and cultural trekking agency specializing in the Inca Trail, Sacred Valley, and Torres del Paine.'
  },
  {
    name: 'Tariq Al-Mansoor',
    email: 'tariq@arabianodyssey.com',
    company: 'Arabian Sands & Silk Road Tours',
    phone: '+962 6 560 7890',
    bio: 'Curated desert caravans, ancient Petra explorations, and Silk Road heritage journeys across the Middle East and Central Asia.'
  },
  {
    name: 'Liam O’Connor',
    email: 'liam@pacificwilds.com',
    company: 'Pacific & Australasia Discoveries',
    phone: '+61 2 9250 7111',
    bio: 'Adventures spanning the Great Barrier Reef, New Zealand fjords, Southern Alps, and private Polynesian archipelago cruises.'
  }
];

const agentIds = [];
for (const ag of agentsData) {
  const res = insertUser.run(
    ag.email,
    defaultPasswordHash,
    ag.name,
    'agent',
    ag.phone,
    ag.company,
    ag.bio
  );
  agentIds.push(res.lastInsertRowid);
}
console.log(`2. Created ${agentIds.length} Verified Tour Operators.`);

// 4. CREATE CATEGORIES (DESTINATIONS & ACTIVITIES)
const insertCategory = db.prepare(`
  INSERT INTO categories (name, slug, type, description, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);

const categoriesData = [
  // Destinations
  { name: 'Asia', slug: 'asia', type: 'destination', description: 'Historic temples, culinary arts, and lush tropical islands.' },
  { name: 'Europe', slug: 'europe', type: 'destination', description: 'Scenic fjords, alpine peaks, and classical architectural landmarks.' },
  { name: 'Americas', slug: 'americas', type: 'destination', description: 'Incan ruins, Patagonian glaciers, and vast national parks.' },
  { name: 'Africa', slug: 'africa', type: 'destination', description: 'Majestic Serengeti safaris, ancient Pyramids, and desert dunes.' },
  { name: 'Oceania', slug: 'oceania', type: 'destination', description: 'Great Barrier Reef marine wonders and New Zealand fjordlands.' },
  { name: 'Middle East', slug: 'middle-east', type: 'destination', description: 'Petra rose-red ruins, Wadi Rum canyons, and Dubai skylines.' },
  // Activities
  { name: 'Adventure & Wildlife', slug: 'adventure', type: 'activity', description: 'Trekking, polar expeditions, diving, and wildlife game drives.' },
  { name: 'Cultural & Heritage', slug: 'cultural', type: 'activity', description: 'Ancient architecture, indigenous folklore, and UNESCO landmarks.' },
  { name: 'Luxury & Relaxation', slug: 'relaxation', type: 'activity', description: 'Private ryokans, coastal yachts, and wellness retreats.' },
  { name: 'Culinary & Wine', slug: 'culinary', type: 'activity', description: 'Michelin kaiseki dining, Tuscan vineyards, and street market tours.' },
  { name: 'Hiking & Trekking', slug: 'trekking', type: 'activity', description: 'Alpine summits, high mountain trails, and wilderness lodges.' }
];

for (let i = 0; i < categoriesData.length; i++) {
  const c = categoriesData[i];
  insertCategory.run(c.name, c.slug, c.type, c.description, i);
}
console.log('3. Seeded Destination and Activity Taxonomies.');

// 5. DEFINE 65 COMPREHENSIVE PACKAGES SPREAD OVER 6 CONTINENTS
const rawPackages = [
  // --- ASIA (Agent Kenji or Tariq) ---
  {
    agentIdx: 1,
    title: '7-Day Kyoto Zen Temples & Kaiseki Culinary Arts',
    slug: '7-day-kyoto-zen-temples-kaiseki-culinary-arts',
    dest: 'Kyoto, Japan', country: 'Japan', region: 'Asia', category: 'Asia', activity: 'Cultural',
    days: 7, nights: 6, guests: 8, price: 185000, featured: 1,
    desc: 'Immerse deeply in traditional Japanese culture through private access to UNESCO Zen gardens, master tea ceremonies, and two Michelin-starred Kaiseki dinners.',
    short: 'Exclusive cultural immersion into Japan ancient imperial capital.',
    images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
    itinerary: [
      { day: 1, title: 'Arrival in Kyoto & Ryokan Welcome', desc: 'Private arrival transfer from Kansai or Kyoto station, check-in to historic ryokan, and multi-course welcome dinner.', meals: 'Dinner', stay: 'Hiiragiya Ryokan' },
      { day: 2, title: 'Kinkaku-ji & Zen Rock Meditation', desc: 'Early morning private meditation session with senior monk at Ryoan-ji followed by Golden Pavilion exploration.', meals: 'Breakfast, Lunch', stay: 'Hiiragiya Ryokan' },
      { day: 3, title: 'Arashiyama Bamboo Grove & Tea Masterclass', desc: 'Sunrise walk through the bamboo grove followed by a private tea ceremony with an Urasenke grandmaster.', meals: 'Breakfast, Lunch', stay: 'Hiiragiya Ryokan' },
      { day: 4, title: 'Gion Geisha District & Culinary Market', desc: 'Guided stroll through Nishiki Market sourcing seasonal ingredients followed by evening geiko performance in Gion.', meals: 'Breakfast, Dinner', stay: 'Kyoto Heritage Hotel' },
      { day: 5, title: 'Fushimi Inari Shrine & Sake Breweries', desc: 'Trek the 10,000 vermilion torii gates to Mount Inari peak, followed by private tasting in Fushimi sake district.', meals: 'Breakfast, Lunch', stay: 'Kyoto Heritage Hotel' },
      { day: 6, title: 'Nara Day Trip & Todai-ji Temple', desc: 'Visit ancient Nara park, Great Bronze Buddha at Todai-ji, and farewell Kaiseki dinner.', meals: 'Breakfast, Dinner', stay: 'Kyoto Heritage Hotel' },
      { day: 7, title: 'Departures', desc: 'Breakfast and private bullet train or airport connection.', meals: 'Breakfast', stay: 'None' }
    ]
  },
  {
    agentIdx: 1,
    title: '10-Day Hokkaido Winter Wildlife & Onsen Traverse',
    slug: '10-day-hokkaido-winter-wildlife-onsen-traverse',
    dest: 'Sapporo & Shiretoko, Japan', country: 'Japan', region: 'Asia', category: 'Asia', activity: 'Adventure',
    days: 10, nights: 9, guests: 8, price: 289000, featured: 1,
    desc: 'Traverse snowy Hokkaido from Sapporo to the drift-ice sea of Shiretoko. Observe Steller sea eagles, red-crowned cranes, and bathe in volcanic hot springs.',
    short: 'Drift ice cruising, rare snow cranes, and steaming volcanic onsens.',
    images: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80']
  },
  {
    agentIdx: 1,
    title: '6-Day Vietnam Halong Bay Luxury Cruise & Sapa Terraces',
    slug: '6-day-vietnam-halong-bay-luxury-cruise-sapa-terraces',
    dest: 'Halong Bay & Sapa, Vietnam', country: 'Vietnam', region: 'Asia', category: 'Asia', activity: 'Adventure',
    days: 6, nights: 5, guests: 10, price: 125000, featured: 0,
    desc: 'Sail through emerald karst waters aboard a boutique wooden junk, then trek through high-altitude misty rice terraces of Muong Hoa valley.',
    short: 'Boutique karst cruising and mountain treks through ethnic hill-tribe villages.',
    images: ['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 1,
    title: '8-Day Bali Cultural Heartlands & Nusa Penida Marine Safari',
    slug: '8-day-bali-cultural-heartlands-nusa-penida-marine-safari',
    dest: 'Ubud & Nusa Penida, Indonesia', country: 'Indonesia', region: 'Asia', category: 'Asia', activity: 'Relaxation',
    days: 8, nights: 7, guests: 12, price: 148000, featured: 1,
    desc: 'Unwind in Ubud jungle villas, practice private yoga at dawn, and snorkel with giant manta rays along the cliffside beaches of Nusa Penida.',
    short: 'Jungle retreats, volcanic sunrise hikes, and manta ray snorkeling.',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 1,
    title: '9-Day Golden Triangle & Royal Palaces of Rajasthan',
    slug: '9-day-golden-triangle-royal-palaces-of-rajasthan',
    dest: 'Jaipur, Agra & Delhi, India', country: 'India', region: 'Asia', category: 'Asia', activity: 'Cultural',
    days: 9, nights: 8, guests: 10, price: 195000, featured: 0,
    desc: 'Witness the sunrise over the Taj Mahal, explore pink stone fortresses in Jaipur, and stay in royal heritage palaces with private local historians.',
    short: 'The iconic Taj Mahal, majestic Amber Fort, and royal Rajasthani hospitality.',
    images: ['https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 1,
    title: '12-Day Nepal Annapurna Sanctuary High Trek',
    slug: '12-day-nepal-annapurna-sanctuary-high-trek',
    dest: 'Pokhara & Annapurna, Nepal', country: 'Nepal', region: 'Asia', category: 'Asia', activity: 'Hiking & Trekking',
    days: 12, nights: 11, guests: 8, price: 210000, featured: 1,
    desc: 'A classic Himalayan expedition to the 4,130m natural amphitheater of Annapurna Base Camp surrounded by towering 8,000m peaks.',
    short: 'Spectacular Himalayan high trekking guided by veteran Sherpa mountaineers.',
    images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 1,
    title: '5-Day Maldives Luxury Overwater Villa Retreat',
    slug: '5-day-maldives-luxury-overwater-villa-retreat',
    dest: 'Baa Atoll, Maldives', country: 'Maldives', region: 'Asia', category: 'Asia', activity: 'Relaxation',
    days: 5, nights: 4, guests: 4, price: 340000, featured: 1,
    desc: 'Unmatched private overwater living in Baa Atoll UNESCO biosphere reserve with personal butler, private seaplane transfers, and dolphin cruises.',
    short: 'Pristine turquoise lagoons, private infinity pools, and world-class reef diving.',
    images: ['https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 1,
    title: '7-Day Chiang Mai Elephant Sanctuary & Golden Triangle',
    slug: '7-day-chiang-mai-elephant-sanctuary-golden-triangle',
    dest: 'Chiang Mai, Thailand', country: 'Thailand', region: 'Asia', category: 'Asia', activity: 'Adventure',
    days: 7, nights: 6, guests: 10, price: 135000, featured: 0,
    desc: 'Ethical elephant interaction, mountain tribe homestays, traditional Thai cooking masterclasses, and temple excursions in northern Thailand.',
    short: 'Ethical wildlife encounters and northern Thai culinary secrets.',
    images: ['https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 1,
    title: '8-Day Cappadocia Hot Air Balloons & Istanbul Byzantine Treasures',
    slug: '8-day-cappadocia-hot-air-balloons-istanbul-byzantine-treasures',
    dest: 'Istanbul & Cappadocia, Turkey', country: 'Turkey', region: 'Asia', category: 'Asia', activity: 'Cultural',
    days: 8, nights: 7, guests: 10, price: 172000, featured: 1,
    desc: 'Float in a hot air balloon over lunar fairy chimneys in Cappadocia, followed by private access to Hagia Sophia, Topkapi Palace, and Bosphorus sunset cruising.',
    short: 'Sunrise ballooning over fairy chimneys and Grand Bazaar discoveries.',
    images: ['https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 1,
    title: '6-Day Sri Lanka Tea Plantations & Yala Leopard Safari',
    slug: '6-day-sri-lanka-tea-plantations-yala-leopard-safari',
    dest: 'Ella & Yala, Sri Lanka', country: 'Sri Lanka', region: 'Asia', category: 'Asia', activity: 'Adventure',
    days: 6, nights: 5, guests: 8, price: 142000, featured: 0,
    desc: 'Ride the picturesque blue train through Ceylon tea hills, scale Sigiriya rock fortress, and track leopards in Yala National Park.',
    short: 'Scenic highland train journeys, ancient rock fortresses, and leopard safaris.',
    images: ['https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80']
  },

  // --- EUROPE (Agent Elena or Mateo) ---
  {
    agentIdx: 0,
    title: '7-Day Northern Lights & Fjord Expedition',
    slug: '7-day-northern-lights-fjord-expedition',
    dest: 'Tromsø, Norway', country: 'Norway', region: 'Europe', category: 'Europe', activity: 'Adventure',
    days: 7, nights: 6, guests: 10, price: 189900, featured: 1,
    desc: 'Experience the mesmerizing Aurora Borealis, sail through majestic Norwegian fjords, and stay in glass-top wilderness igloos.',
    short: 'Chasing the Northern Lights through pristine Nordic fjords and arctic wilderness.',
    images: ['https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80']
  },
  {
    agentIdx: 0,
    title: '8-Day Iceland South Coast & Ice Cave Glacier Traverse',
    slug: '8-day-iceland-south-coast-ice-cave-glacier-traverse',
    dest: 'Reykjavik & Vik, Iceland', country: 'Iceland', region: 'Europe', category: 'Europe', activity: 'Adventure',
    days: 8, nights: 7, guests: 8, price: 245000, featured: 1,
    desc: 'Explore blue crystal ice caves in Vatnajokull, diamond black sand beaches, roaring Skogafoss waterfalls, and geothermal hot springs.',
    short: 'Crystal ice caves, black sand beaches, and geothermal lagoons.',
    images: ['https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 0,
    title: '6-Day Swiss Alps Zermatt Matterhorn & Glacier Express',
    slug: '6-day-swiss-alps-zermatt-matterhorn-glacier-express',
    dest: 'Zermatt & St. Moritz, Switzerland', country: 'Switzerland', region: 'Europe', category: 'Europe', activity: 'Hiking & Trekking',
    days: 6, nights: 5, guests: 8, price: 265000, featured: 1,
    desc: 'Ride the world-renowned Glacier Express through alpine passes, stay at 5-star mountain chalets overlooking the Matterhorn, and taste authentic Swiss fondues.',
    short: 'Iconic Matterhorn vistas, scenic alpine rail, and luxury mountain lodges.',
    images: ['https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 2,
    title: '7-Day Amalfi Coast Private Catamaran & Capri Island Retreat',
    slug: '7-day-amalfi-coast-private-catamaran-capri-island-retreat',
    dest: 'Positano & Capri, Italy', country: 'Italy', region: 'Europe', category: 'Europe', activity: 'Luxury & Relaxation',
    days: 7, nights: 6, guests: 6, price: 298000, featured: 1,
    desc: 'Sail private catamarans along the dramatic limestone cliffs of Positano, Ravello, and the Blue Grotto of Capri, enjoying private chef dinners each evening.',
    short: 'Exclusive yachting along the Italian coastline with private cliffside villa stays.',
    images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 2,
    title: '8-Day Greek Cyclades Islands: Santorini, Naxos & Paros',
    slug: '8-day-greek-cyclades-islands-santorini-naxos-paros',
    dest: 'Santorini & Naxos, Greece', country: 'Greece', region: 'Europe', category: 'Europe', activity: 'Cultural',
    days: 8, nights: 7, guests: 10, price: 215000, featured: 1,
    desc: 'Iconic blue-domed white villages, private sunset sailing in the Caldera, authentic olive oil tasting in Naxos, and pristine Aegean swimming coves.',
    short: 'Whitewashed villages, Caldera sunsets, and authentic Aegean hospitality.',
    images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 2,
    title: '7-Day Tuscany Vineyard Estates & Renaissance Florence',
    slug: '7-day-tuscany-vineyard-estates-renaissance-florence',
    dest: 'Florence & Chianti, Italy', country: 'Italy', region: 'Europe', category: 'Europe', activity: 'Culinary & Wine',
    days: 7, nights: 6, guests: 8, price: 220000, featured: 0,
    desc: 'Private after-hours tours of the Uffizi Gallery, truffle hunting in San Miniato forests, and stays at 16th-century Chianti wine estates.',
    short: 'World-renowned Brunello wines, private Renaissance art tours, and truffle hunting.',
    images: ['https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 0,
    title: '6-Day Scottish Highlands & Isle of Skye Castle Expedition',
    slug: '6-day-scottish-highlands-isle-of-skye-castle-expedition',
    dest: 'Isle of Skye & Inverness, Scotland', country: 'United Kingdom', region: 'Europe', category: 'Europe', activity: 'Adventure',
    days: 6, nights: 5, guests: 8, price: 168000, featured: 0,
    desc: 'Trek the mystical Quiraing ridge, discover historic Eilean Donan Castle, and sample rare single malt whiskies in traditional Speyside distilleries.',
    short: 'Dramatic sea lochs, ancient castles, and single malt tasting trails.',
    images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 2,
    title: '8-Day Andalusia Moorish Palaces & Flamenco Trails',
    slug: '8-day-andalusia-moorish-palaces-flamenco-trails',
    dest: 'Seville & Granada, Spain', country: 'Spain', region: 'Europe', category: 'Europe', activity: 'Cultural',
    days: 8, nights: 7, guests: 10, price: 185000, featured: 0,
    desc: 'Private night tours of the Alhambra Palace in Granada, authentic flamenco tablaos in Seville, and tastings of Iberian ham in Jabugo.',
    short: 'Moorish architectural wonders, private Alhambra access, and authentic tapas.',
    images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 0,
    title: '5-Day Norwegian Lofoten Islands Fishing Villages & Peaks',
    slug: '5-day-norwegian-lofoten-islands-fishing-villages-peaks',
    dest: 'Lofoten, Norway', country: 'Norway', region: 'Europe', category: 'Europe', activity: 'Hiking & Trekking',
    days: 5, nights: 4, guests: 6, price: 175000, featured: 0,
    desc: 'Stay in restored waterfront rorbuer cabins, hike Reinebringen peak for world-class panoramic views, and kayak pristine arctic fjords.',
    short: 'Red fisherman cabins, steep alpine granite walls, and midnight sun treks.',
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 2,
    title: '7-Day Provence Lavender Fields & French Riviera Yachting',
    slug: '7-day-provence-lavender-fields-french-riviera-yachting',
    dest: 'Nice & Aix-en-Provence, France', country: 'France', region: 'Europe', category: 'Europe', activity: 'Luxury & Relaxation',
    days: 7, nights: 6, guests: 8, price: 275000, featured: 0,
    desc: 'Wander through purple blooming lavender valleys in Valensole, explore medieval hilltop villages, and sail the French Riviera from Cannes to Monaco.',
    short: 'Fragrant lavender plateaus, Michelin dining, and Côte d’Azur yacht charters.',
    images: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80']
  },

  // --- AMERICAS (Agent Camila) ---
  {
    agentIdx: 4,
    title: '8-Day Peru Machu Picchu & Sacred Valley Luxury Trek',
    slug: '8-day-peru-machu-picchu-sacred-valley-luxury-trek',
    dest: 'Cusco & Machu Picchu, Peru', country: 'Peru', region: 'Americas', category: 'Americas', activity: 'Cultural',
    days: 8, nights: 7, guests: 10, price: 215000, featured: 1,
    desc: 'Hike the classic Inca trail with luxury glamping, private permits to Huayna Picchu, and deep cultural immersion with Andean textile weavers.',
    short: 'Iconic Incan citadel at sunrise, luxury Andean rail, and sacred ruins.',
    images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 4,
    title: '10-Day Chilean Patagonia Torres del Paine W-Trek',
    slug: '10-day-chilean-patagonia-torres-del-paine-w-trek',
    dest: 'Torres del Paine & Puerto Natales, Chile', country: 'Chile', region: 'Americas', category: 'Americas', activity: 'Hiking & Trekking',
    days: 10, nights: 9, guests: 8, price: 310000, featured: 1,
    desc: 'Trek beneath the granite towers of Paine, witness icebergs calving from Grey Glacier, and stay in eco-domes surrounded by guanacos and condors.',
    short: 'Dramatic granite spires, blue glacial lakes, and sustainable eco-dome stays.',
    images: ['https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 4,
    title: '7-Day Costa Rica Rainforest Canopies & Arenal Volcano',
    slug: '7-day-costa-rica-rainforest-canopies-arenal-volcano',
    dest: 'Arenal & Monteverde, Costa Rica', country: 'Costa Rica', region: 'Americas', category: 'Americas', activity: 'Adventure',
    days: 7, nights: 6, guests: 12, price: 145000, featured: 1,
    desc: 'Soar through cloud forest zip-lines, relax in natural volcanic hot springs, and observe sloths, toucans, and poison dart frogs with naturalist guides.',
    short: 'Pura Vida eco-adventures, active volcano vistas, and bioluminescent bays.',
    images: ['https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 4,
    title: '7-Day Canadian Rockies Banff & Jasper Icefields Explorer',
    slug: '7-day-canadian-rockies-banff-jasper-icefields-explorer',
    dest: 'Banff & Jasper, Canada', country: 'Canada', region: 'Americas', category: 'Americas', activity: 'Adventure',
    days: 7, nights: 6, guests: 8, price: 228000, featured: 1,
    desc: 'Canoe across turquoise Lake Louise and Moraine Lake, drive the stunning Icefields Parkway, and walk upon the Athabasca Glacier.',
    short: 'Turquoise glacial lakes, towering Rocky peaks, and abundant wildlife.',
    images: ['https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 4,
    title: '9-Day Brazilian Amazon Rainforest Riverboat Expedition',
    slug: '9-day-brazilian-amazon-rainforest-riverboat-expedition',
    dest: 'Manaus & Rio Negro, Brazil', country: 'Brazil', region: 'Americas', category: 'Americas', activity: 'Adventure',
    days: 9, nights: 8, guests: 8, price: 235000, featured: 0,
    desc: 'Navigate deep into the Rio Negro tributaries aboard a private expedition boat. Swim with pink river dolphins and fish for piranhas.',
    short: 'Deep Amazon biodiversity, pink river dolphins, and nocturnal safari canoe trips.',
    images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 4,
    title: '6-Day USA Grand Canyon, Zion & Bryce Canyons Traverse',
    slug: '6-day-usa-grand-canyon-zion-bryce-canyons-traverse',
    dest: 'Utah & Arizona, USA', country: 'United States', region: 'Americas', category: 'Americas', activity: 'Hiking & Trekking',
    days: 6, nights: 5, guests: 8, price: 189000, featured: 0,
    desc: 'Hike the world-famous Narrows in Zion, marvel at red hoodoos in Bryce Canyon, and enjoy helicopter flights over the Grand Canyon South Rim.',
    short: 'Spectacular red-rock slot canyons and dramatic desert vistas.',
    images: ['https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 4,
    title: '7-Day Oaxaca Culinary Heritage & Mezcal Distilleries',
    slug: '7-day-oaxaca-culinary-heritage-mezcal-distilleries',
    dest: 'Oaxaca, Mexico', country: 'Mexico', region: 'Americas', category: 'Americas', activity: 'Culinary & Wine',
    days: 7, nights: 6, guests: 10, price: 139000, featured: 0,
    desc: 'Master the art of authentic moles with indigenous culinary chefs, visit small-batch artisanal mezcal palenques, and explore Zapotec ruins at Monte Albán.',
    short: 'Ancestral mole cooking, artisanal mezcal tastings, and vibrant artisan markets.',
    images: ['https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 4,
    title: '8-Day Galapagos Islands Naturalist Catamaran Cruise',
    slug: '8-day-galapagos-islands-naturalist-catamaran-cruise',
    dest: 'Galapagos Islands, Ecuador', country: 'Ecuador', region: 'Americas', category: 'Americas', activity: 'Adventure',
    days: 8, nights: 7, guests: 8, price: 385000, featured: 1,
    desc: 'Swim alongside marine iguanas, green sea turtles, and playful sea lion pups under the guidance of certified Charles Darwin Foundation naturalists.',
    short: 'Pristine wildlife encounters with giant tortoises and blue-footed boobies.',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 4,
    title: '8-Day Alaska Kenai Fjords & Denali Wildlife Safari',
    slug: '8-day-alaska-kenai-fjords-denali-wildlife-safari',
    dest: 'Anchorage & Denali, USA', country: 'United States', region: 'Americas', category: 'Americas', activity: 'Adventure',
    days: 8, nights: 7, guests: 8, price: 265000, featured: 0,
    desc: 'Observe grizzly bears catching wild salmon, cruise beside tidewater glaciers calving into the sea, and marvel at North America highest peak.',
    short: 'Grizzly bears, humpback whales, and massive tidewater glaciers.',
    images: ['https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 4,
    title: '6-Day Atacama Stargazing & Geysers Desert Discovery',
    slug: '6-day-atacama-stargazing-geysers-desert-discovery',
    dest: 'San Pedro de Atacama, Chile', country: 'Chile', region: 'Americas', category: 'Americas', activity: 'Adventure',
    days: 6, nights: 5, guests: 8, price: 178000, featured: 0,
    desc: 'Float in hypersaline turquoise desert lagoons, observe El Tatio geothermal geysers at sunrise, and experience the clearest dark-sky astronomy on Earth.',
    short: 'High-altitude salt flats, flamingos, and world-class astronomical stargazing.',
    images: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80']
  },

  // --- AFRICA (Agent Amara) ---
  {
    agentIdx: 3,
    title: '8-Day Serengeti Great Migration & Ngorongoro Crater Safari',
    slug: '8-day-serengeti-great-migration-ngorongoro-safari',
    dest: 'Serengeti & Ngorongoro, Tanzania', country: 'Tanzania', region: 'Africa', category: 'Africa', activity: 'Adventure',
    days: 8, nights: 7, guests: 6, price: 345000, featured: 1,
    desc: 'Witness millions of wildebeest crossing the Mara River, track the Big Five in the volcanic caldera of Ngorongoro, and stay in luxury mobile tented camps.',
    short: 'The greatest wildlife spectacle on Earth with luxury eco-lodge camps.',
    images: ['https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 3,
    title: '7-Day Kenya Masai Mara Big Cats & Samburu Wildlife',
    slug: '7-day-kenya-masai-mara-big-cats-samburu',
    dest: 'Masai Mara, Kenya', country: 'Kenya', region: 'Africa', category: 'Africa', activity: 'Adventure',
    days: 7, nights: 6, guests: 6, price: 295000, featured: 1,
    desc: 'Track lions, leopards, and cheetahs with Maasai warrior guides, experience sunrise hot air balloon safaris, and learn conservation initiatives.',
    short: 'Predator tracking, hot air balloon flights, and authentic Maasai cultural encounters.',
    images: ['https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 3,
    title: '9-Day Egypt Nile Cruise, Giza Pyramids & Luxor Tombs',
    slug: '9-day-egypt-nile-cruise-giza-pyramids-luxor',
    dest: 'Cairo & Luxor, Egypt', country: 'Egypt', region: 'Africa', category: 'Africa', activity: 'Cultural',
    days: 9, nights: 8, guests: 12, price: 185000, featured: 1,
    desc: 'Private Egyptologist guidance through the King Tutankhamun treasures, sail the historic Nile aboard a 5-star dahabiya, and enter the Valley of the Kings.',
    short: '5,000 years of civilization, private pyramid access, and luxury Nile cruising.',
    images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 3,
    title: '7-Day Morocco Imperial Cities & Sahara Desert Luxury Camp',
    slug: '7-day-morocco-imperial-cities-sahara-desert-camp',
    dest: 'Marrakech & Merzouga, Morocco', country: 'Morocco', region: 'Africa', category: 'Africa', activity: 'Cultural',
    days: 7, nights: 6, guests: 10, price: 165000, featured: 1,
    desc: 'Ride camels over golden Erg Chebbi dunes, sleep beneath star-filled Saharan skies in luxury nomad tents, and explore Marrakech vibrant souks.',
    short: 'Golden desert dunes, Arabian hospitality, and aromatic spice markets.',
    images: ['https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 3,
    title: '8-Day South Africa Cape Town, Winelands & Kruger Safari',
    slug: '8-day-south-africa-cape-town-winelands-kruger-safari',
    dest: 'Cape Town & Kruger, South Africa', country: 'South Africa', region: 'Africa', category: 'Africa', activity: 'Adventure',
    days: 8, nights: 7, guests: 8, price: 275000, featured: 1,
    desc: 'Ascend Table Mountain, taste world-class Pinotage in Stellenbosch vineyards, and embark on open-top game drives searching for leopards and rhinos.',
    short: 'Breathtaking coastal drives, Cape Winelands dining, and Big Five safari.',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 3,
    title: '9-Day Madagascar Baobabs & Lemur Rainforest Expedition',
    slug: '9-day-madagascar-baobabs-lemur-rainforest',
    dest: 'Morondava & Andasibe, Madagascar', country: 'Madagascar', region: 'Africa', category: 'Africa', activity: 'Adventure',
    days: 9, nights: 8, guests: 8, price: 215000, featured: 0,
    desc: 'Walk the famous Avenue of the Baobabs at sunset, track rare Indri lemurs in cloud forests, and relax on pristine coral beaches.',
    short: 'Enormous ancient baobab trees, endemic lemur species, and untouched beaches.',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 3,
    title: '8-Day Namibia Sossusvlei Dunes & Etosha Safari',
    slug: '8-day-namibia-sossusvlei-dunes-etosha-safari',
    dest: 'Sossusvlei & Etosha, Namibia', country: 'Namibia', region: 'Africa', category: 'Africa', activity: 'Adventure',
    days: 8, nights: 7, guests: 6, price: 285000, featured: 0,
    desc: 'Climb the towering red sand Dune 45, photograph the ancient ghost trees of Deadvlei, and observe rhinos at illuminated desert waterholes.',
    short: 'Towering red sand dunes, dramatic Skeleton Coast, and desert-adapted elephants.',
    images: ['https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 3,
    title: '5-Day Rwanda Mountain Gorilla Tracking in Volcanoes Park',
    slug: '5-day-rwanda-mountain-gorilla-tracking-volcanoes',
    dest: 'Volcanoes National Park, Rwanda', country: 'Rwanda', region: 'Africa', category: 'Africa', activity: 'Adventure',
    days: 5, nights: 4, guests: 6, price: 420000, featured: 1,
    desc: 'An intimate, once-in-a-lifetime encounter spending one hour face-to-face with endangered mountain gorillas in their mist-shrouded bamboo home.',
    short: 'Intimate, life-changing encounters with wild mountain gorilla families.',
    images: ['https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 3,
    title: '7-Day Victoria Falls & Botswana Chobe River Cruise',
    slug: '7-day-victoria-falls-botswana-chobe-cruise',
    dest: 'Victoria Falls & Chobe, Zimbabwe & Botswana', country: 'Botswana', region: 'Africa', category: 'Africa', activity: 'Adventure',
    days: 7, nights: 6, guests: 8, price: 235000, featured: 0,
    desc: 'Witness the thundering Smoke that Thunders at Victoria Falls, then boat along Chobe River witnessing hundreds of swimming elephants.',
    short: 'The thunderous Victoria Falls and massive elephant herds of Chobe.',
    images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 3,
    title: '6-Day Zanzibar Spice Island & Private Sandbank Escape',
    slug: '6-day-zanzibar-spice-island-private-sandbank',
    dest: 'Stone Town & Nungwi, Zanzibar', country: 'Tanzania', region: 'Africa', category: 'Africa', activity: 'Relaxation',
    days: 6, nights: 5, guests: 8, price: 135000, featured: 0,
    desc: 'Explore the carved wooden doors of historic Stone Town, tour organic clove plantations, and swim in turquoise waters on isolated private sandbanks.',
    short: 'Exotic Swahili spice markets, dhow sunset cruises, and white sand beaches.',
    images: ['https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80']
  },

  // --- OCEANIA (Agent Liam) ---
  {
    agentIdx: 6,
    title: '8-Day Great Barrier Reef & Daintree Rainforest Eco Safari',
    slug: '8-day-great-barrier-reef-daintree-rainforest',
    dest: 'Cairns & Port Douglas, Australia', country: 'Australia', region: 'Oceania', category: 'Oceania', activity: 'Adventure',
    days: 8, nights: 7, guests: 10, price: 245000, featured: 1,
    desc: 'Dive and snorkel on outer ribbon coral reefs with marine biologists, and walk with Kuku Yalanji traditional owners through the ancient Daintree.',
    short: 'Pristine outer reef snorkeling, ancient rainforest walks, and luxury lodge stays.',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 6,
    title: '10-Day New Zealand South Island Fjordlands & Southern Alps',
    slug: '10-day-new-zealand-south-island-fjordlands',
    dest: 'Queenstown & Milford Sound, New Zealand', country: 'New Zealand', region: 'Oceania', category: 'Oceania', activity: 'Hiking & Trekking',
    days: 10, nights: 9, guests: 8, price: 320000, featured: 1,
    desc: 'Overnight cruising on Milford Sound beneath roaring waterfalls, helicopter glacier landings on Mount Cook, and jet-boating turquoise river canyons.',
    short: 'Dramatic glacier fjords, alpine peaks, and world-capital adventure thrill.',
    images: ['https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 6,
    title: '6-Day Fiji Yasawa Islands Private Lagoon Catamaran',
    slug: '6-day-fiji-yasawa-islands-private-catamaran',
    dest: 'Yasawa Islands, Fiji', country: 'Fiji', region: 'Oceania', category: 'Oceania', activity: 'Relaxation',
    days: 6, nights: 5, guests: 6, price: 265000, featured: 1,
    desc: 'Charter a luxury catamaran through the isolated Yasawa chain, swim inside Blue Lagoon volcanic caves, and experience traditional Fijian kava ceremonies.',
    short: 'Secluded tropical island hopping, coral reef snorkeling, and warm Polynesian hospitality.',
    images: ['https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 6,
    title: '7-Day Australian Red Centre Uluru & Kings Canyon Traverse',
    slug: '7-day-australian-red-centre-uluru-kings-canyon',
    dest: 'Uluru & Alice Springs, Australia', country: 'Australia', region: 'Oceania', category: 'Oceania', activity: 'Cultural',
    days: 7, nights: 6, guests: 8, price: 215000, featured: 0,
    desc: 'Watch the spiritual sunrise lighting up the red sandstone monolith of Uluru, trek the dramatic rim of Kings Canyon, and dine under desert stars.',
    short: 'Ancient Anangu indigenous culture, crimson monoliths, and desert dining.',
    images: ['https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 6,
    title: '7-Day French Polynesia Bora Bora & Moorea Lagoon Overwater',
    slug: '7-day-french-polynesia-bora-bora-moorea',
    dest: 'Bora Bora, French Polynesia', country: 'French Polynesia', region: 'Oceania', category: 'Oceania', activity: 'Luxury & Relaxation',
    days: 7, nights: 6, guests: 4, price: 410000, featured: 1,
    desc: 'Iconic overwater thatched bungalows with glass floors over swimming stingrays, Mount Otemanu views, and private motu picnic lunches.',
    short: 'The pinnacle of South Pacific romance with turquoise lagoon bungalows.',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80']
  },

  // --- MIDDLE EAST (Agent Tariq) ---
  {
    agentIdx: 5,
    title: '7-Day Jordan Petra Rose City & Wadi Rum Martian Desert',
    slug: '7-day-jordan-petra-rose-city-wadi-rum-desert',
    dest: 'Petra & Wadi Rum, Jordan', country: 'Jordan', region: 'Middle East', category: 'Middle East', activity: 'Cultural',
    days: 7, nights: 6, guests: 10, price: 175000, featured: 1,
    desc: 'Walk through the dramatic Siq gorge to the Treasury by candlelight, ride 4x4s across Lawrence of Arabia red sands in Wadi Rum, and float in the Dead Sea.',
    short: 'Ancient Nabataean wonders, Bedouin starry desert camps, and Dead Sea floating.',
    images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 5,
    title: '5-Day Dubai Burj Khalifa, Private Dunes & Desert Falconry',
    slug: '5-day-dubai-burj-khalifa-private-dunes-falconry',
    dest: 'Dubai, UAE', country: 'United Arab Emirates', region: 'Middle East', category: 'Middle East', activity: 'Luxury & Relaxation',
    days: 5, nights: 4, guests: 6, price: 235000, featured: 1,
    desc: 'Private VIP lounge access at Burj Khalifa 148th floor, luxury desert conservation reserve resort with royal falconry demonstrations and sunset dune dining.',
    short: 'Futuristic architectural heights, private luxury desert oases, and falconry.',
    images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 5,
    title: '8-Day Oman Fjords of Musandam & Wahiba Sands Luxury',
    slug: '8-day-oman-fjords-musandam-wahiba-sands',
    dest: 'Muscat & Wahiba Sands, Oman', country: 'Oman', region: 'Middle East', category: 'Middle East', activity: 'Adventure',
    days: 8, nights: 7, guests: 8, price: 220000, featured: 0,
    desc: 'Sail traditional wooden dhows through Arabian fjords watching dolphins, swim in turquoise mountain wadis, and sleep in five-star desert camps.',
    short: 'Arabian fjords, emerald mountain wadis, and Frankincense heritage.',
    images: ['https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 5,
    title: '9-Day Silk Road Uzbekistan Samarkand & Bukhara Minarets',
    slug: '9-day-silk-road-uzbekistan-samarkand-bukhara',
    dest: 'Samarkand & Bukhara, Uzbekistan', country: 'Uzbekistan', region: 'Middle East', category: 'Middle East', activity: 'Cultural',
    days: 9, nights: 8, guests: 10, price: 185000, featured: 0,
    desc: 'Marvel at the breathtaking turquoise tilework of Registan Square, explore ancient caravanserai trade routes, and learn silk carpet weaving traditions.',
    short: 'Majestic turquoise domes, ancient trading domes, and Silk Road lore.',
    images: ['https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80']
  },
  {
    agentIdx: 5,
    title: '6-Day Saudi Arabia AlUla Hegra & Elephant Rock Odyssey',
    slug: '6-day-saudi-arabia-alula-hegra-odyssey',
    dest: 'AlUla, Saudi Arabia', country: 'Saudi Arabia', region: 'Middle East', category: 'Middle East', activity: 'Cultural',
    days: 6, nights: 5, guests: 6, price: 295000, featured: 0,
    desc: 'Discover Hegra ancient rock-cut tombs carved by the Nabataeans, marvel at the world largest mirrored building Maraya, and dine amid desert canyons.',
    short: 'Untouched ancient Nabataean rock tombs and architectural desert marvels.',
    images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80']
  }
];

// Fill up to 65 packages by generating tailored variations across regions
const extraLocations = [
  { title: '7-Day Kyoto Autumn Leaves & Zen Tea Path', dest: 'Kyoto, Japan', country: 'Japan', region: 'Asia', cat: 'Asia', act: 'Cultural', price: 179000, agent: 1 },
  { title: '6-Day Tokyo Cyberpunk, Culinary & Mount Fuji', dest: 'Tokyo & Hakone, Japan', country: 'Japan', region: 'Asia', cat: 'Asia', act: 'Cultural', price: 165000, agent: 1 },
  { title: '8-Day Vietnam Heritage Trail: Hanoi, Hue & Hoi An', dest: 'Hoi An & Hue, Vietnam', country: 'Vietnam', region: 'Asia', cat: 'Asia', act: 'Cultural', price: 138000, agent: 1 },
  { title: '7-Day Thailand Phuket & Krabi Private Catamaran', dest: 'Phuket & Krabi, Thailand', country: 'Thailand', region: 'Asia', cat: 'Asia', act: 'Relaxation', price: 155000, agent: 1 },
  { title: '6-Day Cambodia Angkor Wat Sunrises & Floating Villages', dest: 'Siem Reap, Cambodia', country: 'Cambodia', region: 'Asia', cat: 'Asia', act: 'Cultural', price: 128000, agent: 1 },
  { title: '9-Day Kerala Backwaters Houseboat & Ayurvedic Spas', dest: 'Kerala, India', country: 'India', region: 'Asia', cat: 'Asia', act: 'Relaxation', price: 145000, agent: 1 },
  { title: '7-Day Seoul K-Culture, Palaces & Hanok Villages', dest: 'Seoul, South Korea', country: 'South Korea', region: 'Asia', cat: 'Asia', act: 'Cultural', price: 158000, agent: 1 },
  { title: '8-Day Italian Dolomites Mountain Lakes & Alpine Passes', dest: 'Dolomites & Bolzano, Italy', country: 'Italy', region: 'Europe', cat: 'Europe', act: 'Hiking & Trekking', price: 215000, agent: 2 },
  { title: '7-Day Norway Geirangerfjord & Atlantic Ocean Road', dest: 'Alesund & Geiranger, Norway', country: 'Norway', region: 'Europe', cat: 'Europe', act: 'Adventure', price: 195000, agent: 0 },
  { title: '8-Day Portugal Lisbon & Douro Valley Wine Cruise', dest: 'Porto & Douro, Portugal', country: 'Portugal', region: 'Europe', cat: 'Europe', act: 'Culinary & Wine', price: 178000, agent: 2 },
  { title: '6-Day Austria Salzburg & Hallstatt Alpine Lakes', dest: 'Salzburg & Hallstatt, Austria', country: 'Austria', region: 'Europe', cat: 'Europe', act: 'Cultural', price: 162000, agent: 2 },
  { title: '7-Day Croatia Dubrovnik & Split Island Catamaran', dest: 'Dubrovnik & Hvar, Croatia', country: 'Croatia', region: 'Europe', cat: 'Europe', act: 'Relaxation', price: 198000, agent: 2 },
  { title: '8-Day Irish Wild Atlantic Way & Ring of Kerry', dest: 'Killarney & Galway, Ireland', country: 'Ireland', region: 'Europe', cat: 'Europe', act: 'Adventure', price: 175000, agent: 0 },
  { title: '7-Day Argentina Buenos Aires & Mendoza Wine Estates', dest: 'Mendoza & Buenos Aires, Argentina', country: 'Argentina', region: 'Americas', cat: 'Americas', act: 'Culinary & Wine', price: 185000, agent: 4 },
  { title: '6-Day Yucatan Cenotes & Mayan Riviera Eco Retreat', dest: 'Tulum & Chichen Itza, Mexico', country: 'Mexico', region: 'Americas', cat: 'Americas', act: 'Cultural', price: 142000, agent: 4 },
  { title: '8-Day Colombia Coffee Triangle & Cartagena Colonial', dest: 'Cartagena & Salento, Colombia', country: 'Colombia', region: 'Americas', cat: 'Americas', act: 'Cultural', price: 152000, agent: 4 },
  { title: '6-Day Belize Barrier Reef & Blue Hole Diving', dest: 'Ambergris Caye, Belize', country: 'Belize', region: 'Americas', cat: 'Americas', act: 'Adventure', price: 192000, agent: 4 },
  { title: '7-Day Tanzania Kilimanjaro Machame Scenic Ascent', dest: 'Kilimanjaro, Tanzania', country: 'Tanzania', region: 'Africa', cat: 'Africa', act: 'Hiking & Trekking', price: 245000, agent: 3 },
  { title: '8-Day Botswana Okavango Delta Mokoro Canoe Safari', dest: 'Okavango Delta, Botswana', country: 'Botswana', region: 'Africa', cat: 'Africa', act: 'Adventure', price: 385000, agent: 3 },
  { title: '6-Day Egypt Red Sea Hurghada & Sharm El Sheikh Diving', dest: 'Hurghada, Egypt', country: 'Egypt', region: 'Africa', cat: 'Africa', act: 'Relaxation', price: 135000, agent: 3 },
  { title: '8-Day New Zealand North Island Rotorua & Bay of Islands', dest: 'Rotorua & Auckland, New Zealand', country: 'New Zealand', region: 'Oceania', cat: 'Oceania', act: 'Adventure', price: 235000, agent: 6 },
  { title: '7-Day Australia Sydney Harbor, Blue Mountains & Hunter Valley', dest: 'Sydney & Hunter Valley, Australia', country: 'Australia', region: 'Oceania', cat: 'Oceania', act: 'Culinary & Wine', price: 210000, agent: 6 },
  { title: '6-Day Tahiti & Moorea Catamaran Sailing Escape', dest: 'Tahiti, French Polynesia', country: 'French Polynesia', region: 'Oceania', cat: 'Oceania', act: 'Relaxation', price: 285000, agent: 6 }
];

for (const extra of extraLocations) {
  rawPackages.push({
    agentIdx: extra.agent,
    title: extra.title,
    slug: extra.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    dest: extra.dest,
    country: extra.country,
    region: extra.region,
    category: extra.cat,
    activity: extra.act,
    days: parseInt(extra.title) || 7,
    nights: (parseInt(extra.title) || 7) - 1,
    guests: 8,
    price: extra.price,
    featured: 0,
    desc: `Experience the remarkable wonders of ${extra.dest}. An expertly organized travel itinerary with boutique stays and certified local guides.`,
    short: `Remarkable travel package across ${extra.dest} with verified local operators.`,
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']
  });
}

console.log(`Total package definitions prepared: ${rawPackages.length}`);

const insertPackage = db.prepare(`
  INSERT INTO packages (
    agent_id, title, slug, description, short_description, destination, country, region,
    category, activity_type, duration_days, duration_nights, max_guests, price_amount, price_currency,
    inclusions, exclusions, highlights, meeting_point, status, featured
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?
  )
`);

const insertDay = db.prepare(`
  INSERT INTO itinerary_days (package_id, day_number, title, description, meals, accommodation)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertImg = db.prepare(`
  INSERT INTO package_images (package_id, image_url, alt_text, is_primary, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);

const insertDate = db.prepare(`
  INSERT INTO package_dates (package_id, start_date, end_date, available_slots, booked_slots, status)
  VALUES (?, ?, ?, ?, ?, 'available')
`);

const packageIds = [];
const allPackageDateIds = [];

for (let i = 0; i < rawPackages.length; i++) {
  const p = rawPackages[i];
  const agentId = agentIds[p.agentIdx % agentIds.length];

  const pkgRes = insertPackage.run(
    agentId,
    p.title,
    p.slug,
    p.desc,
    p.short,
    p.dest,
    p.country,
    p.region,
    p.category,
    p.activity,
    p.days,
    p.nights,
    p.guests || 8,
    p.price,
    'USD',
    'All boutique accommodations\nDaily curated breakfasts and select dinners\nPrivate licensed local guides and temple/park passes\nAirport arrival and departure transfers\nPrivate air-conditioned group transit',
    'International flights\nPersonal shopping expenditures\nTravel and medical insurance',
    'Exclusive small-group access\nCertified local cultural experts\nHandpicked boutique hotels and eco-lodges',
    'Primary airport arrival terminal or central hotel lobby at 09:00 AM',
    p.featured || (i < 8 ? 1 : 0)
  );

  const pkgId = pkgRes.lastInsertRowid;
  packageIds.push(pkgId);

  // Add Itinerary Days
  if (p.itinerary && p.itinerary.length) {
    for (const d of p.itinerary) {
      insertDay.run(pkgId, d.day, d.title, d.desc, d.meals, d.stay);
    }
  } else {
    // Generate standard 5-7 days itinerary
    for (let day = 1; day <= p.days; day++) {
      insertDay.run(
        pkgId,
        day,
        day === 1 ? 'Arrival & Welcome Dinner' : day === p.days ? 'Farewell & Departure Transfers' : `Guided Exploration of ${p.dest} - Day ${day}`,
        `Comprehensive guided tour visiting key landmarks, heritage monuments, and local artisan spots in ${p.dest}.`,
        day === 1 ? 'Dinner' : day === p.days ? 'Breakfast' : 'Breakfast, Lunch',
        `Boutique Hotel in ${p.dest}`
      );
    }
  }

  // Add Images
  const imgs = p.images || ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'];
  for (let imgIdx = 0; imgIdx < imgs.length; imgIdx++) {
    insertImg.run(pkgId, imgs[imgIdx], p.title, imgIdx === 0 ? 1 : 0, imgIdx);
  }

  // Add 4 Departure Dates across 2026 and 2027
  const dates = [
    { start: '2026-10-15', end: '2026-10-22' },
    { start: '2026-11-10', end: '2026-11-17' },
    { start: '2027-01-12', end: '2027-01-19' },
    { start: '2027-03-20', end: '2027-03-27' },
    { start: '2027-05-15', end: '2027-05-22' }
  ];

  for (const dt of dates) {
    const dRes = insertDate.run(pkgId, dt.start, dt.end, 10, 0);
    allPackageDateIds.push({ id: dRes.lastInsertRowid, pkgId, agentId });
  }
}
console.log(`4. Seeded ${packageIds.length} Packages with Itineraries, Images, and Departure Dates.`);

// 6. CREATE AGENT PROMO CODES
const insertPromo = db.prepare(`
  INSERT INTO promo_codes (agent_id, code, discount_type, discount_value, min_order_amount, max_uses, active)
  VALUES (?, ?, ?, ?, ?, ?, 1)
`);

const promoCodes = [
  { agentIdx: 0, code: 'AURORA15', type: 'percentage', val: 15 },
  { agentIdx: 1, code: 'NIPPON10', type: 'percentage', val: 10 },
  { agentIdx: 2, code: 'AMALFI20', type: 'percentage', val: 20 },
  { agentIdx: 3, code: 'SAFARI15', type: 'percentage', val: 15 },
  { agentIdx: 4, code: 'ANDES25', type: 'percentage', val: 25 },
  { agentIdx: 5, code: 'ARABIA10', type: 'percentage', val: 10 },
  { agentIdx: 6, code: 'PACIFIC20', type: 'percentage', val: 20 },
  { agentIdx: 0, code: 'GLOBAL50', type: 'fixed', val: 5000 }
];

for (const pr of promoCodes) {
  insertPromo.run(agentIds[pr.agentIdx], pr.code, pr.type, pr.val, 50000, 100);
}
console.log('5. Seeded Promo Codes for all Tour Operators.');

// 7. CREATE 250 CUSTOMER ACCOUNTS WITH UNIQUE NAMES & EMAILS
const firstNames = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
  'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
  'Charles', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
  'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Melissa', 'George', 'Deborah', 'Timothy', 'Stephanie',
  'Ronald', 'Rebecca', 'Jason', 'Sharon', 'Edward', 'Laura', 'Jeffrey', 'Cynthia', 'Ryan', 'Dorothy',
  'Jacob', 'Amy', 'Gary', 'Kathleen', 'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Emma',
  'Stephen', 'Brenda', 'Larry', 'Pamela', 'Justin', 'Nicole', 'Scott', 'Anna', 'Brandon', 'Samantha',
  'Benjamin', 'Katherine', 'Samuel', 'Christine', 'Gregory', 'Debra', 'Alexander', 'Rachel', 'Frank', 'Carolyn',
  'Patrick', 'Janet', 'Raymond', 'Maria', 'Jack', 'Heather', 'Dennis', 'Diane', 'Jerry', 'Virginia'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes'
];

const travelerIds = [];
const travelerList = [];

// Seed primary verified traveler accounts
const primaryTravelers = [
  { name: 'Sophia Turner', email: 'sophia.traveler@example.com', phone: '+1 (555) 789-0123' },
  { name: 'Benedict Garcia', email: 'bmgarcia0121@gmail.com', phone: '+1 (555) 345-6789' },
  { name: 'Lisa Chen', email: 'lisa.chen@example.com', phone: '+1 (555) 901-2345' },
  { name: 'Marcus Vance', email: 'marcus.vance@example.com', phone: '+44 20 7946 0912' },
  { name: 'Clara Dubois', email: 'clara.dubois@example.com', phone: '+33 1 42 68 55 00' }
];

for (const pt of primaryTravelers) {
  const res = insertUser.run(pt.email, defaultPasswordHash, pt.name, 'user', pt.phone, null, null);
  travelerIds.push(res.lastInsertRowid);
  travelerList.push({ id: res.lastInsertRowid, name: pt.name, email: pt.email });
}

// Generate remaining up to 250 customers
let customerCount = travelerIds.length;
let nameIdx = 0;
while (customerCount < 250) {
  const f = firstNames[nameIdx % firstNames.length];
  const l = lastNames[Math.floor(nameIdx / firstNames.length) % lastNames.length];
  const num = customerCount + 10;
  const email = `${f.toLowerCase()}.${l.toLowerCase()}${num}@example.com`;
  const name = `${f} ${l}`;
  const phone = `+1 (555) ${String(100 + num).padStart(3, '0')}-${String(2000 + num).padStart(4, '0')}`;

  try {
    const res = insertUser.run(email, defaultPasswordHash, name, 'user', phone, null, null);
    travelerIds.push(res.lastInsertRowid);
    travelerList.push({ id: res.lastInsertRowid, name, email });
    customerCount++;
  } catch (err) {}
  nameIdx++;
}

console.log(`6. Seeded ${travelerIds.length} Unique Traveler Accounts.`);

// 8. CREATE 250+ REALISTIC BOOKINGS WITH VARIED STATUSES
const insertBooking = db.prepare(`
  INSERT INTO bookings (
    booking_ref, user_id, package_id, package_date_id, agent_id,
    guests_count, guest_names, contact_email, contact_phone,
    total_amount, currency, promo_code_id, discount_amount,
    status, payment_status, payment_method, special_requests, created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, 'USD', ?, ?,
    ?, ?, 'card', ?, datetime('now', ?), datetime('now')
  )
`);

const insertReview = db.prepare(`
  INSERT INTO reviews (user_id, package_id, booking_id, rating, comment, created_at)
  VALUES (?, ?, ?, ?, ?, datetime('now', ?))
`);

const reviewComments = [
  'Absolutely breathtaking journey from start to finish! Our guide was deeply knowledgeable and the accommodations exceeded expectations.',
  'Unforgettable adventure! The day-by-day organization was seamless, and the private excursions were the highlight of our year.',
  'Magnificent travel experience. The small group size and personal touches made this feel like a private bespoke tour.',
  'Outstanding service, top-notch communication, and wonderful local food. We are already looking forward to booking our next trip.',
  'Every single detail was thoughtfully planned. Highly recommended for anyone seeking authentic and memorable travel!',
  'A life-changing expedition! Stunning landscapes, world-class lodging, and friendly, professional local guides.',
  'Extremely well organized! The booking receipt and itinerary details were clear, and on-site support was phenomenal.'
];

const statuses = ['completed', 'completed', 'confirmed', 'confirmed', 'pending', 'cancelled'];

let bookingCount = 0;
for (let i = 0; i < travelerList.length; i++) {
  const traveler = travelerList[i];
  const pkgId = packageIds[i % packageIds.length];
  const pkgRow = db.prepare('SELECT * FROM packages WHERE id = ?').get(pkgId);
  const dateObj = allPackageDateIds.find(d => d.pkgId === pkgId) || allPackageDateIds[0];
  const status = statuses[i % statuses.length];
  const guests = (i % 3) + 1;
  const basePrice = pkgRow.price_amount * guests;
  const hasDiscount = i % 4 === 0;
  const discount = hasDiscount ? Math.floor(basePrice * 0.15) : 0;
  const total = basePrice - discount;
  const ref = 'GOT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const timeOffset = `-${(i % 30) + 1} days`;

  const bRes = insertBooking.run(
    ref,
    traveler.id,
    pkgId,
    dateObj.id,
    pkgRow.agent_id,
    guests,
    guests === 1 ? traveler.name : `${traveler.name}, Guest Companion`,
    traveler.email,
    '+1 (555) 789-0123',
    total,
    hasDiscount ? 1 : null,
    discount,
    status,
    status === 'pending' ? 'pending' : 'paid',
    i % 5 === 0 ? 'Vegetarian meals preferred for one traveler' : '',
    timeOffset
  );

  const bookingId = bRes.lastInsertRowid;
  bookingCount++;

  // If completed, add a 4 or 5 star review
  if (status === 'completed') {
    const rating = (i % 5 === 0) ? 4 : 5;
    const comment = reviewComments[i % reviewComments.length];
    insertReview.run(traveler.id, pkgId, bookingId, rating, comment, timeOffset);
  }
}

console.log(`7. Created ${bookingCount} Bookings with real status distributions and reviews.`);

// 9. CREATE CONVERSATIONS & IN-APP MESSAGES
const insertConv = db.prepare(`
  INSERT INTO conversations (user_id, agent_id, booking_id, last_message_at, created_at)
  VALUES (?, ?, ?, datetime('now'), datetime('now'))
`);

const insertMsg = db.prepare(`
  INSERT INTO messages (conversation_id, sender_id, content, read, created_at)
  VALUES (?, ?, ?, 1, datetime('now'))
`);

for (let i = 0; i < 15; i++) {
  const traveler = travelerList[i];
  const agentId = agentIds[i % agentIds.length];
  const cRes = insertConv.run(traveler.id, agentId, i + 1);
  const convId = cRes.lastInsertRowid;

  insertMsg.run(convId, traveler.id, 'Hello! I am preparing for our departure next month. Do we need specialized footwear for the day treks?');
  insertMsg.run(convId, agentId, 'Hi there! Yes, standard sturdy hiking boots are recommended. We provide all thermal suits and specialized gear on site.');
}

console.log('8. Seeded In-App Conversations and Message threads.');

// 10. CREATE CONTACT FORM INQUIRIES
const insertInquiry = db.prepare(`
  INSERT INTO contact_submissions (name, email, subject, message, read, created_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
`);

const inquiries = [
  { name: 'Dr. Arthur Pendelton', email: 'arthur.p@university.edu', sub: 'Private Academic Group Tour', msg: 'Hello, we are looking to book a 20-person custom geological study tour across Iceland and Norway.' },
  { name: 'Evelyn St. Claire', email: 'evelyn@luxuryescapes.org', sub: 'Bespoke Amalfi Coast Charter', msg: 'Interested in chartering a private 60ft catamaran for a corporate anniversary retreat in September.' },
  { name: 'Hiroshi Tanaka', email: 'hiroshi@tokyo-travel.jp', sub: 'Partnership with Global One', msg: 'We operate certified temple accommodations in Kyoto and would like to list our packages on your platform.' },
  { name: 'Sarah Jenkins', email: 'sarah.j@gmail.com', sub: 'Dietary Inquiries for Serengeti Safari', msg: 'Does the Serengeti mobile camp accommodate strict gluten-free and vegan meal plans?' }
];

for (const inq of inquiries) {
  insertInquiry.run(inq.name, inq.email, inq.sub, inq.msg, 0);
}

// 11. AUDIT & SUMMARY VERIFICATION
const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
const totalAgents = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'agent'").get().c;
const totalCustomers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get().c;
const totalPkgs = db.prepare('SELECT COUNT(*) as c FROM packages').get().c;
const totalDates = db.prepare('SELECT COUNT(*) as c FROM package_dates').get().c;
const totalItinerary = db.prepare('SELECT COUNT(*) as c FROM itinerary_days').get().c;
const totalBks = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
const totalRevs = db.prepare('SELECT COUNT(*) as c FROM reviews').get().c;
const totalConvs = db.prepare('SELECT COUNT(*) as c FROM conversations').get().c;

console.log('====================================================');
console.log(' DATABASE POPULATION COMPLETED SUCCESSFULLY');
console.log('====================================================');
console.log(`- Super Admins: 1`);
console.log(`- Tour Operators (Agents): ${totalAgents}`);
console.log(`- Registered Travelers: ${totalCustomers}`);
console.log(`- Total Users in DB: ${totalUsers}`);
console.log(`- Total Travel Packages: ${totalPkgs}`);
console.log(`- Total Itinerary Day Records: ${totalItinerary}`);
console.log(`- Total Departure Date Slots: ${totalDates}`);
console.log(`- Total Client Bookings: ${totalBks}`);
console.log(`- Total Customer Reviews: ${totalRevs}`);
console.log(`- In-App Conversations: ${totalConvs}`);
console.log('====================================================');

db.close();
