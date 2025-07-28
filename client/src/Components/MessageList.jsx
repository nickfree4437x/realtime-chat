import { useEffect, useRef, useState } from "react";
import { FaReply, FaCheck, FaCheckDouble } from "react-icons/fa";
import "./MessageList.css";

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
};

const formatDate = (timestamp) => {
  const today = new Date();
  const messageDate = new Date(timestamp);
  
  if (messageDate.toDateString() === today.toDateString()) {
    return "Today";
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  return messageDate.toLocaleDateString([], { 
    weekday: 'long',
    month: 'short', 
    day: 'numeric' 
  });
};

const MessageList = ({ messages, currentUser, onReply }) => {
  const messagesEndRef = useRef(null);
  const [localMessages, setLocalMessages] = useState([]);

  // Combine new messages with existing local messages
  useEffect(() => {
    setLocalMessages(prev => {
      const newMessages = messages.filter(
        msg => !prev.some(m => m._id === msg._id)
      );
      return [...prev, ...newMessages];
    });
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const getStatusIcon = (msg) => {
    if (msg.system) return null;
    const seenCount = msg.seenBy?.length || 0;
    return seenCount > 0 ? (
      <FaCheckDouble className="status-icon seen" />
    ) : (
      <FaCheck className="status-icon sent" />
    );
  };

  // Group messages by date
  const groupedMessages = localMessages.reduce((acc, message) => {
    const date = formatDate(message.timestamp);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {});

  return (
    <div className="message-list-container">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="message-date-group">
          <div className="date-divider">
            <span>{date}</span>
          </div>
          
          {dateMessages.map((msg) => {
            const isSender = msg.username === currentUser;
            const isSystem = msg.system;

            return (
              <div 
                key={msg._id}
                className={`message ${isSender ? "sent" : "received"} ${isSystem ? "system" : ""}`}
                data-id={msg._id}
              >
                {!isSender && !isSystem && (
                  <div className="message-sender">
                    <div className="sender-avatar">
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="sender-name">{msg.username}</span>
                  </div>
                )}

                {msg.replyTo && (
                  <div className="reply-preview">
                    <div className="reply-header">
                      <FaReply className="reply-icon" />
                      <span>Replying to {msg.replyTo.username}</span>
                    </div>
                    <div className="reply-content">{msg.replyTo.message}</div>
                  </div>
                )}

                <div className="message-bubble">
                  <div className="message-content">
                    {msg.message}
                  </div>
                  
                  <div className="message-footer">
                    <span className="timestamp">
                      {formatTime(msg.timestamp)}
                    </span>
                    {isSender && getStatusIcon(msg)}
                  </div>
                </div>

                {!isSystem && (
                  <button 
                    className="reply-button"
                    onClick={() => onReply(msg)}
                    aria-label="Reply"
                  >
                    <FaReply />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} className="scroll-anchor" />
    </div>
  );
};

export default MessageList;