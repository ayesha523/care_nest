import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Normalizes user ID from various formats
 * Handles string IDs, objects with _id, and objects with id
 * 
 * @param {*} value - Value to normalize
 * @returns {string} Normalized ID string
 */
const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

/**
 * Extracts initials from name for avatar display
 * @param {string} name - User's name
 * @returns {string} 2-character uppercase initials
 */
const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
};

/**
 * Generates consistent color for user avatar based on name
 * Uses hash function to ensure same name always gets same color
 * @param {string} name - User's name
 * @returns {string} Hex color code
 */
const getAvatarColor = (name) => {
  const colors = ["#115B4C", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * AdvancedChatBox Component
 * Messenger-style modal chatbox with real-time messaging
 * Features: avatars, online status, typing indicators, message timestamps, delivery status
 * 
 * @param {Object} props - Component props
 * @param {Object} props.otherUser - Other user object with name, id, email
 * @param {Object} props.currentUser - Current logged-in user object
 * @param {string} props.conversationId - Unique conversation ID for API calls
 * @param {Function} props.onClose - Callback when close button clicked
 * @returns {React.ReactNode} Messenger-style chatbox component
 */
function AdvancedChatBox({ otherUser, currentUser, conversationId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const token = localStorage.getItem("token");
  const currentUserId = currentUser?.id || currentUser?._id || "";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Fetches messages for current conversation from API
   * Polled every 2.5 seconds for real-time updates
   */
  const fetchMessages = useCallback(async () => {
    if (!token || !conversationId) return;

    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setMessages(data.messages || []);
        setError("");
      } else if (response.status === 401) {
        setError("Session expired. Please log in again.");
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, conversationId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2500); // Poll every 2.5s
    return () => clearInterval(interval);
  }, [fetchMessages]);

  /**
   * Sends message to API
   * Clears draft and refreshes messages on success
   */
  const handleSendMessage = async () => {
    if (!draft.trim() || sending || !token || !conversationId) return;

    setSending(true);
    setTyping(false);
    setError("");

    try {
      console.log("📤 Sending message...");
      console.log(`   Conversation ID: ${conversationId}`);
      console.log(`   Content: ${draft}`);

      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: draft,
        }),
      });

      console.log(`   Response Status: ${response.status}`);

      const data = await response.json();
      console.log(`   Response:`, data);

      if (response.ok && data.success) {
        console.log("✅ Message sent successfully!");
        setDraft("");
        fetchMessages();
      } else if (response.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(data.message || "Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("❌ Failed to send message:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  /**
   * Handles text input changes
   * Updates draft state and manages typing indicator timeout
   * @param {Event} e - Input change event
   */
  const handleTyping = (e) => {
    setDraft(e.target.value);
    
    // Show typing indicator
    if (!typing) {
      setTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator after 3 seconds of no activity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  };

  /**
   * Handles keyboard events
   * Sends message on Enter key (without Shift)
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="advanced-chatbox-messenger">
      {/* Header with contact info */}
      <div className="messenger-header">
        <div className="header-left">
          <button className="mesh-close-btn" onClick={onClose} title="Close chat">
            <span>←</span>
          </button>
          <div className="contact-avatar" style={{ backgroundColor: getAvatarColor(otherUser?.name) }}>
            {getInitials(otherUser?.name)}
          </div>
          <div className="contact-details">
            <h3>{otherUser?.name || otherUser?.fullName || "User"}</h3>
            <p className="online-status">
              <span className="status-dot offline"></span>
              Offline
            </p>
          </div>
        </div>
        <button className="mesh-info-btn" title="More options">⋯</button>
      </div>

      {/* Messages area */}
      <div className="messenger-messages">
        {loading ? (
          <div className="mesh-loading">
            <div className="mesh-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="mesh-empty">
            <div className="mesh-empty-icon">💭</div>
            <h4>No messages yet</h4>
            <p>Start your  a conversation now</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMine = normalizeId(msg.senderId) === currentUserId;
              const showAvatar = idx === messages.length - 1 || 
                (idx < messages.length - 1 && normalizeId(messages[idx + 1].senderId) !== normalizeId(msg.senderId));
              
              return (
                <div key={idx} className={`msg-row ${isMine ? "msg-sent" : "msg-received"}`}>
                  {!isMine && showAvatar && (
                    <div className="msg-avatar" style={{ backgroundColor: getAvatarColor(otherUser?.name) }}>
                      {getInitials(otherUser?.name)}
                    </div>
                  )}
                  {!isMine && !showAvatar && <div className="msg-avatar-space"></div>}
                  
                  <div className="msg-content">
                    <div className={`msg-bubble ${isMine ? "sent" : "received"}`}>
                      <p className="msg-text">{msg.content || msg.text}</p>
                      <span className="msg-timestamp">
                        {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {isMine && <span className="msg-status">✓✓</span>}
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="msg-row msg-received">
                <div className="msg-avatar" style={{ backgroundColor: getAvatarColor(otherUser?.name) }}>
                  {getInitials(otherUser?.name)}
                </div>
                <div className="msg-content">
                  <div className="msg-bubble received typing-bubble">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: "8px" }} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="messenger-input-area">
        {error && <p className="mesh-error">❌ {error}</p>}
        <div className="messenger-input-wrapper">
          <textarea
            placeholder="Write a message..."
            value={draft}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            rows="1"
            disabled={sending}
            className="textarea-input"
          />
          <button
            className={`send-btn ${sending ? "sending" : ""}`}
            onClick={handleSendMessage}
            disabled={!draft.trim() || sending}
            title="Send message"
          >
            {sending ? "⏳" : "➤"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvancedChatBox;
