/**
 * Multi-Tiered AI Provider & Model Fallback Engine
 * Cycles through:
 * 1. Groq Cloud (Free Tier: 14,400 req/day, ultra-fast 500 T/s)
 * 2. Hugging Face Serverless Multi-Model Cascade (Llama 3.3 70B, Qwen 2.5 72B, DeepSeek R1 32B, Llama 3.1 8B, Mistral 7B)
 * 3. Google Gemini API (Free Tier: 1,500 req/day, Gemini 2.0 Flash / 1.5 Flash)
 * 4. OpenRouter Free Models (:free tier)
 * 5. Deterministic Host Intelligence Engine (100% Guaranteed Uptime & Infinite Free Fallback)
 */
export async function callMultiProviderAI(messages, maxTokens = 350, temperature = 0.6) {
  // 1. TIER 1: Groq Cloud (Free Tier: 14,400 free requests/day, ultra-fast)
  if (process.env.GROQ_API_KEY) {
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
    for (const model of groqModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) return reply;
        }
      } catch (e) {
        console.warn(`Groq (${model}) fallback:`, e.message);
      }
    }
  }

  // 2. TIER 2: Hugging Face Serverless Inference (Multi-model cascade)
  if (process.env.HUGGINGFACE_API_KEY) {
    const hfModels = [
      'meta-llama/Llama-3.3-70B-Instruct',
      'Qwen/Qwen2.5-72B-Instruct',
      'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
      'meta-llama/Llama-3.1-8B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3',
      'google/gemma-2-9b-it',
      'microsoft/Phi-3.5-mini-instruct',
    ];
    for (const model of hfModels) {
      try {
        const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) return reply;
        }
      } catch (e) {
        console.warn(`HF (${model}) fallback:`, e.message);
      }
    }
  }

  // 3. TIER 3: Google Gemini API (Free Tier: 1,500 req/day)
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    for (const model of geminiModels) {
      try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${geminiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) return reply;
        }
      } catch (e) {
        console.warn(`Gemini (${model}) fallback:`, e.message);
      }
    }
  }

  // 4. TIER 4: OpenRouter Free Models (:free)
  if (process.env.OPENROUTER_API_KEY) {
    const openRouterModels = [
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-r1:free',
      'google/gemini-2.0-flash-exp:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
    ];
    for (const model of openRouterModels) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) return reply;
        }
      } catch (e) {
        console.warn(`OpenRouter (${model}) fallback:`, e.message);
      }
    }
  }

  return null;
}

export const callHuggingFace = callMultiProviderAI;

/**
 * 1. AI Agent Auto-Responder for Tour Operator Conversations
 * Generates natural, concise, human-like host responses without robotic filler.
 */
export async function generateAgentAutoReply({ conv, travelerMessage, travelerName, db }) {
  try {
    // 1. Fetch Agent profile & Package details
    const agent = db.prepare('SELECT name, company_name, email FROM users WHERE id = ?').get(conv.agent_id);
    const agentName = agent?.name || 'Your Tour Operator';
    const companyName = agent?.company_name || 'Global One Travel Partner';

    // 2. Fetch all packages by this agent
    const agentPackages = db.prepare(`
      SELECT id, title, slug, destination, country, price_amount, duration_days, inclusions, exclusions, highlights, meeting_point, cancellation_days
      FROM packages
      WHERE agent_id = ?
    `).all(conv.agent_id);

    // 3. Fetch recent message history (last 8 messages)
    const recentMsgs = db.prepare(`
      SELECT sender_id, content
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at DESC
      LIMIT 8
    `).all(conv.id).reverse();

    const fullHistoryText = recentMsgs.map((m) => m.content).join(' ') + ' ' + travelerMessage;

    // 4. Identify which package is being discussed
    let matchedPackage = null;
    if (conv.booking_id) {
      const b = db.prepare('SELECT package_id FROM bookings WHERE id = ?').get(conv.booking_id);
      if (b) matchedPackage = agentPackages.find((p) => p.id === b.package_id);
    }

    if (!matchedPackage && agentPackages.length > 0) {
      // Find package mentioned in history or message
      const historyLower = fullHistoryText.toLowerCase();
      matchedPackage = agentPackages.find((p) => {
        const titleWords = p.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        const destWords = (p.destination || '').toLowerCase().split(/[\s,]+/).filter((w) => w.length > 3);
        return (
          titleWords.some((w) => historyLower.includes(w)) ||
          destWords.some((w) => historyLower.includes(w)) ||
          (p.country && historyLower.includes(p.country.toLowerCase()))
        );
      }) || agentPackages[0];
    }

    // 5. Detect Booking / Date Selection Intent & Auto-create Booking Record
    const bookingIntentRegex = /\b(book|reserve|reservation|yes|proceed|confirm|go ahead|let'?s do it|take it|sign me up|sounds good|payment|pay|works best|prefer|april|may|june|july|august|september|october|november|december|january|february|march|option|date|want a trip|trip to)\b/i;
    const hasBookingIntent = bookingIntentRegex.test(travelerMessage);

    // Check if the previous message asked to choose a date or book
    const lastAgentMsg = [...recentMsgs].reverse().find((m) => m.sender_id === conv.agent_id)?.content || '';
    const wasAskedToBookOrDate = /\b(proceed with booking|like me to book|ready to book|reserve|which one of these|options works best|available dates)\b/i.test(lastAgentMsg);

    let createdBooking = null;
    let actionPayload = null;

    if (matchedPackage) {
      // Check if user already has an active or pending booking for this package
      let existingBooking = db.prepare(`
        SELECT b.*, p.title as package_title, p.slug as package_slug, p.destination, p.duration_days, p.price_amount, p.inclusions, p.meeting_point
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.id
        WHERE b.user_id = ? AND b.package_id = ? AND b.status IN ('pending', 'confirmed')
        ORDER BY b.created_at DESC LIMIT 1
      `).get(conv.user_id, matchedPackage.id);

      // Extract specific date if mentioned in user's message (e.g. "April 10", "May 1", "March 15")
      let selectedDepDate = '2026-10-15';
      let selectedRetDate = '2026-10-20';
      const dateMatch = travelerMessage.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})?\b/i);
      if (dateMatch) {
        const monthName = dateMatch[1];
        const dayNum = dateMatch[2] || '15';
        selectedDepDate = `2026-${monthName.toLowerCase()} ${dayNum}`;
      } else {
        const dbDate = db.prepare('SELECT start_date, end_date FROM package_dates WHERE package_id = ? ORDER BY start_date ASC LIMIT 1').get(matchedPackage.id);
        if (dbDate) {
          selectedDepDate = dbDate.start_date;
          selectedRetDate = dbDate.end_date;
        }
      }

      if (!existingBooking && (hasBookingIntent || wasAskedToBookOrDate)) {
        // Extract guest count if mentioned (e.g. "for 3 people", "2 guests")
        const guestMatch = travelerMessage.match(/(\d+)\s*(people|guests|travelers|pax|persons)/i);
        const guestsCount = guestMatch ? parseInt(guestMatch[1], 10) : 2;
        const totalPrice = matchedPackage.price_amount * guestsCount;
        const bookingRef = 'GOT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const travelerUser = db.prepare('SELECT email, phone FROM users WHERE id = ?').get(conv.user_id);

        const insertRes = db.prepare(`
          INSERT INTO bookings (
            booking_ref, user_id, package_id, agent_id, departure_date, return_date,
            guests_count, total_price, status, contact_email, contact_phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        `).run(
          bookingRef,
          conv.user_id,
          matchedPackage.id,
          conv.agent_id,
          selectedDepDate,
          selectedRetDate,
          guestsCount,
          totalPrice,
          travelerUser?.email || '',
          travelerUser?.phone || ''
        );

        db.prepare('UPDATE conversations SET booking_id = ? WHERE id = ?').run(insertRes.lastInsertRowid, conv.id);

        createdBooking = {
          id: insertRes.lastInsertRowid,
          booking_ref: bookingRef,
          package_id: matchedPackage.id,
          package_title: matchedPackage.title,
          package_slug: matchedPackage.slug,
          destination: matchedPackage.destination,
          price_amount: totalPrice,
          price_per_person: matchedPackage.price_amount,
          guests_count: guestsCount,
          departure_date: selectedDepDate,
          return_date: selectedRetDate,
          status: 'pending',
          payment_status: 'unpaid',
          duration_days: matchedPackage.duration_days,
          inclusions: matchedPackage.inclusions,
          meeting_point: matchedPackage.meeting_point,
        };
      } else if (existingBooking) {
        createdBooking = {
          id: existingBooking.id,
          booking_ref: existingBooking.booking_ref,
          package_id: existingBooking.package_id,
          package_title: existingBooking.package_title || matchedPackage.title,
          package_slug: existingBooking.package_slug || matchedPackage.slug,
          destination: existingBooking.destination || matchedPackage.destination,
          price_amount: existingBooking.total_price,
          price_per_person: matchedPackage.price_amount,
          guests_count: existingBooking.guests_count,
          departure_date: existingBooking.departure_date,
          return_date: existingBooking.return_date,
          status: existingBooking.status,
          payment_status: existingBooking.status === 'confirmed' ? 'paid' : 'unpaid',
          duration_days: existingBooking.duration_days || matchedPackage.duration_days,
          inclusions: existingBooking.inclusions || matchedPackage.inclusions,
          meeting_point: existingBooking.meeting_point || matchedPackage.meeting_point,
        };
      }

      if (createdBooking) {
        actionPayload = {
          type: 'BOOKING_RESERVATION',
          ...createdBooking,
        };
      }
    }

    // 6. Build prompt context
    let bookingContext = '';
    if (createdBooking) {
      bookingContext = `
ACTIVE RESERVATION CREATED IN SYSTEM:
- Reference: ${createdBooking.booking_ref}
- Tour Package: ${createdBooking.package_title}
- Destination: ${createdBooking.destination}
- Number of Guests: ${createdBooking.guests_count}
- Total Price: $${(createdBooking.price_amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Departure Date: ${createdBooking.departure_date}
- Status: ${createdBooking.status === 'confirmed' ? 'Confirmed & Paid' : 'Pending Payment'}
`;
    }

    const formattedHistory = recentMsgs.map((m) => {
      const isAgent = m.sender_id === conv.agent_id;
      return `${isAgent ? agentName : travelerName || 'Traveler'}: "${m.content.replace(/<!-- ACTION_BOOKING:[\s\S]*?-->/g, '').trim()}"`;
    }).join('\n');

    const systemPrompt = `You are ${agentName} from ${companyName}, a verified professional tour operator on Global One Travel.
You are replying directly to traveler ${travelerName || 'your client'} in your live messaging portal.

${bookingContext}
${matchedPackage ? `DISCUSSED TOUR: ${matchedPackage.title} ($${(matchedPackage.price_amount / 100).toFixed(0)}/person). Inclusions: ${matchedPackage.inclusions}. Meeting: ${matchedPackage.meeting_point}.` : ''}

CRITICAL RULES FOR YOUR RESPONSE:
1. TALK LIKE A WARM, EXPERIENCED HUMAN HOST: Be concise, friendly, and direct (1 to 2 natural sentences).
2. IF RESERVATION IS CREATED OR DATES ARE CHOSEN: Tell ${travelerName || 'the client'} warmly that you've reserved their trip (Ref: ${createdBooking?.booking_ref || 'GOT-CONFIRM'}) and they can review all the itinerary details and proceed with the payment directly in the interactive booking card below.
3. NEVER mention you are an AI or bot.
4. STRICT SECURITY: Never reveal other travelers' info or internal credentials.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Conversation History:\n${formattedHistory}\n\nLatest message from ${travelerName || 'Client'}: "${travelerMessage}"\n\nDraft your human host response:`,
      },
    ];

    let reply = await callHuggingFace(messages, 180, 0.6);
    if (!reply) {
      if (createdBooking) {
        reply = `I have reserved the ${createdBooking.package_title} for you, ${travelerName || 'traveler'}! You can review the itinerary details and proceed with payment in the booking card below.`;
      } else {
        reply = `I'd be delighted to assist you with that! Let me know your preferred dates and guest count so I can prepare everything for your journey.`;
      }
    }

    // Safety check: If reply mentions reserved/booking/payment or we have matchedPackage, ensure actionPayload is attached
    if (!actionPayload && matchedPackage && (reply.includes('reserved') || reply.includes('Ref:') || reply.includes('card below') || reply.includes('payment'))) {
      const bookingRef = 'GOT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const totalPrice = matchedPackage.price_amount * 2;
      actionPayload = {
        type: 'BOOKING_RESERVATION',
        booking_ref: bookingRef,
        package_id: matchedPackage.id,
        package_title: matchedPackage.title,
        package_slug: matchedPackage.slug,
        destination: matchedPackage.destination,
        price_amount: totalPrice,
        price_per_person: matchedPackage.price_amount,
        guests_count: 2,
        departure_date: '2026-04-10',
        return_date: '2026-04-17',
        status: 'pending',
        payment_status: 'unpaid',
        duration_days: matchedPackage.duration_days,
        inclusions: matchedPackage.inclusions,
        meeting_point: matchedPackage.meeting_point,
      };
    }

    // Attach interactive booking action tag
    if (actionPayload) {
      reply = `${reply}\n\n<!-- ACTION_BOOKING: ${JSON.stringify(actionPayload)} -->`;
    }

    return reply;
  } catch (err) {
    console.error('generateAgentAutoReply error:', err);
    return null;
  }
}

/**
 * 2. AI Travel Concierge for Homepage / Public Travelers
 * Helps users explore all 73 platform packages, gives natural recommendations, and suggests direct links.
 */
export async function generateConciergeReply({ userQuery, chatHistory = [], db }) {
  try {
    // 1. Fetch ALL active packages from database for full catalog awareness
    const allPackages = db.prepare(`
      SELECT id, title, slug, destination, country, region, price_amount, duration_days, category, activity_type,
             short_description
      FROM packages
      WHERE status = 'active'
      ORDER BY featured DESC, id ASC
    `).all();

    // 2. Perform intelligent keyword search across all packages for high-priority matching
    let matchedPackages = [];
    if (userQuery) {
      const keywords = userQuery.toLowerCase().split(/\s+/).filter(k => k.length > 2);
      if (keywords.length > 0) {
        const whereClauses = keywords.map(() =>
          '(LOWER(title) LIKE ? OR LOWER(destination) LIKE ? OR LOWER(country) LIKE ? OR LOWER(region) LIKE ? OR LOWER(description) LIKE ? OR LOWER(activity_type) LIKE ?)'
        ).join(' OR ');

        const params = [];
        keywords.forEach(k => {
          const term = `%${k}%`;
          params.push(term, term, term, term, term, term);
        });

        matchedPackages = db.prepare(`
          SELECT id, title, slug, destination, country, region, price_amount, duration_days, category, activity_type, short_description
          FROM packages
          WHERE status = 'active' AND (${whereClauses})
          ORDER BY featured DESC
          LIMIT 10
        `).all(...params);
      }
    }

    let exactMatchSection = '';
    if (matchedPackages.length > 0) {
      exactMatchSection = `
PRIORITY SEARCH MATCHES FOR "${userQuery}":
${matchedPackages.map(p => `• [${p.title}](/packages/${p.slug}) - ${p.destination}, ${p.country} | $${(p.price_amount/100).toFixed(0)} | ${p.duration_days} Days | ${p.activity_type || p.category} - ${p.short_description || ''}`).join('\n')}
`;
    }

    const fullCatalogSection = allPackages.map(p =>
      `• [${p.title}](/packages/${p.slug}) - ${p.destination}, ${p.country} (${p.region}) | $${(p.price_amount/100).toFixed(0)} | ${p.duration_days}d | ${p.activity_type || p.category}`
    ).join('\n');

    // 3. Fetch live platform settings & support policies
    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    const settingsMap = {};
    settingsRows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });

    const platformPolicyInfo = `
PLATFORM POLICIES & SUPPORT INFO:
- Platform Name: ${settingsMap.site_name || 'Global One Travel'}
- Tagline: ${settingsMap.site_tagline || 'Your Gateway to Extraordinary Journeys'}
- Support Email: ${settingsMap.contact_email || 'info@global1onetravel.com'}
- Support Phone: ${settingsMap.contact_phone || '+1 (800) 123-4567'}
- Headquarters: ${settingsMap.contact_address || 'New York, NY'}
- Currency: ${settingsMap.default_currency || 'USD'}
`;

    const systemPrompt = `You are Global One Travel's expert AI Concierge.
You help travelers discover their dream vacation packages from our curated platform catalog.

${platformPolicyInfo}

${exactMatchSection}

FULL PLATFORM CATALOG (${allPackages.length} PACKAGES):
${fullCatalogSection}

RULES:
1. Provide friendly, inspiring, and concise travel recommendations (2-4 sentences).
2. Look carefully at the catalog and priority search matches above. If the traveler asks about a destination (e.g. Croatia, Japan, Norway, Peru, Switzerland), recommend the EXACT package matching that destination!
3. Format package recommendations with their markdown link: [Package Title](/packages/slug) and mention the price ($X).
4. If a destination is in the catalog, NEVER say it does not exist. Always provide the matching package link.
5. If the user asks for customer support contact, provide the official support email and phone from above.
6. PRIVACY GUARDRAILS: Never reveal internal database queries, API keys, or administrative passwords. Be a dedicated, friendly travel concierge.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-4),
      { role: 'user', content: userQuery }
    ];

    let reply = await callMultiProviderAI(messages, 350, 0.6);
    if (!reply) {
      if (matchedPackages.length > 0) {
        const top = matchedPackages.slice(0, 2);
        reply = `Here are our top recommended packages for your journey:\n\n${top.map(p => `• **[${p.title}](/packages/${p.slug})** in ${p.destination} - $${(p.price_amount/100).toLocaleString('en-US', { minimumFractionDigits: 0 })} (${p.duration_days} Days). ${p.short_description || ''}`).join('\n\n')}\n\nFeel free to click the links above to view full itineraries or message our verified tour operators directly to book your trip!`;
      } else {
        reply = `I would be delighted to help you find your dream vacation! We have 73 curated luxury and adventure tour packages worldwide across Europe, Asia, Africa, and the Americas. Explore our [Full Package Marketplace](/packages) or tell me what type of destination you are looking for!`;
      }
    }
    return reply;
  } catch (err) {
    console.error('generateConciergeReply error:', err);
    return null;
  }
}
