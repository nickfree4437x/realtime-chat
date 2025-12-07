import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaDoorOpen, FaLock, FaArrowRight } from "react-icons/fa";
import "./SelectRoom.css";

const SelectRoom = () => {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [roomType, setRoomType] = useState("public");
  const [password, setPassword] = useState("");
  const [publicRooms, setPublicRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch public rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(" https://realtime-chat-zb4l.onrender.com/api/rooms/public");
        const data = await res.json();
        if (res.ok) {
          setPublicRooms(data.rooms || []);
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
      }
    };

    fetchRooms();
  }, []);

  const handleJoin = async () => {
    if (!username.trim() || !room.trim()) {
      setError("Please enter both username and room ID");
      return;
    }

    if (roomType === "private" && !password.trim()) {
      setError("Password required for private rooms");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(" https://realtime-chat-zb4l.onrender.com/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: room,
          roomType,
          password: roomType === "private" ? password : "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate(
          `/chat?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`
        );
      } else {
        setError(data.msg || "Failed to join room");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      setError("Something went wrong while joining the room.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleJoin();
  };

  const handleRoomSelect = (roomName) => {
    setRoom(roomName);
    setRoomType("public");
    setPassword("");
  };

  return (
    <div className="room-container">
      {/* Public Room Sidebar */}
      <div className="room-sidebar">
        <h3>Public Rooms</h3>
        <ul className="room-list">
          {publicRooms.length > 0 ? (
            publicRooms.map((r) => (
              <li key={r._id} onClick={() => handleRoomSelect(r.name)}>
                {r.name}
              </li>
            ))
          ) : (
            <p>No public rooms</p>
          )}
        </ul>
      </div>

      {/* Room Join Form */}
      <div className="room-card">
        <div className="room-header">
          <h2>Join a Chat Room</h2>
          <p>Connect with others in real-time</p>
        </div>

        <div className="input-group">
          <div className="input-icon"><FaUser /></div>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="input-group">
          <div className="input-icon"><FaDoorOpen /></div>
          <input
            type="text"
            placeholder="Enter room ID"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="input-group">
          <label>Room Type:</label>
          <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        {roomType === "private" && (
          <div className="input-group">
            <div className="input-icon"><FaLock /></div>
            <input
              type="password"
              placeholder="Enter room password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button onClick={handleJoin} className="join-button" disabled={isLoading}>
          {isLoading ? (
            <span className="spinner"></span>
          ) : (
            <>
              Join Chat <FaArrowRight className="arrow-icon" />
            </>
          )}
        </button>

        <div className="room-footer">
          <p>You can create or join public and private rooms.</p>
        </div>
      </div>

      <div className="room-illustration">
        <img 
          src="https://illustrations.popsy.co/amber/digital-nomad.svg" 
          alt="Chat Illustration" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/images/fallback-chat.svg";
          }}
        />
      </div>
    </div>
  );
};

export default SelectRoom;
