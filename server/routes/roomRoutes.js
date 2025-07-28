const express = require("express");
const router = express.Router();
const {
  joinOrCreateRoom,
  getPublicRooms,
} = require("../controllers/roomController");

// Join or create a room with Socket.io support
router.post("/join", (req, res) => {
  const io = req.app.get("io"); // Get io instance
  joinOrCreateRoom(req, res, io); // Pass io to controller
});

// Get all public rooms
router.get("/public", getPublicRooms);

module.exports = router;
