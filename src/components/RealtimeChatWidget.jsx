import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

function RealtimeChatWidget({ currentUser, contacts = [], title = "Realtime Care Chat" }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const messagesEndRef = useRef(null);

  const currentUserId = currentUser?.id || currentUser?._id || "";

  // Sync token from localStorage  
  useEffect(() => {
    const updateToken = () => {
      const newToken = localStorage.getItem("token") || "";
      setToken(newToken);
      console.log("Token updated:", newToken ? "✓" : "✗");
    };

    // Update immediately
    updateToken();

    // Listen for storage changes (from other tabs/windows)
    window.addEventListener("storage", updateToken);
    return () => window.removeEventListener("storage", updateToken);
  }, []);

  const uniqueContacts = useMemo(() => {
    const map = new Map();
    contacts.forEach((contact) => {
      const id = normalizeId(contact.id || contact._id || contact.userId);
      if (!id || id === currentUserId) return;
      map.set(id, {
        id,
        name: contact.name || "User",
        subtitle: contact.subtitle || "",
      });
    });
    return Array.from(map.values());
  }, [contacts, currentUserId]);

  const getOtherParticipant = useCallback(
    (conversation) => {
      const participant = (conversation?.participants || []).find(
        (item) => normalizeId(item) !== currentUserId
      );
      return participant || null;
    },
    [currentUserId]
  );

  const fetchConversations = useCallback(async () => {
    if (!token) {
      console.log("No token available for fetching conversations");
      return;
    }

    try {
      console.log("Fetching conversations...");
      const response = await fetch("/api/messages/conversations/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch failed with status:", response.status, "Body:", errorText);
        const data = response.status !== 204 ? JSON.parse(errorText) : { success: false };
        setError(data?.message || "Unable to load conversations.");
        return;
      }

      const data = await response.json();

      if (!data.success) {
        console.error("API returned success: false", data);
        setError(data.message || "Unable to load conversations.");
        return;
      }

      const nextConversations = data.conversations || [];
      console.log("Loaded conversations:", nextConversations.length);
      setConversations(nextConversations);
      setError("");

      if (!selectedConversationId && nextConversations.length > 0) {
        setSelectedConversationId(nextConversations[0]._id);
      }

      if (
        selectedConversationId &&
        nextConversations.length > 0 &&
        !nextConversations.some((c) => c._id === selectedConversationId)
      ) {
        setSelectedConversationId(nextConversations[0]._id);
      }
    } catch (fetchError) {
      console.error("Error fetching conversations:", fetchError);
      setError("Unable to load conversations. Please check your connection.");
    }
  }, [token, selectedConversationId]);

  const fetchMessages = useCallback(async () => {
    if (!token || !selectedConversationId) {
      console.log("Can't fetch messages: token or conversationId missing");
      setMessages([]);
      return;
    }

    try {
      console.log("Fetching messages for conversation:", selectedConversationId);
      const response = await fetch(`/api/messages/${selectedConversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Messages fetch failed:", response.status, errorText);
        const data = response.status !== 204 ? JSON.parse(errorText) : { success: false };
        setError(data?.message || "Unable to load messages.");
        return;
      }

      const data = await response.json();

      if (!data.success) {
        console.error("API returned success: false for messages", data);
        setError(data.message || "Unable to load messages.");
        return;
      }

      console.log("Loaded messages:", data.messages?.length || 0);
      setMessages(data.messages || []);
      setError("");
    } catch (fetchError) {
      console.error("Error fetching messages:", fetchError);
      setError("Unable to load messages. Please try again.");
    }
  }, [token, selectedConversationId]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      setLoading(true);
      await fetchConversations();
      setLoading(false);
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchConversations]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!token) return undefined;

    const interval = setInterval(() => {
      fetchConversations();
      if (selectedConversationId) {
        fetchMessages();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [token, selectedConversationId, fetchConversations, fetchMessages]);

  // Auto-scroll only when user sends a new message, not on every polling update
  useEffect(() => {
    // Check if messages exist and scroll to bottom only on initial load
    if (messages.length > 0 && selectedConversationId) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      });
    }
  }, [selectedConversationId]); // Only trigger when conversation changes, not on every message fetch

  const startConversation = async () => {
    if (!selectedContactId || !token) return;

    try {
      setStartingChat(true);
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otherUserId: selectedContactId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "Unable to start conversation.");
        return;
      }

      const newConversationId = data.conversation?._id;
      if (newConversationId) {
        setSelectedConversationId(newConversationId);
        setSelectedContactId("");
      }

      await fetchConversations();
      await fetchMessages();
      setError("");
    } catch (startError) {
      setError("Unable to start conversation.");
    } finally {
      setStartingChat(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !selectedConversationId || !token) return;

    try {
      setSending(true);
      const response = await fetch(`/api/messages/${selectedConversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: draft.trim() }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "Unable to send message.");
        return;
      }

      setDraft("");
      setMessages((prev) => [...prev, data.message]);
      setError("");
      fetchConversations();
    } catch (sendError) {
      setError("Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find((c) => c._id === selectedConversationId);

  return (
    <section className="rtc-chat-widget">
      <header className="rtc-chat-header">
        <div>
          <h3>{title}</h3>
          <p>Live updates every 2.5 seconds</p>
        </div>
      </header>

      <div className="rtc-chat-start">
        <select
          value={selectedContactId}
          onChange={(event) => setSelectedContactId(event.target.value)}
        >
          <option value="">Start new chat...</option>
          {uniqueContacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}{contact.subtitle ? ` - ${contact.subtitle}` : ""}
            </option>
          ))}
        </select>
        <button type="button" onClick={startConversation} disabled={!selectedContactId || startingChat}>
          {startingChat ? "Starting..." : "Start"}
        </button>
      </div>

      <div className="rtc-chat-layout">
        <aside className="rtc-chat-conversations">
          {loading ? (
            <p className="rtc-chat-state">Loading chats...</p>
          ) : conversations.length === 0 ? (
            <p className="rtc-chat-state">No conversations yet</p>
          ) : (
            conversations.map((conversation) => {
              const other = getOtherParticipant(conversation);
              return (
                <button
                  type="button"
                  key={conversation._id}
                  className={`rtc-conversation-item ${
                    selectedConversationId === conversation._id ? "active" : ""
                  }`}
                  onClick={() => setSelectedConversationId(conversation._id)}
                >
                  <span className="name">{other?.name || "Care member"}</span>
                  <span className="meta">{conversation.lastMessage?.content || "Open chat"}</span>
                </button>
              );
            })
          )}
        </aside>

        <div className="rtc-chat-thread">
          {selectedConversationId ? (
            <>
              <div className="rtc-thread-header">
                <strong>{getOtherParticipant(selectedConversation)?.name || "Conversation"}</strong>
              </div>

              <div className="rtc-thread-messages">
                {messages.length === 0 ? (
                  <p className="rtc-chat-state">No messages yet. Say hello.</p>
                ) : (
                  messages.map((message) => {
                    const senderId = normalizeId(message.senderId);
                    const isMine = senderId === currentUserId;

                    return (
                      <div
                        key={message._id}
                        className={`rtc-message ${isMine ? "mine" : "theirs"}`}
                      >
                        <p>{message.content}</p>
                        <time>
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="rtc-thread-input" onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Type your message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" disabled={sending || !draft.trim()}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="rtc-thread-empty">
              <p>Choose a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>

      {error && <p className="rtc-chat-error">{error}</p>}
    </section>
  );
}

export default RealtimeChatWidget;
