const express = require("express");
const router = express.Router();
const {
  joinOrCreateRoom,
  getPublicRooms,
} = require("../controllers/roomController");

// Join or create a room
router.post("/join", (req, res) => {
  joinOrCreateRoom(req, res);  // req.io auto-available
});

// Get all public rooms
router.get("/public", getPublicRooms);

module.exports = router;
