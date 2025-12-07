const { Server } = require("socket.io");
const Message = require("../models/Message");

let onlineUsers = {};
let activityLog = [];

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        // ⭐ LOCAL DEVELOPMENT
        "http://localhost:5173",
        "http://localhost:3000",

        // ⭐ YOUR FRONTEND (VERCEL)
        "https://realtime-chat-beta-eight.vercel.app",

        // ⭐ YOUR BACKEND (RENDER)
        "https://realtime-chat-zb4l.onrender.com"
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // -------------------------
    // JOIN ROOM
    // -------------------------
    socket.on("joinRoom", async ({ username, room }) => {
      socket.join(room);
      socket.username = username;
      socket.room = room;

      const [history, pinnedMessages] = await Promise.all([
        Message.find({ room, pinned: false })
          .sort({ timestamp: 1 })
          .limit(50),
        Message.find({ room, pinned: true })
          .sort({ timestamp: -1 })
      ]);

      socket.emit("chatHistory", [...pinnedMessages, ...history]);

      if (!onlineUsers[room]) onlineUsers[room] = [];
      if (!onlineUsers[room].includes(username)) {
        onlineUsers[room].push(username);
      }
      io.to(room).emit("onlineUsers", onlineUsers[room]);

      const joinLog = {
        type: "join",
        username,
        room,
        time: new Date().toISOString(),
      };
      activityLog.push(joinLog);
      io.to(room).emit("activityLog", joinLog);
    });

    // -------------------------
    // CHAT MESSAGE
    // -------------------------
    socket.on("chatMessage", async ({ username, room, message, replyTo = null }) => {
      try {
        const deliveredTo = (onlineUsers[room] || []).filter((u) => u !== username);

        const newMessage = await Message.create({
          username,
          room,
          message,
          seenBy: [],
          deliveredTo,
          replyTo,
        });

        io.to(room).emit("chatMessage", {
          ...newMessage.toObject(),
          reactions: new Map(),
        });

        socket.emit("messageDelivered", {
          messageId: newMessage._id,
          deliveredTo,
        });

        const msgLog = {
          type: "message",
          username,
          room,
          message,
          time: new Date().toISOString(),
        };
        activityLog.push(msgLog);
        io.to(room).emit("activityLog", msgLog);
      } catch (err) {
        console.error("❌ Error saving chatMessage:", err);
      }
    });

    // -------------------------
    // REACTIONS
    // -------------------------
    socket.on("addReaction", async ({ messageId, emoji, username, room }) => {
      try {
        const updated = await Message.findByIdAndUpdate(
          messageId,
          { $addToSet: { [`reactions.${emoji}`]: username } },
          { new: true }
        );

        io.to(room).emit("reactionAdded", {
          messageId,
          emoji,
          username,
          reactions: updated.reactions,
        });
      } catch (err) {
        console.error("❌ Error adding reaction:", err);
      }
    });

    socket.on("removeReaction", async ({ messageId, emoji, username, room }) => {
      try {
        const updated = await Message.findByIdAndUpdate(
          messageId,
          { $pull: { [`reactions.${emoji}`]: username } },
          { new: true }
        );

        io.to(room).emit("reactionRemoved", {
          messageId,
          emoji,
          username,
          reactions: updated.reactions,
        });
      } catch (err) {
        console.error("❌ Error removing reaction:", err);
      }
    });

    // -------------------------
    // PIN MESSAGE
    // -------------------------
    socket.on("togglePin", async ({ messageId, room }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        msg.pinned = !msg.pinned;
        await msg.save();

        io.to(room).emit("messagePinned", {
          messageId,
          pinned: msg.pinned,
        });
      } catch (err) {
        console.error("❌ Error toggling pin:", err);
      }
    });

    // -------------------------
    // SEARCH MESSAGES
    // -------------------------
    socket.on("searchMessages", async ({ room, query }) => {
      try {
        const results = await Message.find({
          room,
          $text: { $search: query },
        })
          .sort({ score: { $meta: "textScore" } })
          .limit(20);

        socket.emit(
          "searchResults",
          results.map((msg) => ({
            _id: msg._id,
            username: msg.username,
            message: msg.message,
            timestamp: msg.timestamp,
            pinned: msg.pinned,
          }))
        );
      } catch (err) {
        console.error("❌ Error searching messages:", err);
        socket.emit("searchResults", []);
      }
    });

    // -------------------------
    // SEEN STATUS
    // -------------------------
    socket.on("messageSeen", async ({ username, room }) => {
      try {
        const unseenMessages = await Message.find({
          room,
          username: { $ne: username },
          seenBy: { $ne: username },
        });

        const updatePromises = unseenMessages.map((msg) =>
          Message.updateOne({ _id: msg._id }, { $addToSet: { seenBy: username } })
        );

        await Promise.all(updatePromises);

        const updatedMessages = await Message.find({ room })
          .sort({ timestamp: 1 })
          .limit(50);

        io.to(room).emit("chatHistory", updatedMessages);
      } catch (error) {
        console.error("❌ Error updating seenBy:", error);
      }
    });

    // -------------------------
    // TYPING INDICATOR
    // -------------------------
    socket.on("typing", ({ room, username }) => {
      socket.broadcast.to(room).emit("userTyping", { username });
      if (socket.typingTimeout) clearTimeout(socket.typingTimeout);
      socket.typingTimeout = setTimeout(() => {
        socket.broadcast.to(room).emit("userStoppedTyping", { username });
      }, 3000);
    });

    socket.on("stopTyping", ({ room, username }) => {
      if (socket.typingTimeout) clearTimeout(socket.typingTimeout);
      socket.broadcast.to(room).emit("userStoppedTyping", { username });
    });

    // -------------------------
    // EDIT MESSAGE
    // -------------------------
    socket.on("editMessage", async ({ messageId, newContent, username, room }) => {
      try {
        const msg = await Message.findById(messageId);
        if (msg && msg.username === username) {
          msg.message = newContent;
          await msg.save();

          io.to(room).emit("messageEdited", {
            _id: msg._id,
            message: newContent,
            edited: true,
          });
        }
      } catch (err) {
        console.error("❌ Error editing message:", err);
      }
    });

    // -------------------------
    // DELETE MESSAGE
    // -------------------------
    socket.on("deleteMessage", async ({ messageId, username, room }) => {
      try {
        const msg = await Message.findById(messageId);
        if (msg && msg.username === username) {
          await Message.deleteOne({ _id: messageId });
          io.to(room).emit("messageDeleted", { _id: messageId });
        }
      } catch (err) {
        console.error("❌ Error deleting message:", err);
      }
    });

    // -------------------------
    // DISCONNECT
    // -------------------------
    socket.on("disconnect", () => {
      const { username, room } = socket;
      if (room && username) {
        onlineUsers[room] = (onlineUsers[room] || []).filter((u) => u !== username);
        io.to(room).emit("onlineUsers", onlineUsers[room]);

        const leaveLog = {
          type: "leave",
          username,
          room,
          time: new Date().toISOString(),
        };
        activityLog.push(leaveLog);
        io.to(room).emit("activityLog", leaveLog);
      }
    });
  });

  return io;
}

module.exports = setupSocket;
