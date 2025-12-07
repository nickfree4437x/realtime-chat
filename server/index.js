const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require("http");
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/roomRoutes');
const setupSocket = require("./sockets/socket");

dotenv.config();
connectDB();

const app = express();

// ----------------------------
// 🔥 EXPRESS CORS SETUP (VERY IMPORTANT)
// ----------------------------
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",

    // ⭐ Your FRONTEND (Vercel)
    "https://realtime-chat-beta-eight.vercel.app",

    // ⭐ Your BACKEND URL (Render)
    "https://realtime-chat-zb4l.onrender.com"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// ----------------------------
// 🔥 Initialize Socket.IO
// ----------------------------
const io = setupSocket(server);

// 🔥 Make io available inside Express
app.set("io", io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

// ----------------------------
// Routes
// ----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Test API
app.get('/', (req, res) => {
  res.send('API is working ✅');
});

// ----------------------------
// Start Server
// ----------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
