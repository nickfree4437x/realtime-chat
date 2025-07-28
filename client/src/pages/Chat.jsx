import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";
import ActivityLog from "../Components/ActivityLog";
import MessageList from "../Components/MessageList";
import { 
  FiSend, 
  FiSearch, 
  FiUsers, 
  FiMessageSquare,
  FiHash,
  FiX,
  FiChevronLeft,
  FiLogOut,
  FiInfo
} from "react-icons/fi";
import "./Chat.css";

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const username = query.get("username");
  const initialRoom = query.get("room");

  const [room, setRoom] = useState(initialRoom);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [publicRooms, setPublicRooms] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState("users"); // 'users' or 'activity'
  const [showRoomInfo, setShowRoomInfo] = useState(false);

  const handleStopTyping = useCallback(() => {
    socket.emit("stopTyping", { room, username });
  }, [room, username]);

  const handleTyping = useCallback(() => {
    if (message.trim()) {
      socket.emit("typing", { room, username });
    } else {
      handleStopTyping();
    }
  }, [room, username, message, handleStopTyping]);

  // Fetch public rooms
  const fetchPublicRooms = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/rooms/public");
      const data = await res.json();
      if (res.ok) setPublicRooms(data.rooms || []);
    } catch (err) {
      console.error("Error fetching public rooms:", err);
    }
  };

  const switchRoom = (newRoom) => {
    if (newRoom === room) return;
    socket.emit("leaveRoom", { username, room });
    setRoom(newRoom);
    setMessages([]);
    setActivityLogs([]);
    navigate(`/chat?username=${encodeURIComponent(username)}&room=${encodeURIComponent(newRoom)}`);
    setMobileSidebarOpen(false);
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom", { username, room });
    navigate("/select-room");
  };

  // Socket event handlers
  useEffect(() => {
    if (!username || !room) return navigate("/select-room");

    socket.connect();
    socket.emit("joinRoom", { username, room });
    fetchPublicRooms();

    // Event listeners
    const listeners = {
      chatHistory: setMessages,
      chatMessage: (data) => {
        setMessages(prev => [...prev, data]);
        setActivityLogs(prev => [
          ...prev, 
          { type: "message", username: data.username, time: new Date(data.timestamp), content: data.message }
        ]);
      },
      messageSeen: ({ messageId, seenBy }) => {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, seenBy } : msg
        ));
      },
      onlineUsers: setOnlineUsers,
      userTyping: ({ username: typingUser }) => {
        if (typingUser !== username) {
          setTypingUsers(prev => 
            prev.includes(typingUser) ? prev : [...prev, typingUser]
          );
        }
      },
      userStoppedTyping: ({ username: typingUser }) => {
        setTypingUsers(prev => prev.filter(u => u !== typingUser));
      },
      activity: (log) => {
        const logType = log.includes("joined") ? "join" : "leave";
        const name = log.split(" ")[0];
        setActivityLogs(prev => [
          ...prev,
          { type: logType, username: name, time: new Date(), content: log }
        ]);
      },
      searchResults: (results) => {
        setSearchResults(results);
        setShowSearchResults(true);
      }
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      handleStopTyping();
      Object.keys(listeners).forEach(event => socket.off(event));
      socket.disconnect();
    };
  }, [username, room, navigate, handleStopTyping]);

  // Auto-scroll and mark messages as seen
  useEffect(() => {
    const msgBox = document.getElementById("msgBox");
    if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;

    messages.forEach(msg => {
      if (!msg.system && msg.username !== username && 
          (!msg.seenBy || !msg.seenBy.includes(username))) {
        socket.emit("messageSeen", { username, room, messageId: msg._id });
      }
    });
  }, [messages, username, room]);

  const handleSend = () => {
    if (!message.trim()) return;
    handleStopTyping();
    socket.emit("chatMessage", { username, room, message });
    setMessage("");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      socket.emit("searchMessages", { room, query: searchQuery });
    }
  };

  return (
    <div className="chat-app">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="sidebar-toggle"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          <FiChevronLeft className={`toggle-icon ${mobileSidebarOpen ? "open" : ""}`} />
          <span>{room}</span>
        </button>
        <div className="mobile-actions">
          <button 
            className={`sidebar-switch ${activeSidebar === "users" ? "active" : ""}`}
            onClick={() => setActiveSidebar("users")}
          >
            <FiUsers />
          </button>
          <button 
            className={`sidebar-switch ${activeSidebar === "activity" ? "active" : ""}`}
            onClick={() => setActiveSidebar("activity")}
          >
            <FiMessageSquare />
          </button>
        </div>
      </div>

      <div className={`chat-container ${mobileSidebarOpen ? "sidebar-open" : ""}`}>
        {/* Rooms Sidebar */}
        <div className="rooms-sidebar">
          <div className="sidebar-header">
            <h3>Public Rooms</h3>
            <button className="leave-room-btn" onClick={leaveRoom}>
              <FiLogOut /> Leave
            </button>
          </div>
          <div className="room-list">
            {publicRooms.map(r => (
              <div
                key={r._id}
                className={`room-item ${r.name === room ? "active" : ""}`}
                onClick={() => switchRoom(r.name)}
              >
                <FiHash className="room-icon" />
                <span>{r.name}</span>
                <span className="room-count">{r.userCount || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          <div className="chat-header">
            <div className="header-content">
              <h2>
                <FiHash className="room-icon" />
                {room}
                <button 
                  className="info-btn"
                  onClick={() => setShowRoomInfo(!showRoomInfo)}
                >
                  <FiInfo />
                </button>
              </h2>
              {showRoomInfo && (
                <div className="room-info">
                  <p>Room: <strong>{room}</strong></p>
                  <p>Your username: <strong>{username}</strong></p>
                  <p>Online users: <strong>{onlineUsers.length}</strong></p>
                  <button 
                    className="leave-room-btn"
                    onClick={leaveRoom}
                  >
                    <FiLogOut /> Leave Room
                  </button>
                </div>
              )}
              <div className="header-actions">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyUp={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <button onClick={handleSearch}>
                    <FiSearch />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Modal */}
          {showSearchResults && (
            <div className="search-modal">
              <div className="search-modal-content">
                <div className="modal-header">
                  <h3>Search Results</h3>
                  <button 
                    className="close-modal"
                    onClick={() => setShowSearchResults(false)}
                  >
                    <FiX />
                  </button>
                </div>
                <div className="results-container">
                  {searchResults.length > 0 ? (
                    searchResults.map(msg => (
                      <div key={msg._id} className="result-item">
                        <div className="result-meta">
                          <span className="result-user">{msg.username}</span>
                          <span className="result-time">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                          {msg.pinned && <span className="result-pin">📌</span>}
                        </div>
                        <p className="result-message">{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">No messages found</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="messages-container" id="msgBox">
            <MessageList
              messages={messages}
              currentUser={username}
              setMessages={setMessages}
              onReply={(msg) => setMessage(`@${msg.username}: `)}
            />
          </div>

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <span>
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing`
                  : `${typingUsers.join(", ")} are typing`}
              </span>
            </div>
          )}

          {/* Message Input */}
          <div className="message-input">
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyUp={(e) => e.key === "Enter" && handleSend()}
              onBlur={handleStopTyping}
              placeholder={`Message #${room}`}
            />
            <button 
              className="send-button"
              onClick={handleSend}
              disabled={!message.trim()}
            >
              <FiSend />
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="right-sidebar">
          {/* Users Panel */}
          <div className={`sidebar-panel ${activeSidebar === "users" ? "active" : ""}`}>
            <div className="panel-header">
              <h3>
                <FiUsers className="panel-icon" />
                Online Users ({onlineUsers.length})
              </h3>
            </div>
            <div className="user-list">
              {onlineUsers.map((user, idx) => (
                <div
                  key={idx}
                  className={`user-item ${user === username ? "current-user" : ""}`}
                >
                  <div className="user-avatar"></div>
                  <span className="user-name">{user}</span>
                  {user === username && <span className="user-you">(You)</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Activity Panel */}
          <div className={`sidebar-panel ${activeSidebar === "activity" ? "active" : ""}`}>
            <div className="panel-header">
              <h3>
                <FiMessageSquare className="panel-icon" />
                Room Activity
              </h3>
            </div>
            <div className="activity-log-container">
              <ActivityLog logs={activityLogs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;