import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "../styles/chat-page.css";

const ChatPage = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");
  const userId = JSON.parse(localStorage.getItem("user"))?._id;

  useEffect(() => {
    fetchConversationAndMessages();
    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchConversationAndMessages, 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversationAndMessages = async () => {
    try {
      console.log(`🔄 Fetching messages for conversation: ${conversationId}`);
      const response = await fetch(`/api/messages/${conversationId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      console.log(`   Response Status: ${response.status}`);

      const data = await response.json();
      console.log(`   Response Data:`, data);

      if (data.success) {
        setConversation(data.conversation);
        setMessages(data.messages);
        setError("");
        console.log(`✅ Loaded ${data.messages?.length || 0} messages`);
      } else {
        const errorMsg = data.message || "Failed to load conversation";
        console.error(`❌ Fetch failed: ${errorMsg}`);
        setError(errorMsg);
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      setError("Connection error. Unable to load conversation.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      setError("Message cannot be empty");
      return;
    }

    if (!token) {
      setError("Authentication error: No token found. Please login again.");
      return;
    }

    if (!conversationId) {
      setError("Error: Conversation ID not found");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      console.log("📤 Sending message...");
      console.log(`   Conversation ID: ${conversationId}`);
      console.log(`   Token: ${token.substring(0, 20)}...`);
      console.log(`   Content: ${messageText}`);

      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageText }),
      });

      console.log(`   Response Status: ${response.status}`);

      const data = await response.json();
      console.log(`   Response Data:`, data);

      if (!response.ok || !data.success) {
        const errorMsg = data.message || `Failed to send message (Status: ${response.status})`;
        console.error(`❌ Send failed: ${errorMsg}`);
        setError(errorMsg);
        return;
      }

      console.log("✅ Message sent successfully!");
      // Message sent successfully
      setMessages([...messages, data.message]);
      setMessageText("");
      setError("");
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setError(`Connection error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div className="chat-loading">Loading messages...</div>;

  // Find the other user
  const otherUser = conversation?.participants?.find(
    p => p._id !== userId
  );

  return (
    <div className="chat-page-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="header-content">
          {otherUser && (
            <>
              <img
                src={otherUser.profilePicture || "https://via.placeholder.com/50"}
                alt={otherUser.name}
              />
              <div>
                <h2>{otherUser.name}</h2>
                <p className="online-status">� Ready to chat</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`message ${message.senderId._id === userId ? "sent" : "received"}`}
            >
              <div className="message-bubble">
                <p>{message.content}</p>
                <span className="timestamp">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="chat-input-container">
        {error && <div className="chat-error-message">⚠️ {error}</div>}
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            type="text"
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              setError("");
            }}
            placeholder="Type your message..."
            className="message-input"
            disabled={isSending}
          />
          <button type="submit" className="send-btn" disabled={isSending}>
            {isSending ? "⏳ Sending..." : "📤 Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
