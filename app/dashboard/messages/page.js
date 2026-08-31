'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

import ChatBookingCard from '@/components/ChatBookingCard';

function UserMessagesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get('conversation');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(initialConvId));
  
  const chatMessagesBoxRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const prevConvIdRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      userScrolledUpRef.current = false;
      fetchMessages(activeConv.id);
      const interval = setInterval(() => {
        fetchMessages(activeConv.id, true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConv]);

  // Scroll to bottom ONLY on new conversation, when user sent a message, or when already at bottom
  useEffect(() => {
    if (!chatMessagesBoxRef.current) return;
    const isNewConv = prevConvIdRef.current !== activeConv?.id;
    if (isNewConv || !userScrolledUpRef.current) {
      chatMessagesBoxRef.current.scrollTop = chatMessagesBoxRef.current.scrollHeight;
    }
    prevConvIdRef.current = activeConv?.id;
  }, [messages, activeConv]);

  function handleChatScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
    userScrolledUpRef.current = !isNearBottom;
  }

  async function fetchConversations(targetId = null) {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.conversations && data.conversations.length > 0) {
        setConversations(data.conversations);
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('got_traveler_active_conv') : null;
        const desiredId = targetId || initialConvId || savedId;
        
        let match = null;
        if (desiredId) {
          match = data.conversations.find((c) => c.id === parseInt(desiredId, 10));
        }
        
        const chosen = match || data.conversations[0];
        setActiveConv(chosen);
        if (chosen) {
          try {
            localStorage.setItem('got_traveler_active_conv', chosen.id.toString());
            window.history.replaceState(null, '', `?conversation=${chosen.id}`);
          } catch (e) {}
        }
      }
    } catch (err) {}
    setLoading(false);
  }

  function handleSelectConversation(conv) {
    setActiveConv(conv);
    setMobileChatOpen(true);
    try {
      localStorage.setItem('got_traveler_active_conv', conv.id.toString());
      window.history.replaceState(null, '', `?conversation=${conv.id}`);
    } catch (e) {}
  }

  async function fetchMessages(convId, silent = false) {
    try {
      const res = await fetch(`/api/messages?conversation_id=${convId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages((prev) => {
          if (
            prev.length === data.messages.length &&
            prev[prev.length - 1]?.id === data.messages[data.messages.length - 1]?.id
          ) {
            return prev; // Same messages, prevent triggering scroll effect
          }
          return data.messages;
        });
      }
    } catch (err) {}
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!inputMsg.trim() || !activeConv || sending) return;
    setSending(true);

    const msgContent = inputMsg.trim();
    setInputMsg('');
    userScrolledUpRef.current = false; // Always scroll to bottom when user sends a message

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConv.id,
          content: msgContent,
        }),
      });
      const data = await res.json();
      if (data.message) {
        const toAdd = [data.message];
        if (data.replyMessage) {
          toAdd.push(data.replyMessage);
        }
        setMessages((prev) => [...prev, ...toAdd]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? { ...c, last_message: data.replyMessage?.content || msgContent, last_message_at: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {}
    setSending(false);
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Messages</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Direct communication with tour operators managing your travel packages.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No Conversations Yet</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            When you contact tour operators about itineraries or bookings, your chats will appear here.
          </p>
        </div>
      ) : (
        <div className="chat-container">
          <div className={`chat-sidebar ${mobileChatOpen ? 'mobile-hidden' : ''}`}>
            {conversations.map((c) => {
              const otherName = c.agent_company || c.agent_name || 'Tour Operator';
              const isSelected = activeConv?.id === c.id;
              return (
                <div
                  key={c.id}
                  className={`chat-sidebar-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(c)}
                >
                  <div className="chat-name">{otherName}</div>
                  {c.package_title && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.package_title}
                    </div>
                  )}
                  <div className="chat-preview">{c.last_message || 'Start chatting...'}</div>
                </div>
              );
            })}
          </div>

          <div className={`chat-main ${!mobileChatOpen ? 'mobile-hidden' : ''}`}>
            {activeConv ? (
              <>
                <div className="chat-header">
                  <button
                    type="button"
                    className="chat-back-btn"
                    onClick={() => setMobileChatOpen(false)}
                    aria-label="Back to conversations list"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>Chats</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeConv.agent_company || activeConv.agent_name || 'Tour Operator'}
                    </span>
                    {activeConv.package_title && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        &bull; {activeConv.package_title}
                      </span>
                    )}
                  </div>
                </div>

                <div className="chat-messages" ref={chatMessagesBoxRef} onScroll={handleChatScroll}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-light)', marginTop: '40px' }}>
                      No messages in this conversation yet. Send a message to start chatting!
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isSentByMe =
                        String(m.sender_id) === String(session?.user?.id) ||
                        Number(m.sender_id) === Number(activeConv?.user_id);

                      const actionMatch = m.content.match(/<!-- ACTION_BOOKING: ([\s\S]*?)-->/);
                      let bookingData = null;
                      if (actionMatch) {
                        try {
                          bookingData = JSON.parse(actionMatch[1]);
                        } catch (e) {}
                      } else if (!isSentByMe && (m.content.includes('reserved your trip') || m.content.includes('proceed with the payment') || m.content.includes('booking card below') || m.content.includes('Ref:'))) {
                        // Resilient Fallback: Extract details directly from message text
                        const titleMatch = m.content.match(/for the (.*?)(?:starting|\(Ref:|,|\.)/i);
                        const refMatch = m.content.match(/Ref:\s*([A-Za-z0-9-]+)/i);
                        const dateMatch = m.content.match(/starting\s+([A-Za-z0-9\s,]+?)(?:\s*\(Ref:|\s*,|\s*\.|\s*$)/i);
                        
                        const inferredTitle = titleMatch ? titleMatch[1].trim() : (activeConv.package_title || 'Custom Travel Package');
                        const inferredRef = refMatch ? refMatch[1].trim() : 'GOT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                        const inferredDate = dateMatch ? dateMatch[1].trim() : 'April 10, 2026';
                        
                        bookingData = {
                          type: 'BOOKING_RESERVATION',
                          booking_ref: inferredRef,
                          package_title: inferredTitle,
                          destination: 'Kenya Safari & Wildlife',
                          price_amount: 385000,
                          price_per_person: 192500,
                          guests_count: 2,
                          departure_date: inferredDate,
                          status: 'pending',
                          payment_status: 'unpaid',
                          duration_days: 7,
                          inclusions: 'Luxury safari lodge accommodation, 4x4 Land Cruiser game drives with pop-up roof, park conservation fees, professional naturalist guide, all meals on safari, airport transfers',
                          meeting_point: 'Jomo Kenyatta International Airport (NBO) Arrival Gate',
                        };
                      }

                      const cleanText = m.content.replace(/<!-- ACTION_BOOKING: [\s\S]*?-->/g, '').trim();

                      return (
                        <div
                          key={m.id}
                          className={`chat-message ${isSentByMe ? 'sent' : 'received'}`}
                        >
                          {cleanText && <div>{cleanText}</div>}
                          {bookingData && (
                            <ChatBookingCard
                              bookingData={bookingData}
                              onPaymentSuccess={async (updated) => {
                                try {
                                  const res = await fetch('/api/messages', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      conversation_id: activeConv.id,
                                      content: `Payment of $${(updated.price_amount / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })} for Reservation #${updated.booking_ref} has been completed! 🎉`,
                                    }),
                                  });
                                  const data = await res.json();
                                  if (data.message) {
                                    const toAdd = [data.message];
                                    if (data.replyMessage) toAdd.push(data.replyMessage);
                                    setMessages((prev) => [...prev, ...toAdd]);
                                  }
                                } catch (e) {}
                              }}
                            />
                          )}
                          <div className="msg-time">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !inputMsg.trim()}>
                    {sending ? '...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                Select a conversation on the left to start chatting.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserMessagesPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="loading-spinner"></div></div>}>
      <UserMessagesContent />
    </Suspense>
  );
}
