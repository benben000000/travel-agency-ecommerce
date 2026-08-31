'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const GUEST_MESSAGE_LIMIT = 3;

export default function AIConcierge() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [guestCount, setGuestCount] = useState(0);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi there! I am your 24/7 AI Travel Concierge. Tell me your ideal destination, budget, or preferred travel style, and I will find the best curated packages for you!',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const isGuest = !session?.user;
  const isLocked = isGuest && guestCount >= GUEST_MESSAGE_LIMIT;

  const quickPrompts = [
    '🏔️ 7-day trip in Europe',
    '🦁 Best wildlife safaris',
    '🌸 Cultural tours in Japan',
    '💰 Trips under $2,500',
  ];

  useEffect(() => {
    if (session?.user?.name) {
      const firstName = session.user.name.split(' ')[0];
      setMessages([
        {
          role: 'assistant',
          content: `Hi ${firstName}! I am your 24/7 AI Travel Concierge. Where would you like to travel next? Ask me about destinations, budgets, or custom itineraries!`,
        },
      ]);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLocked]);

  async function handleSend(textToSend) {
    if (isLocked) return;
    const userMsg = typeof textToSend === 'string' ? textToSend : input;
    if (!userMsg || !userMsg.trim() || loading) return;

    const newMsgs = [...messages, { role: 'user', content: userMsg.trim() }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    if (isGuest) {
      setGuestCount((prev) => prev + 1);
    }

    try {
      const res = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.trim(),
          chatHistory: newMsgs.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'I am happy to help you discover our curated packages! Could you tell me a bit more about your preferred dates, budget, or destination?',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I had trouble fetching that recommendation. Please try asking again!',
        },
      ]);
    }

    setLoading(false);
  }

  // Parse markdown links like [Title](/packages/slug) into clickable Next.js links
  function renderFormattedContent(text) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const title = match[1];
      const href = match[2];
      parts.push(
        <Link
          key={match.index}
          href={href}
          onClick={() => setIsOpen(false)}
          className="concierge-package-link"
        >
          {title} &rarr;
        </Link>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        className={`ai-concierge-fab ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Travel Concierge"
      >
        <div className="fab-icon-wrap">
          {isOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M12 7v4"></path>
              <path d="M12 15h.01"></path>
            </svg>
          )}
        </div>
        <span className="fab-label">AI Concierge</span>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="ai-concierge-window">
          {/* Header */}
          <div className="concierge-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="concierge-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#ffffff' }}>
                  Travel Concierge
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span className="concierge-online-dot"></span>
                  {session?.user ? (
                    <span style={{ color: '#a7f3d0' }}>Member Access • {session.user.name}</span>
                  ) : (
                    <span>Guest Mode ({Math.max(0, GUEST_MESSAGE_LIMIT - guestCount)} free left)</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="concierge-close-btn"
              onClick={() => setIsOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Quick Prompts (Only if not locked) */}
          {!isLocked && (
            <div className="concierge-quick-prompts">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  className="concierge-prompt-pill"
                  onClick={() => handleSend(prompt.replace(/^[^\w]+/, ''))}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Messages Body */}
          <div className="concierge-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`concierge-msg ${m.role}`}>
                <div className="concierge-bubble">
                  {renderFormattedContent(m.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="concierge-msg assistant">
                <div className="concierge-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            {/* Auth Gate (Option 3: Soft Signup Lock after free inquiries) */}
            {isLocked && (
              <div className="concierge-auth-gate">
                <div className="auth-gate-icon">✨</div>
                <div className="auth-gate-title">Enjoying the AI Concierge?</div>
                <div className="auth-gate-desc">
                  Sign in or create a free account to unlock unlimited AI trip planning, save your custom itineraries, and chat directly with verified tour operators.
                </div>
                <div className="auth-gate-actions">
                  <Link href="/login" className="btn btn-primary btn-sm" onClick={() => setIsOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/register" className="btn btn-secondary btn-sm" onClick={() => setIsOpen(false)}>
                    Create Free Account
                  </Link>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            className="concierge-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder={isLocked ? 'Sign in to continue exploring...' : 'Ask anything (e.g. 5 days in Norway)...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || isLocked}
            />
            <button
              type="submit"
              className="concierge-send-btn"
              disabled={loading || !input.trim() || isLocked}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
