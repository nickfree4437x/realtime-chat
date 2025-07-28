const Room = require("../models/Room");
const bcrypt = require("bcrypt");

// Join or create a room
const joinOrCreateRoom = async (req, res) => {
  const { roomName, roomType = "public", password = "" } = req.body;

  if (!roomName) {
    return res.status(400).json({ msg: "Room name is required" });
  }

  try {
    let room = await Room.findOne({ name: roomName });

    if (room) {
      // Room exists
      if (room.type === "private") {
        const isMatch = await bcrypt.compare(password, room.password);
        if (!isMatch) {
          return res.status(401).json({ msg: "Incorrect room password" });
        }
      }
      return res.status(200).json({ msg: "Joined existing room", room });
    }

    // Room doesn't exist - create new one
    const hashedPassword = roomType === "private"
      ? await bcrypt.hash(password, 10)
      : null;

    const newRoom = new Room({
      name: roomName,
      type: roomType,
      password: hashedPassword,
    });

    await newRoom.save();

    // ✅ Emit to all clients if PUBLIC room
    if (roomType === "public" && req.io) {
      req.io.emit("new-room-created", {
        name: newRoom.name,
        type: newRoom.type,
      });
    }

    return res.status(201).json({ msg: "Room created and joined", room: newRoom });
  } catch (error) {
    console.error("joinOrCreateRoom Error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Get all public rooms
const getPublicRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ type: "public" }).select("name type");
    return res.status(200).json({ rooms });
  } catch (error) {
    console.error("getPublicRooms Error:", error);
    return res.status(500).json({ msg: "Failed to fetch public rooms" });
  }
};

module.exports = {
  joinOrCreateRoom,
  getPublicRooms,
};
