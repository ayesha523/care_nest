import React, { useState } from "react";

function ChatBox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="chat-icon" onClick={() => setOpen(!open)}>
        💬
      </div>

      {open && (
        <div className="chat-window">
          <h4>CareNest Live Chat</h4>
          <p>We are live and ready to chat.</p>
          <input type="text" placeholder="Type your message..." />
        </div>
      )}
    </>
  );
}

export default ChatBox;
