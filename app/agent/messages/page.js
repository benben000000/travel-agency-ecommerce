'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function AgentMessagesContent() {
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

  async function fetchConversations() {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (initialConvId) {
          const match = data.conversations.find((c) => c.id === parseInt(initialConvId));
          if (match) {
            setActiveConv(match);
            setMobileChatOpen(true);
          } else if (data.conversations.length > 0) {
            setActiveConv(data.conversations[0]);
          }
        } else if (data.conversations.length > 0) {
          setActiveConv((prev) => prev || data.conversations[0]);
        }
      }
    } catch (err) {}
    setLoading(false);
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
        setMessages((prev) => [...prev, data.message]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? { ...c, last_message: msgContent, last_message_at: new Date().toISOString() }
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
          <h1>Client Inquiries & Messages</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Chat directly with travelers and coordinate customized itineraries.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No Client Inquiries Yet</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            When clients message you about your packages, conversations will appear here.
          </p>
        </div>
      ) : (
        <div className="chat-container">
          <div className={`chat-sidebar ${mobileChatOpen ? 'mobile-hidden' : ''}`}>
            {conversations.map((c) => {
              const otherName = c.user_name || 'Traveler';
              const isSelected = activeConv?.id === c.id;
              return (
                <div
                  key={c.id}
                  className={`chat-sidebar-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setActiveConv(c);
                    setMobileChatOpen(true);
                  }}
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
                      {activeConv.user_name || 'Traveler'}
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
                      // In Agent Portal: The tour operator's messages belong on the RIGHT in BLUE (.sent),
                      // and traveler inquiries belong on the LEFT in GRAY (.received).
                      const isSentByMe =
                        String(m.sender_id) === String(session?.user?.id) ||
                        Number(m.sender_id) === Number(activeConv?.agent_id);

                      return (
                        <div
                          key={m.id}
                          className={`chat-message ${isSentByMe ? 'sent' : 'received'}`}
                        >
                          <div>{m.content}</div>
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

export default function AgentMessagesPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="loading-spinner"></div></div>}>
      <AgentMessagesContent />
    </Suspense>
  );
}
