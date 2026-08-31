'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
      const interval = setInterval(() => {
        fetchMessages(activeConv.id, true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchConversations() {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (initialConvId) {
          const match = data.conversations.find((c) => c.id === parseInt(initialConvId));
          if (match) setActiveConv(match);
          else if (data.conversations.length > 0) setActiveConv(data.conversations[0]);
        } else if (data.conversations.length > 0) {
          setActiveConv(data.conversations[0]);
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
        setMessages(data.messages);
      }
    } catch (err) {}
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!inputMsg.trim() || !activeConv || sending) return;
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConv.id,
          content: inputMsg.trim(),
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInputMsg('');
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
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            When you book a package or message a tour operator, your conversations will appear here.
          </p>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-sidebar">
            {conversations.map((c) => {
              const otherName = c.agent_name || 'Tour Agent';
              const isSelected = activeConv?.id === c.id;
              return (
                <div
                  key={c.id}
                  className={`chat-sidebar-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setActiveConv(c)}
                >
                  <div className="chat-name">{otherName}</div>
                  {c.package_title && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '2px' }}>
                      {c.package_title}
                    </div>
                  )}
                  <div className="chat-preview">{c.last_message || 'Start chatting...'}</div>
                </div>
              );
            })}
          </div>

          <div className="chat-main">
            {activeConv ? (
              <>
                <div className="chat-header">
                  <div>
                    <span>{activeConv.agent_name || 'Tour Agent'}</span>
                    {activeConv.package_title && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginLeft: '10px' }}>
                        ({activeConv.package_title})
                      </span>
                    )}
                  </div>
                </div>

                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-light)', marginTop: '40px' }}>
                      No messages yet. Send a message below.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isSentByMe = m.sender_id === session?.user?.id;
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
                  <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                  <input
                    type="text"
                    placeholder="Type your message..."
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
                Select a conversation from the list to start chatting.
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
