import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "../styles/chat-page.css";

const ChatPage = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
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
      const response = await fetch(`/api/messages/${conversationId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setConversation(conversation || { participants: data.messages[0]?.senderId });
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) return;

    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageText }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages([...messages, data.message]);
        setMessageText("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
                <p className="online-status">🟢 Online</p>
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
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          className="message-input"
        />
        <button type="submit" className="send-btn">
          📤 Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
