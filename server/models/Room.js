const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Room names must be unique
  },
  type: {
    type: String,
    enum: ["public", "private"],
    default: "public",
  },
  password: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("Room", RoomSchema);
